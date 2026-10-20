import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AssetDailiesService } from './asset-dalies.service.js';
import { CreateAssetDailyDto } from './dto/create-asset-daily.dto.js';

@Controller('assets/:symbol/dailies')
export class AssetsDailiesController {
  constructor(private assetsDailiesService: AssetDailiesService) {}

  @Get()
  findAll(@Param('symbol') symbol: string) {
    return this.assetsDailiesService.findAll(symbol);
  }

  @Post()
  create(
    @Body() dto: CreateAssetDailyDto,
    @Param('symbol') symbol: string,
  ) {
    return this.assetsDailiesService.create({
      symbol,
      date: new Date(dto.date),
      price: dto.price,
    });
  }
}
