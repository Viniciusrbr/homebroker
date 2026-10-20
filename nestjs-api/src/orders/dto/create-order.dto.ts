import { IsEnum, IsInt, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { OrderType } from '../entities/order.entity.js';

export class CreateOrderDto {
  @IsUUID()
  walletId: string;

  @IsUUID()
  assetId: string;

  @IsInt()
  @IsPositive()
  shares: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsEnum(OrderType)
  type: OrderType;
}
