import { UseFilters } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { WsExceptionsFilter } from '../common/ws-exceptions.filter.js';

@WebSocketGateway({ cors: true })
@UseFilters(WsExceptionsFilter)
export class OrdersGateway {
  constructor(private orderService: OrdersService) {}

  @SubscribeMessage('orders/create')
  async handleMessage(@MessageBody() payload: CreateOrderDto) {
    const order = await this.orderService.create(payload);
    return order;
  }
}
