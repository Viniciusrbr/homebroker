import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { AssetsController } from './assets.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from './entities/asset.entity.js';
import { AssetsGateway } from './assets.gateway.js';
import { AssetDaily, AssetDailySchema } from './entities/asset-daily.entity.js';
import { AssetDailiesService } from './asset-dalies.service.js';
import { AssetsDailiesController } from './asset-dailies.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: AssetDaily.name, schema: AssetDailySchema },
    ]),
  ],
  controllers: [AssetsController, AssetsDailiesController],
  providers: [AssetsService, AssetsGateway, AssetDailiesService],
})
export class AssetsModule { }
