import { Test, TestingModule } from '@nestjs/testing';
import { AssetsGateway } from './assets.gateway.js';
import { AssetsService } from './assets.service.js';

describe('AssetsGateway', () => {
  let gateway: AssetsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsGateway, { provide: AssetsService, useValue: {} }],
    }).compile();

    gateway = module.get<AssetsGateway>(AssetsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
