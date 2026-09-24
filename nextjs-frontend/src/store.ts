import { create } from "zustand";
import { Asset } from "./models";

export type AssetStore = {
  assets: Asset[];
  changeAsset: (asset: Asset) => void;
  //addAsset: (asset: Asset) => void;
  //removeAsset: (asset: Asset) => void;
};

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  changeAsset: (asset) =>
    set((state) => {
      const assetIndex = state.assets.findIndex(
        (a) => a.symbol === asset.symbol,
      );
      if (assetIndex === -1) {
        return {
          assets: [...state.assets, asset], //novo array
        };
      }

      const newAssets = [...state.assets]; //novo array
      newAssets[assetIndex] = asset;
      return { assets: newAssets };
    }),
}));
