import {
  Command,
  CommandRunner,
  InquirerService,
  Question,
  QuestionSet,
} from 'nest-commander';
import type { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Wallet } from './wallets/entities/wallet.entity.js';
import { AssetsService } from './assets/assets.service.js';
import { WalletsService } from './wallets/wallets.service.js';
import { OrdersService } from './orders/orders.service.js';
import { OrderStatus, OrderType } from './orders/entities/order.entity.js';

@QuestionSet({ name: 'generate-orders' })
export class ConfirmGenerateOrders {
  @Question({
    message: 'Gerar ordens de compra e venda?',
    name: 'confirm',
  })
  parseConfirm(val: string) {
    return val.toLowerCase() === 'y';
  }
}

@QuestionSet({ name: 'generate-orders-closed' })
export class ConfirmGenerateOrdersClosed {
  @Question({
    message: 'Gerar ordens de fechamento?',
    name: 'confirm',
  })
  parseConfirm(val: string) {
    return val.toLowerCase() === 'y';
  }
}

@Command({ name: 'simulate-assets-price' })
export class SimulateAssetsPriceCommand extends CommandRunner {
  assets: {
    _id: string | null;
    name: string;
    symbol: string;
    price: number;
    image: string;
  }[] = [
      {
        _id: null,
        name: 'Amazon',
        symbol: 'AMZN',
        price: 100,
        image: 'AMZN.png',
      },
      {
        _id: null,
        name: 'Sales Force',
        symbol: 'CRM',
        price: 200,
        image: 'CRM.png',
      },
      {
        _id: null,
        name: 'Google',
        symbol: 'GOOGL',
        price: 300,
        image: 'GOOGL.png',
      },
      {
        _id: null,
        name: 'Meta',
        symbol: 'META',
        price: 400,
        image: 'META.png',
      },
      {
        _id: null,
        name: 'Coca-cola',
        symbol: 'KO',
        price: 500,
        image: 'KO.png',
      },
      {
        _id: null,
        name: 'McDonalds',
        symbol: 'MCD',
        price: 600,
        image: 'MCD.png',
      },
      {
        _id: null,
        name: 'Mercado Livre',
        symbol: 'MELI',
        price: 700,
        image: 'MELI.png',
      },
      {
        _id: null,
        name: 'Nvidia',
        symbol: 'NVDA',
        price: 1000,
        image: 'NVDA.png',
      },
    ];
  wallet1: Wallet;
  wallet2: Wallet;
  private readonly logger = new Logger();

  constructor(
    private assetsService: AssetsService,
    private walletsService: WalletsService,
    private ordersService: OrdersService,
    @InjectConnection() private connection: Connection,
    private readonly inquirer: InquirerService,
  ) {
    super();
  }

  async run(_passedParam: string[], _options?: any): Promise<void> {
    this.logger.log('Simulating assets price...');
    await this.cleanDatabase();

    await this.createAssets();

    await this.createWallets();

    await this.createWalletAssets();

    const confirmGenerateOrders = (
      await this.inquirer.ask<{ confirm: boolean }>(
        'generate-orders',
        undefined,
      )
    ).confirm;

    if (confirmGenerateOrders) {
      const confirmGenerateOrdersClosed = (
        await this.inquirer.ask<{ confirm: boolean }>(
          'generate-orders-closed',
          undefined,
        )
      ).confirm;
      await this.createOrders(confirmGenerateOrdersClosed);
    }
  }

  async cleanDatabase() {
    await Promise.all([
      this.connection.collections.assets.deleteMany({}),
      this.connection.collections.assetdailies.deleteMany({}),
      this.connection.collections.wallets.deleteMany({}),
      this.connection.collections.walletassets.deleteMany({}),
      this.connection.collections.orders.deleteMany({}),
      this.connection.collections.trades.deleteMany({}),
    ]);

    this.logger.log('Database cleaned');
  }

  async createAssets() {
    for (const asset of this.assets) {
      const assetCreated = await this.assetsService.create({
        name: asset.name,
        image: asset.image,
        price: asset.price,
        symbol: asset.symbol,
      });
      asset._id = assetCreated._id;
      this.logger.log(`${asset.name} created`);
    }
  }

  async createWallets() {
    this.wallet1 = await this.walletsService.create({});
    this.logger.log(`Wallet ${this.wallet1._id} created`);
    this.wallet2 = await this.walletsService.create({});
    this.logger.log(`Wallet ${this.wallet2._id} created`);
  }

  async createWalletAssets() {
    await this.walletsService.createWalletAsset({
      walletId: this.wallet1._id,
      assetId: this.assets[0]._id!,
      shares: 10000,
    });
    this.logger.log('Wallet 1 assets created');

    await this.walletsService.createWalletAsset({
      walletId: this.wallet2._id,
      assetId: this.assets[1]._id!,
      shares: 10000,
    });
    await this.walletsService.createWalletAsset({
      walletId: this.wallet2._id,
      assetId: this.assets[2]._id!,
      shares: 10000,
    });
    this.logger.log('Wallet 2 assets created');
  }

  async createOrders(generateOrdersClosed: boolean) {
    this.logger.log('Creating orders...');
    const range = (start: number, end: number) =>
      Array.from({ length: end - start }, (_, i) => i + start);

    for (const index of range(1, 100)) {
      const price = 100 + index + 2;
      const orderSell = await this.ordersService.create({
        assetId: this.assets[0]._id as any,
        walletId: this.wallet1._id,
        price,
        shares: 10,
        type: OrderType.SELL,
      });
      this.logger.log(
        `Order SELL created: index ${index} - price ${100 + index}`,
      );

      const orderBuy = await this.ordersService.create({
        assetId: this.assets[0]._id as any,
        walletId: this.wallet2._id,
        price,
        shares: 10,
        type: OrderType.BUY,
      });
      this.logger.log(
        `Order BUY created: index ${index} - price ${100 + index + 10}`,
      );

      await sleep(2000);

      if (generateOrdersClosed) {
        await this.ordersService.createTrade({
          brokerTradeId: `broker_trade_id_${index}`,
          relatedInvestorId: `related_investor_id_${index}`,
          shares: 10,
          orderId: orderSell._id,
          price,
          status: OrderStatus.CLOSED,
          date: new Date(),
        });
        await this.ordersService.createTrade({
          brokerTradeId: `broker_trade_id_${index}`,
          relatedInvestorId: `related_investor_id_${index}`,
          shares: 10,
          orderId: orderBuy._id,
          price,
          status: OrderStatus.CLOSED,
          date: new Date(),
        });
        this.logger.log(`Orders SELL closed: index ${index}`);
        await sleep(1000);
      }
    }
    this.logger.log('Orders created');
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));