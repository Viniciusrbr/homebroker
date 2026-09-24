"use client";
import { AssetShow } from "@/components/AssetShow";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Asset } from "@/models";
import { useAssetStore } from "@/store";
import Link from "next/link";
import { useShallow } from "zustand/shallow";

export function TableAssetRow(props: { asset: Asset; walletId: string }) {
  const { asset, walletId } = props;

  const assetFound = useAssetStore(
    useShallow((state) => state.assets.find((a) => a.symbol === asset.symbol)),
  );

  const asset_ = assetFound || asset;

  return (
    <TableRow>
      <TableCell>
        <AssetShow asset={asset_} />
      </TableCell>
      <TableCell>R$ {asset_.price}</TableCell>
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
