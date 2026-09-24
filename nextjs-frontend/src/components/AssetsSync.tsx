"use client";

import { useEffect } from "react";
import { Asset } from "../models";
import { socket } from "@/lib/socket-io";
import { useAssetStore } from "@/store";

export function AssetsSync(props: { assetsSymbols: string[] }) {
  const { assetsSymbols } = props;
  const changeAsset = useAssetStore((state) => state.changeAsset);

  useEffect(() => {
    socket.connect();

    socket.emit("joinAssets", { symbols: assetsSymbols });
    socket.on("assets/price-changed", (asset: Asset) => {
      console.log(asset);
      changeAsset(asset);
    });

    return () => {
      socket.emit("leaveAssets", { symbols: assetsSymbols });
      socket.off("assets/price-changed");
    };
  }, [assetsSymbols, changeAsset]);

  return null;
}
