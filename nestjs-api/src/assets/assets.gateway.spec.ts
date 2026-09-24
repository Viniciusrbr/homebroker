import { Test, TestingModule } from '@nestjs/testing';
import { AssetsGateway } from './assets.gateway.js';

describe('AssetsGateway', () => {
  let gateway: AssetsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsGateway],
    }).compile();

    gateway = module.get<AssetsGateway>(AssetsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
