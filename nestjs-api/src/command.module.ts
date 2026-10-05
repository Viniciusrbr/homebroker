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
      'mongodb://root:root@localhost:27017/nest?authSource=admin',
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