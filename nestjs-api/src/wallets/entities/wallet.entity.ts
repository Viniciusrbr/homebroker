import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import crypto from "crypto";
import { HydratedDocument } from "mongoose";

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ default: () => crypto.randomUUID() })
  _id: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);