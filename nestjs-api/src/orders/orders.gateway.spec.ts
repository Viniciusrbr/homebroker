import { Test, TestingModule } from '@nestjs/testing';
import { OrdersGateway } from './orders.gateway.js';

describe('OrdersGateway', () => {
  let gateway: OrdersGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersGateway],
    }).compile();

    gateway = module.get<OrdersGateway>(OrdersGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
