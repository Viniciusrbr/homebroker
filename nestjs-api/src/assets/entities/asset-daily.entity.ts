import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Asset } from './asset.entity.js';

export type AssetDailyDocument = HydratedDocument<AssetDaily>;
//order trade
// - mudança de preço do ativo
// - um novo registro do asset daily
@Schema({ timestamps: true })
export class AssetDaily {
  @Prop({ default: () => crypto.randomUUID() })
  _id: string;

  @Prop({ type: mongoose.Schema.Types.String, ref: Asset.name })
  asset: Asset | string;

  @Prop()
  date: Date;

  @Prop()
  price: number;
}

export const AssetDailySchema = SchemaFactory.createForClass(AssetDaily);
