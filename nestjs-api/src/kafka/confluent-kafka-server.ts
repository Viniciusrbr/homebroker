import {
  CustomTransportStrategy,
  KafkaHeaders,
  KafkaParser,
  KafkaParserConfig,
  KafkaRetriableException,
  OutgoingResponse,
  ReadPacket,
  Server,
} from '@nestjs/microservices';
import * as kafkaLib from '@confluentinc/kafka-javascript';
import { Logger } from '@nestjs/common';
import { KafkaRequestDeserializer } from '@nestjs/microservices/deserializers/kafka-request.deserializer';
import { KafkaRequestSerializer } from '@nestjs/microservices/serializers/kafka-request.serializer';
import { Deserializer } from '@nestjs/microservices/interfaces/deserializer.interface';
import { Serializer } from '@nestjs/microservices/interfaces/serializer.interface';
import {
  KAFKA_DEFAULT_CLIENT,
  KAFKA_DEFAULT_GROUP,
  NO_EVENT_HANDLER,
  NO_MESSAGE_HANDLER,
} from '@nestjs/microservices/constants';
import {
  EachMessagePayload,
  KafkaMessage,
  Message,
  RecordMetadata,
} from '@nestjs/microservices/external/kafka.interface';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { isObservable, lastValueFrom, Observable, ReplaySubject } from 'rxjs';
import { ConfluentKafkaContext } from './confluent-kafka-context.js';

type MakePropRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type MakePropOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type KafkaServerOptions = {
  server: MakePropRequired<
    kafkaLib.KafkaJS.CommonConstructorConfig,
    'bootstrap.servers'
  >;
  consumer?: MakePropOptional<kafkaLib.KafkaJS.ConsumerConfig, 'groupId'>;
  subscribe?: kafkaLib.KafkaJS.ConsumerSubscribeTopics;
  run?: kafkaLib.KafkaJS.ConsumerRunConfig;
  producer?: kafkaLib.KafkaJS.ProducerConfig;
  parser?: KafkaParserConfig;
  serializer?: Serializer;
  deserializer?: Deserializer;
  postfixId?: string;
};

