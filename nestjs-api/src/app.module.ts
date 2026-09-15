import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletsModule } from './wallets/wallets.module.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:root@localhost:27017/nest?authSource=admin&directConnection=true'),
    AssetsModule,
    WalletsModule,
    OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
