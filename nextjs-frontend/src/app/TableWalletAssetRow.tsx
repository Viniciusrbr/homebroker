"use client";

import { AssetShow } from "@/components/AssetShow";
import { LivePrice } from "@/components/LivePrice";
import { TradeLink } from "@/components/TradeLink";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { WalletAsset } from "@/models";
import { useLiveAsset } from "@/store";

export function TableWalletAssetRow(props: {
  walletAsset: WalletAsset;
  walletId: string;
}) {
  const { walletAsset, walletId } = props;
  const asset = useLiveAsset(walletAsset.asset);

  return (
    <TableRow>
      <TableCell>
        <AssetShow asset={asset} />
      </TableCell>
      <TableCell className="text-right">
        <LivePrice price={asset.price} />
      </TableCell>
      <TableCell className="num text-right">
        {formatNumber(walletAsset.shares)}
      </TableCell>
      <TableCell className="num text-right font-medium">
        {formatCurrency(asset.price * walletAsset.shares)}
      </TableCell>
      <TableCell className="text-right">
        <TradeLink symbol={asset.symbol} walletId={walletId} />
      </TableCell>
    </TableRow>
  );
}
