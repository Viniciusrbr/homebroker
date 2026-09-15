import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import crypto from "crypto";
import mongoose, { HydratedDocument } from "mongoose";
import { WalletAsset, WalletAssetDocument } from "./wallet-asset.entity.js";

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ default: () => crypto.randomUUID() })
  _id: string;

  @Prop({
    type: [mongoose.Schema.Types.String],
    // proteção contra duplicatas, garantindo que cada ativo seja único dentro da carteira
    set: (v: (WalletAssetDocument | string)[]) => [...new Set(v)],
    ref: WalletAsset.name,
  })
  assets: WalletAssetDocument[] | string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);