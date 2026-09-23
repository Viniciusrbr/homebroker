import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { OrdersService } from './orders.service.js';

@WebSocketGateway({ cors: true })
export class OrdersGateway {

  constructor(private orderService: OrdersService) { }

  @SubscribeMessage('orders/create')

  async handleMessage(client: any, payload: any) {

    const order = await this.orderService.create({
      assetId: payload.assetId,
      walletId: payload.walletId,
      type: payload.type,
      shares: payload.shares,
      price: payload.price,
    })
    return order
  }
}
