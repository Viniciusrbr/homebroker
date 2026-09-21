'use client';

import { useRef } from "react";

import { ChartComponent, ChartComponentRef } from "@/components/ChartComponent";
import { Asset } from "@/models";
import { AssetShow } from "@/components/AssetShow";

export function AssetChartComponent(props: { asset: Asset }) {
  const chartRef = useRef<ChartComponentRef>(null);
  //websocket

  return (
    <ChartComponent ref={chartRef} header={<AssetShow asset={props.asset} />} />
  );
}