export class ConfluentKafkaServer
  extends Server
  implements CustomTransportStrategy
{
  public readonly logger = new Logger(ConfluentKafkaServer.name);

  protected client: kafkaLib.KafkaJS.Kafka;
  protected consumer: kafkaLib.KafkaJS.Consumer;
  protected producer: kafkaLib.KafkaJS.Producer;
  protected admin: kafkaLib.KafkaJS.Admin;
  protected parser: KafkaParser;
  protected clientId: string;
  protected groupId: string;

  constructor(protected readonly options: KafkaServerOptions) {
    super();

    const { postfixId = '-server' } = this.options;
    this.clientId =
      (this.options.server?.['client.id'] || KAFKA_DEFAULT_CLIENT) + postfixId;
    this.groupId =
      (this.options.consumer?.groupId || KAFKA_DEFAULT_GROUP) + postfixId;

    this.parser = new KafkaParser(options.parser || {});

    this.initializeSerializer(options.serializer);
    this.initializeDeserializer(options.deserializer);
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(
    callback?: (err?: unknown, ...optionalParams: unknown[]) => void,
  ) {
    try {
      this.client = this.createClient();
      await this.start(callback);
    } catch (e) {
      callback && callback(e);
    }
  }

  public createClient() {
    return new kafkaLib.KafkaJS.Kafka({
      ...this.options.server,
      'client.id': this.clientId,
      'allow.auto.create.topics': true,
    });
  }

  public async start(callback?: () => void) {
    this.consumer = this.client.consumer({
      kafkaJS: {
        ...(this.options.consumer || {}),
        groupId: this.groupId,
      },
    });
    this.producer = this.client.producer({
      kafkaJS: this.options.producer || {},
    });
    this.admin = this.client.admin();
    await Promise.all([
      this.consumer.connect(),
      this.producer.connect(),
      this.admin.connect(),
    ]);
    await this.bindEvents(this.consumer);
    callback && callback();
  }

  public async bindEvents(consumer: kafkaLib.KafkaJS.Consumer) {
    const registeredPatterns = [...this.messageHandlers.keys()];
    const consumerSubscribeOptions = this.options.subscribe || {};

    if (registeredPatterns.length > 0) {
      this.options.consumer?.allowAutoTopicCreation === true &&
        (await Promise.all(
          registeredPatterns.map(async (pattern) => {
            await this.admin.createTopics({ topics: [{ topic: pattern }] });
          }),
        ));
      await this.consumer.subscribe({
        ...consumerSubscribeOptions,
        topics: registeredPatterns,
      });
    }

    const consumerRunOptions = Object.assign(this.options.run || {}, {
      eachMessage: this.getMessageHandler(),
    });

    await consumer.run(consumerRunOptions);
  }

  public getMessageHandler() {
    return async (payload: EachMessagePayload) => this.handleMessage(payload);
  }

  public async handleMessage(payload: EachMessagePayload) {
    const channel = payload.topic;
    const rawMessage = this.parser.parse<KafkaMessage>(
      Object.assign(payload.message, {
        topic: payload.topic,
        partition: payload.partition,
      }),
    );
    const headers = rawMessage.headers as unknown as Record<string, any>;
    const correlationId = headers[KafkaHeaders.CORRELATION_ID];
    const replyTopic = headers[KafkaHeaders.REPLY_TOPIC];
    const replyPartition = headers[KafkaHeaders.REPLY_PARTITION];

    const packet = await this.deserializer.deserialize(rawMessage, { channel });
    const kafkaContext = new ConfluentKafkaContext([
      rawMessage,
      payload.partition,
      payload.topic,
      this.consumer,
      payload.heartbeat,
      this.producer,
    ]);
    const handler = this.getHandlerByPattern(packet.pattern);
    // if the correlation id or reply topic is not set
    // then this is an event (events could still have correlation id)
    if (handler?.isEventHandler || !correlationId || !replyTopic) {
      return this.handleEvent(packet.pattern, packet, kafkaContext);
    }

    const publish = this.getPublisher(
      replyTopic,
      replyPartition,
      correlationId,
    );

    if (!handler) {
      return publish({
        id: correlationId,
        err: NO_MESSAGE_HANDLER,
      });
    }

    const response$ = this.transformToObservable(
      handler(packet.data, kafkaContext),
    );

    const replayStream$ = new ReplaySubject();
    await this.combineStreamsAndThrowIfRetriable(response$, replayStream$);

    this.send(replayStream$, publish);
  }

  public async handleEvent(
    pattern: string,
    packet: ReadPacket,
    context: ConfluentKafkaContext,
  ): Promise<any> {
    const handler = this.getHandlerByPattern(pattern);
    if (!handler) {
      return this.logger.error(NO_EVENT_HANDLER`${pattern}`);
    }
    const resultOrStream = await handler(packet.data, context);
    if (isObservable(resultOrStream)) {
      await lastValueFrom(resultOrStream);
    }
  }

  public getPublisher(
    replyTopic: string,
    replyPartition: string,
    correlationId: string,
  ): (data: any) => Promise<RecordMetadata[]> {
    return (data: any) =>
      this.sendMessage(data, replyTopic, replyPartition, correlationId);
  }

  public async sendMessage(
    message: OutgoingResponse,
    replyTopic: string,
    replyPartition: string,
    correlationId: string,
  ): Promise<RecordMetadata[]> {
    const outgoingMessage = await this.serializer.serialize(message.response);
    this.assignReplyPartition(replyPartition, outgoingMessage);
    this.assignCorrelationIdHeader(correlationId, outgoingMessage);
    this.assignErrorHeader(message, outgoingMessage);
    this.assignIsDisposedHeader(message, outgoingMessage);

    return this.producer.send({
      topic: replyTopic,
      messages: [outgoingMessage],
    });
  }

  public assignIsDisposedHeader(
    outgoingResponse: OutgoingResponse,
    outgoingMessage: Message,
  ) {
    if (!outgoingResponse.isDisposed) {
      return;
    }
    //@ts-expect-error - headers exists
    outgoingMessage.headers[KafkaHeaders.NEST_IS_DISPOSED] = Buffer.alloc(1);
  }

  public assignCorrelationIdHeader(
    correlationId: string,
    outgoingMessage: Message,
  ) {
    //@ts-expect-error - headers exists
    outgoingMessage.headers[KafkaHeaders.CORRELATION_ID] =
      Buffer.from(correlationId);
  }

  public assignReplyPartition(
    replyPartition: string,
    outgoingMessage: Message,
  ) {
    if (isNil(replyPartition)) {
      return;
    }
    outgoingMessage.partition = parseFloat(replyPartition);
  }

  public assignErrorHeader(
    outgoingResponse: OutgoingResponse,
    outgoingMessage: Message,
  ) {
    if (!outgoingResponse.err) {
      return;
    }
    const stringifiedError =
      typeof outgoingResponse.err === 'object'
        ? JSON.stringify(outgoingResponse.err)
        : outgoingResponse.err;
    //@ts-expect-error - headers exists
    outgoingMessage.headers[KafkaHeaders.NEST_ERR] =
      Buffer.from(stringifiedError);
  }

  protected combineStreamsAndThrowIfRetriable(
    response$: Observable<any>,
    replayStream$: ReplaySubject<unknown>,
  ) {
    return new Promise<void>((resolve, reject) => {
      let isPromiseResolved = false;
      response$.subscribe({
        next: (val) => {
          replayStream$.next(val);
          if (!isPromiseResolved) {
            isPromiseResolved = true;
            resolve();
          }
        },
        error: (err) => {
          if (err instanceof KafkaRetriableException && !isPromiseResolved) {
            isPromiseResolved = true;
            reject(err);
          } else {
            resolve();
          }
          replayStream$.error(err);
        },
        complete: () => replayStream$.complete(),
      });
    });
  }

  /**
   * This method is triggered on application shutdown.
   */
  async close() {
    await Promise.all([
      this.consumer?.disconnect(),
      this.producer?.disconnect(),
      this.admin?.disconnect(),
    ]);
    this.consumer = null as any;
    this.producer = null as any;
    this.admin = null as any;
    this.client = null as any;
  }

  protected initializeSerializer(serializer?: Serializer) {
    this.serializer = serializer || new KafkaRequestSerializer();
  }

  protected initializeDeserializer(deserializer?: Deserializer) {
    this.deserializer = deserializer || new KafkaRequestDeserializer();
  }

  on(event: any, callback: any): any {
    throw new Error('Not implemented');
  }
  /**
   * Returns an instance of the underlying server/broker instance,
   * or a group of servers if there are more than one.
   */
  unwrap<T>(): T {
    throw new Error('Not implemented');
  }
}
