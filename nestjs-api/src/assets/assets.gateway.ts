import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { AssetsService } from './assets.service.js';
import { Logger, UseFilters } from '@nestjs/common';
import { AssetPresenter } from './asset.presenter.js';
import { Server, Socket } from 'socket.io';

import { AssetDailiesService } from './asset-dalies.service.js';
import { AssetDailyPresenter } from './asset-daily.presenter.js';
import { JoinAssetDto, JoinAssetsDto } from './dto/join-asset.dto.js';
import { WsExceptionsFilter } from '../common/ws-exceptions.filter.js';

@WebSocketGateway({ cors: true })
@UseFilters(WsExceptionsFilter)
export class AssetsGateway implements OnGatewayInit {
  logger = new Logger(AssetsGateway.name);

  constructor(
    private assetsService: AssetsService,
    private assetsDailiesService: AssetDailiesService,
  ) {}

  afterInit(server: Server) {
    this.assetsService.subscribeNewPriceChangedEvents().subscribe((asset) => {
      server
        .to(asset.symbol)
        .emit('assets/price-changed', new AssetPresenter(asset).toJSON());
    });

    this.assetsDailiesService
      .subscribeCreatedEvents()
      .subscribe((assetDaily) => {
        server
          .to(assetDaily.asset.symbol)
          .emit(
            'assets/daily-created',
            new AssetDailyPresenter(assetDaily).toJSON(),
          );
      });
  }

  @SubscribeMessage('joinAssets')
  handleJoinAssets(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetsDto,
  ) {
    if (!payload.symbols?.length) {
      return;
    }
    payload.symbols.forEach((symbol) => client.join(symbol));
    this.logger.log(
      `Client ${client.id} joined asset: ${payload.symbols.join(', ')}`,
    );
  }

  @SubscribeMessage('joinAsset')
  handleJoinAsset(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetDto,
  ) {
    client.join(payload.symbol);
    this.logger.log(`Client ${client.id} joined asset: ${payload.symbol}`);
  }

  @SubscribeMessage('leaveAssets')
  handleLeaveAssets(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetsDto,
  ) {
    if (!payload.symbols?.length) {
      return;
    }
    payload.symbols.forEach((symbol) => client.leave(symbol));
    this.logger.log(
      `Client ${client.id} left assets: ${payload.symbols.join(', ')}`,
    );
  }

  @SubscribeMessage('leaveAsset')
  handleLeaveAsset(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAssetDto,
  ) {
    client.leave(payload.symbol);
    this.logger.log(`Client ${client.id} left asset: ${payload.symbol}`);
  }
}
