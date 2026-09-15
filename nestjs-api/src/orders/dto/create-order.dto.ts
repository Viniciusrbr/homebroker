import { OrderType } from "../entities/order.entity.js";

export class CreateOrderDto {
  walletId: string;
  assetId: string;
  shares: number;
  price: number;
  type: OrderType;
}
