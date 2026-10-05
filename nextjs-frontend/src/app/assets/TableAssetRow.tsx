"use client";

import { AssetShow } from "@/components/AssetShow";
import { LivePrice } from "@/components/LivePrice";
import { TradeLink } from "@/components/TradeLink";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Asset } from "@/models";
import { useLiveAsset } from "@/store";

export function TableAssetRow(props: { asset: Asset; walletId: string }) {
  const { walletId } = props;
  const asset = useLiveAsset(props.asset);

  return (
    <TableRow>
      <TableCell>
        <AssetShow asset={asset} />
      </TableCell>
      <TableCell className="text-right">
        <LivePrice price={asset.price} />
      </TableCell>
      <TableCell className="text-right">
        <TradeLink symbol={asset.symbol} walletId={walletId} />
      </TableCell>
    </TableRow>
  );
}
