"use client";

import { LivePrice } from "@/components/LivePrice";
import type { Asset } from "@/models";
import { useLiveAsset } from "@/store";

export function AssetPrice(props: { asset: Asset }) {
  const asset = useLiveAsset(props.asset);

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        Cotação atual
      </span>
      <LivePrice
        price={asset.price}
        className="text-3xl font-semibold sm:text-4xl"
      />
    </div>
  );
}
