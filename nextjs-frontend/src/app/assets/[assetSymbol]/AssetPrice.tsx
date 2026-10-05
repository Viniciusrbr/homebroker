"use client";

import { Asset } from "@/models";
import { useAssetStore } from "@/store";
import { useShallow } from "zustand/shallow";

export function AssetPrice(props: { asset: Asset }) {
  const { asset } = props;
  const assetFetched = useAssetStore(
    useShallow((state) => state.assets.find((a) => a.symbol === asset.symbol))
  );
  console.log(assetFetched);
  const price = assetFetched ? assetFetched.price : props.asset.price;

  return <div className="ml-2 font-bold text-2xl">R$ {price}</div>;
}