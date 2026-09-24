"use client";

import Link from "next/link";
import { AssetShow } from "@/components/AssetShow";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { WalletAsset } from "@/models";
import { useAssetStore } from "@/store";
import { useShallow } from "zustand/shallow";

export function TableWalletAssetRow(props: {
  walletAsset: WalletAsset;
  walletId: string;
}) {
  const { walletAsset, walletId } = props;

  const assetFound = useAssetStore(
    useShallow((state) =>
      state.assets.find((a) => a.symbol === walletAsset.asset.symbol),
    ),
  );

  const asset = assetFound || walletAsset.asset;

  return (
    <TableRow>
      <TableCell>
        <AssetShow asset={asset} />
      </TableCell>
      <TableCell>R$ {asset.price}</TableCell>
      <TableCell>{walletAsset.shares}</TableCell>
      <TableCell>
        <Button
          variant="link"
          nativeButton={false}
          render={
            <Link href={`/assets/${asset.symbol}?wallet_id=${walletId}`} />
          }
        >
          Comprar/vender
        </Button>
      </TableCell>
    </TableRow>
  );
}
