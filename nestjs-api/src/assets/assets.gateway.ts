import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { AssetsService } from './assets.service.js';
import { Logger, UseFilters } from '@nestjs/common';
import { AssetPresenter } from './asset.presenter.js';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';

import { AssetDailiesService } from './asset-dalies.service.js';
import { AssetDailyPresenter } from './asset-daily.presenter.js';
import { JoinAssetDto, JoinAssetsDto } from './dto/join-asset.dto.js';
import { WsExceptionsFilter } from '../common/ws-exceptions.filter.js';

@WebSocketGateway({ cors: true })
@UseFilters(WsExceptionsFilter)
export class AssetsGateway implements OnGatewayInit {
  logger = new Logger(AssetsGateway.name);

  // salas de ativos com ao menos um cliente; os Change Streams só ficam abertos enquanto houver alguma
  private assetRooms = new Set<string>();
  private changeStreams?: Subscription;

  constructor(
    private assetsService: AssetsService,
    private assetsDailiesService: AssetDailiesService,
  ) {}

  afterInit(server: Server) {
    const namespace = server.sockets;

    // o adapter cria a sala no primeiro join e a apaga quando o último cliente sai ou desconecta.
    // Todo socket também tem uma sala privada com o próprio id, que não é sala de ativo.
    namespace.adapter.on('create-room', (room: string) => {
      if (namespace.sockets.has(room)) {
        return;
      }
      this.assetRooms.add(room);
      if (this.assetRooms.size === 1) {
        this.openChangeStreams(server);
      }
    });

    namespace.adapter.on('delete-room', (room: string) => {
      if (this.assetRooms.delete(room) && this.assetRooms.size === 0) {
        this.closeChangeStreams();
      }
    });
  }

  private openChangeStreams(server: Server) {
    this.logger.log('Opening asset change streams');

    this.changeStreams = this.assetsService
      .subscribeNewPriceChangedEvents()
      .subscribe((asset) => {
        if (!this.assetRooms.has(asset.symbol)) {
          return;
        }
        server
          .to(asset.symbol)
          .emit('assets/price-changed', new AssetPresenter(asset).toJSON());
      });

    this.changeStreams.add(
      this.assetsDailiesService
        .subscribeCreatedEvents()
        .subscribe((assetDaily) => {
          if (!this.assetRooms.has(assetDaily.asset.symbol)) {
            return;
          }
          server
            .to(assetDaily.asset.symbol)
            .emit(
              'assets/daily-created',
              new AssetDailyPresenter(assetDaily).toJSON(),
            );
        }),
    );
  }

  private closeChangeStreams() {
    this.logger.log('Closing asset change streams: no subscribed clients');
    this.changeStreams?.unsubscribe();
    this.changeStreams = undefined;
  }

  @SubscribeMessage('joinAssets')
  handleJoinAssets(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetsDto,
  ) {
    if (!payload.symbols?.length) {
      return;
    }
    payload.symbols.forEach((symbol) => client.join(symbol));
    this.logger.log(
      `Client ${client.id} joined asset: ${payload.symbols.join(', ')}`,
    );
  }

  @SubscribeMessage('joinAsset')
  handleJoinAsset(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetDto,
  ) {
    client.join(payload.symbol);
    this.logger.log(`Client ${client.id} joined asset: ${payload.symbol}`);
  }

  @SubscribeMessage('leaveAssets')
  handleLeaveAssets(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetsDto,
  ) {
    if (!payload.symbols?.length) {
      return;
    }
    payload.symbols.forEach((symbol) => client.leave(symbol));
    this.logger.log(
      `Client ${client.id} left assets: ${payload.symbols.join(', ')}`,
    );
  }

  @SubscribeMessage('leaveAsset')
  handleLeaveAsset(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetDto,
  ) {
    client.leave(payload.symbol);
    this.logger.log(`Client ${client.id} left asset: ${payload.symbol}`);
  }
}
