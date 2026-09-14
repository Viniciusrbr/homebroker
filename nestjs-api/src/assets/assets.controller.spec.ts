import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

describe('AssetsController', () => {
  let controller: AssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [AssetsService],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
