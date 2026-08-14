"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/geckoterminal";

/** Lightweight Charts requires strictly ascending unique timestamps. */
export function normalizeCandles(candles: Candle[]): Candle[] {
  const byTime = new Map<number, Candle>();

  for (const candle of candles) {
    if (!Number.isFinite(candle.time)) continue;
    const time = Math.floor(candle.time);
    const prev = byTime.get(time);
    if (!prev) {
      byTime.set(time, {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      });
      continue;
    }
    byTime.set(time, {
      time,
      open: prev.open,
      high: Math.max(prev.high, candle.high),
      low: Math.min(prev.low, candle.low),
      close: candle.close,
      volume: prev.volume + candle.volume,
    });
  }

  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

export function TokenCandleChart({
  candles,
  heightClass = "h-[380px] w-full sm:h-[460px]",
}: {
  candles: Candle[];
  heightClass?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const chart = createChart(hostRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#050506" },
        textColor: "#71717a",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.2)" },
        horzLine: { color: "rgba(255,255,255,0.2)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#2dd4bf",
      downColor: "#fb7185",
      borderVisible: false,
      wickUpColor: "#2dd4bf",
      wickDownColor: "#fb7185",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    const cleaned = normalizeCandles(candles);
    const data: CandlestickData[] = cleaned.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    try {
      seriesRef.current.setData(data);
      chartRef.current.timeScale().fitContent();
    } catch {
      // Avoid crashing the desk if a bad batch slips through.
      seriesRef.current.setData([]);
    }
  }, [candles]);

  return <div ref={hostRef} className={heightClass} />;
}
