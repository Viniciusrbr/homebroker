import { AssetPresenter } from "../assets/asset.presenter.js";
import { Asset } from "../assets/entities/asset.entity.js";
import { WalletAsset } from "./entities/wallet-asset.entity.js";
import { Wallet } from "./entities/wallet.entity.js";

export class WalletPresenter {
  constructor(
    private wallet: Wallet & { assets: (WalletAsset & { asset: Asset })[] },
  ) { }

  toJSON() {
    return {
      _id: this.wallet._id,
      assets: this.wallet.assets.map((walletAsset) => {
        const assetPresenter = new AssetPresenter(walletAsset.asset);
        return {
          asset: assetPresenter.toJSON(),
          shares: walletAsset.shares,
        };
      }),
    };
  }
}