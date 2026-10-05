"use client";

import {
  type AreaData,
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  LineStyle,
  type Time,
} from "lightweight-charts";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";

export type ChartComponentRef = {
  update: (data: { time: Time; value: number }) => void;
};

// Canvas colors mirror the dark theme tokens in globals.css (lightweight-charts
// does not resolve CSS variables).
const theme = {
  text: "#8a93a6",
  grid: "rgba(255, 255, 255, 0.04)",
  border: "rgba(255, 255, 255, 0.08)",
  line: "#5ee0a8",
  areaTop: "rgba(94, 224, 168, 0.28)",
  areaBottom: "rgba(94, 224, 168, 0)",
  crosshair: "rgba(255, 255, 255, 0.25)",
};

export function ChartComponent(props: {
  data?: AreaData<Time>[];
  ref: Ref<ChartComponentRef>;
}) {
  const { data, ref } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>(null);
  const seriesRef = useRef<ISeriesApi<"Area">>(null);

  useImperativeHandle(ref, () => ({
    update: (point) => {
      seriesRef.current?.update(point);
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme.text,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      rightPriceScale: { borderColor: theme.border },
      timeScale: { borderColor: theme.border, timeVisible: true },
      crosshair: {
        vertLine: { color: theme.crosshair, style: LineStyle.Dashed },
        horzLine: { color: theme.crosshair, style: LineStyle.Dashed },
      },
    });
    seriesRef.current = chart.addSeries(AreaSeries, {
      lineColor: theme.line,
      lineWidth: 2,
      topColor: theme.areaTop,
      bottomColor: theme.areaBottom,
      priceLineColor: theme.line,
      crosshairMarkerBackgroundColor: theme.line,
    });
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    seriesRef.current?.setData(data || []);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return <div className="h-full min-h-80 w-full" ref={containerRef} />;
}
