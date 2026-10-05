import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssetsModule } from './assets/assets.module.js';
import { WalletsModule } from './wallets/wallets.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfirmGenerateOrders, ConfirmGenerateOrdersClosed, SimulateAssetsPriceCommand } from './simulate-assets-price.command.js';


@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URL ??
        'mongodb://root:root@localhost:27017/nest?authSource=admin&directConnection=true',
    ),
    AssetsModule,
    WalletsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SimulateAssetsPriceCommand,
    ConfirmGenerateOrders,
    ConfirmGenerateOrdersClosed,
  ],
})
export class CommandModule { }