import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { OrderDocument } from './order.entity.js';

export type TradeDocument = HydratedDocument<Trade>;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ default: () => crypto.randomUUID() })
  _id: string;

  @Prop({ type: mongoose.Schema.Types.String, ref: 'Order' })
  order: OrderDocument | string;

  @Prop({ type: mongoose.Schema.Types.String })
  related_investor_id: string;

  @Prop()
  broker_trade_id: string;

  @Prop({ type: mongoose.Schema.Types.Int32 })
  shares: number;

  @Prop()
  price: number;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
