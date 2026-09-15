import { Controller, Get, Post, Body, Param, } from '@nestjs/common';
import { WalletsService } from './wallets.service.js';
import { CreateWalletDto } from './dto/create-wallet.dto.js';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @Get()
  findAll() {
    return this.walletsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @Post(':id/assets')
  createWalletAsset(@Param('id') id: string, @Body() body: { assetId: string, shares: number }) {
    return this.walletsService.createWalletAsset({
      walletId: id,
      assetId: body.assetId,
      shares: body.shares
    });
  }
}
