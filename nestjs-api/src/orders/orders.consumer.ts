import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderStatus, OrderType } from './entities/order.entity.js';
import { OrdersService } from './orders.service.js';

export type TradeKafkaMessage = {
  order_id: string;
  investor_id: string;
  asset_id: string;
  order_type: OrderType;
  status: OrderStatus.OPEN | OrderStatus.CLOSED;
  partial: number;
  shares: number;
  transactions: {
    transaction_id: string;
    buyer_id: string;
    seller_id: string;
    asset_id: string;
    shares: number;
    price: number;
  }[];
};

@Controller()
export class OrderConsumer {
  constructor(private ordersService: OrdersService) {}

  @EventPattern('output')
  async handleTrade(@Payload() message: TradeKafkaMessage) {
    // a mensagem traz todas as transações da ordem, não só a mais recente: o simulador
    // serializa a ordem depois de enviá-la ao canal e ela pode já ter um negócio a mais.
    // createTrade ignora as transações já registradas.
    const lastIndex = message.transactions.length - 1;
    for (const [index, transaction] of message.transactions.entries()) {
      await this.ordersService.createTrade({
        orderId: message.order_id,
        status: index === lastIndex ? message.status : OrderStatus.OPEN,
        relatedInvestorId:
          message.order_type === OrderType.BUY
            ? transaction.seller_id
            : transaction.buyer_id,
        brokerTradeId: transaction.transaction_id,
        shares: transaction.shares,
        price: transaction.price,
        date: new Date(),
      });
    }
  }
}
