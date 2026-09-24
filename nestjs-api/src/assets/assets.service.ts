import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Asset } from './entities/asset.entity.js';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';

@Injectable()
export class AssetsService {
  constructor(@InjectModel(Asset.name) private assetSchema: Model<Asset>) {}

  create(createAssetDto: CreateAssetDto) {
    return this.assetSchema.create(createAssetDto);
  }

  findAll() {
    return this.assetSchema.find();
  }

  async findOne(symbol: string) {
    const asset = await this.assetSchema.findOne({ symbol });

    if (!asset) {
      throw new NotFoundException(`Asset with symbol ${symbol} not found`);
    }

    return asset;
  }

  subscribeNewPriceChangedEvents(): Observable<Asset> {
    return new Observable((observer) => {
      const stream = this.assetSchema
        .watch(
          [
            {
              $match: {
                $or: [
                  {
                    operationType: 'update',
                    'updateDescription.updatedFields.price': { $exists: true },
                  },
                  { operationType: 'replace' },
                ],
              },
            },
          ],
          { fullDocument: 'updateLookup' },
        )
        .on('change', (data) => {
          observer.next(data.fullDocument);
        });

      return () => stream.close();
    });
  }
}
