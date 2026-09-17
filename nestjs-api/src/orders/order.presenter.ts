import { AssetPresenter } from "../assets/asset.presenter.js";
import { Asset } from "../assets/entities/asset.entity.js";
import { Order } from "./entities/order.entity.js";

export class OrderPresenter {
  constructor(private order: Order & { asset: Asset }) { }

  toJSON() {
    return {
      _id: this.order._id,
      asset: new AssetPresenter(this.order.asset).toJSON(),
      shares: this.order.shares,
      partial: this.order.partial,
      price: this.order.price,
      type: this.order.type,
      status: this.order.status,
    };
  }
}