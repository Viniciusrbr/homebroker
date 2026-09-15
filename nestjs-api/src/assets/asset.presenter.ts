import { Asset } from "./entities/asset.entity.js";

export class AssetPresenter {
  constructor(private asset: Asset) { }

  toJSON() {
    return {
      _id: this.asset._id,
      name: this.asset.name,
      symbol: this.asset.symbol,
      price: this.asset.price,
      image_url: `https://localhost:9000/${this.asset.image}`
    }
  }
}