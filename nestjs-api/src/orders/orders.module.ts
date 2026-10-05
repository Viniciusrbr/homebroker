import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity.js';
import { OrdersGateway } from './orders.gateway.js';
import { OrderConsumer } from './orders.consumer.js';
import { Trade, TradeSchema } from './entities/trade.entity.js';
import { Asset, AssetSchema } from '../assets/entities/asset.entity.js';
import {
  AssetDaily,
  AssetDailySchema,
} from '../assets/entities/asset-daily.entity.js';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity.js';
import {
  WalletAsset,
  WalletAssetSchema,
} from '../wallets/entities/wallet-asset.entity.js';
import * as kafkaLib from '@confluentinc/kafka-javascript';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Trade.name,
        schema: TradeSchema,
      },
      { name: Asset.name, schema: AssetSchema },
      { name: AssetDaily.name, schema: AssetDailySchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletAsset.name, schema: WalletAssetSchema },
    ]),
  ],
  controllers: [OrdersController, OrderConsumer],
  providers: [
    OrdersService,
    OrdersGateway,
    {
      provide: kafkaLib.KafkaJS.Kafka,
      useFactory() {
        return new kafkaLib.KafkaJS.Kafka({
          'bootstrap.servers': 'localhost:9094',
        });
      },
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
