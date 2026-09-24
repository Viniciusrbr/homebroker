import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Asset } from './entities/asset.entity.js';
import { Model } from 'mongoose';
import { Observable } from 'rxjs';

@Injectable()
export class AssetsService {

  constructor(@InjectModel(Asset.name) private assetSchema: Model<Asset>) { }

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

  // subscribeNewPriceChangedEvents(): Observable<Asset> {
  //   return new Observable((observer) => {
  //     this.assetSchema.watch([
  //       {
  //         $match: {
  //           $or: [{ operationType: 'update' }, { operationType: 'replace' }]
  //         }
  //       }
  //     ],
  //       { fullDocument: 'updateLookup', fullDocumentBeforeChange: 'whenAvailable' },
  //     ).on('change', async (data) => {
  //       if (data.fullDocument.price === data.fullDocumentBeforeChange.price) {
  //         return;
  //       }
  //       const asset = await this.assetSchema.findById(data.fullDocument._id);
  //       observer.next(asset!);
  //     });
  //   })
  // }

  subscribeNewPriceChangedEvents(): Observable<Asset> {
    return new Observable((observer) => {
      this.assetSchema.watch(
        [
          {
            $match: {
              operationType: 'update',
              'updateDescription.updatedFields.price': { $exists: true },
            },
          },
        ],
        { fullDocument: 'updateLookup' },
      ).on('change', (data) => {
        observer.next(data.fullDocument);
      });
    });
  }


}
