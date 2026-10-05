import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import type { Asset } from "./models";

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

/** Latest version of an asset pushed via websocket, falling back to the given one. */
export function useLiveAsset(asset: Asset): Asset {
  const assetFound = useAssetStore(
    useShallow((state) => state.assets.find((a) => a.symbol === asset.symbol)),
  );
  return assetFound || asset;
}
