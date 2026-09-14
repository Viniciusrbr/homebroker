import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { AssetsController } from './assets.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from './entities/asset.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Asset.name, schema: AssetSchema }])
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule { }
