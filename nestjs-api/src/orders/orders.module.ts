import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: Order.name,
          schema: OrderSchema
        }
      ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }
