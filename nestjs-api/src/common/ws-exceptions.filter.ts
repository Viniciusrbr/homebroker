import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  type WsExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

// O ValidationPipe global também valida os gateways, mas lança BadRequestException,
// que o filtro padrão do Nest devolve como "Internal server error". Aqui o erro vira
// { status: 'error', message } e é respondido pelo ack quando o cliente usou
// emitWithAck (senão ele só receberia o timeout); sem ack, emite o evento `exception`.
@Catch(WsException, BadRequestException)
export class WsExceptionsFilter implements WsExceptionFilter {
  catch(exception: WsException | BadRequestException, host: ArgumentsHost) {
    const message =
      exception instanceof BadRequestException
        ? (exception.getResponse() as { message: string | string[] }).message
        : exception.getError();
    const payload = { status: 'error', message };
    const ack = host.getArgByIndex<unknown>(2);

    if (typeof ack === 'function') {
      ack(payload);
      return;
    }

    host.switchToWs().getClient<Socket>().emit('exception', payload);
  }
}
