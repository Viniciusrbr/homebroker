"use client";

import type { Time } from "lightweight-charts";
import { useEffect, useRef } from "react";
import {
  ChartComponent,
  type ChartComponentRef,
} from "@/components/ChartComponent";
import { socket } from "@/lib/socket-io";
import type { Asset } from "@/models";

export function AssetChartComponent(props: {
  asset: Asset;
  data?: { time: Time; value: number }[];
}) {
  const chartRef = useRef<ChartComponentRef>(null);
  const symbol = props.asset.symbol;

  useEffect(() => {
    socket.connect();
    socket.emit("joinAsset", { symbol });
    socket.on("assets/daily-created", (assetDaily) => {
      chartRef.current?.update({
        time: (Date.parse(assetDaily.date) / 1000) as Time,
        value: assetDaily.price,
      });
    });

    return () => {
      socket.emit("leaveAsset", { symbol });
      socket.off("assets/daily-created");
    };
  }, [symbol]);

  return <ChartComponent ref={chartRef} data={props.data} />;
}
