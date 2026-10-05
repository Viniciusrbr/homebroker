import { OrderStatus } from '../entities/order.entity.js';

export class CreateTradeDto {
  orderId: string;
  status: OrderStatus.OPEN | OrderStatus.CLOSED;
  relatedInvestorId: string;
  brokerTradeId: string;
  shares: number;
  price: number;
  date: Date;
}
