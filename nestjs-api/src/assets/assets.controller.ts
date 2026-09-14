import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Post()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @Get()
  findAll() {
    return this.assetsService.findAll();
  }

  @Get(':symbol')
  findOne(@Param('symbol') symbol: string) {
    return this.assetsService.findOne(symbol);
  }
}
