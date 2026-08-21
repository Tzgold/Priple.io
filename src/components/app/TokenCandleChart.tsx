"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/geckoterminal";
import { sanitizeCandles } from "@/lib/candle-math";
import type { WalletChartMark } from "@/lib/wallet-dossier";
import { cn } from "@/lib/cn";

/** Lightweight Charts requires strictly ascending unique timestamps. */
export function normalizeCandles(candles: Candle[]): Candle[] {
  const byTime = new Map<number, Candle>();

  for (const candle of sanitizeCandles(candles)) {
    const time = Math.floor(candle.time);
    const prev = byTime.get(time);
    if (!prev) {
      byTime.set(time, { ...candle, time });
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

function snapMarkTime(timeSec: number, candleTimes: number[]) {
  if (candleTimes.length === 0) return Math.floor(timeSec);
  let best = candleTimes[0];
  let bestDist = Math.abs(timeSec - best);
  for (const t of candleTimes) {
    const dist = Math.abs(timeSec - t);
    if (dist < bestDist) {
      best = t;
      bestDist = dist;
    }
  }
  return best;
}

function avatarTone(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hues = [160, 190, 210, 280, 320, 25, 45];
  return hues[hash % hues.length];
}

type AvatarSpot = {
  key: string;
  left: number;
  top: number;
  mark: WalletChartMark;
  focused: boolean;
  stack: number;
  overflow?: number;
};

type NewsSpot = {
  key: string;
  left: number;
  top: number;
  title: string;
};

export type ChartIntelEvent = {
  time: number;
  title: string;
};

const MAX_VISIBLE_PER_SIDE = 3;
const AVATAR = 28;
const STACK_GAP = 10;

export function TokenCandleChart({
  candles,
  marks = [],
  events = [],
  focusTime = null,
  heightClass = "h-[380px] w-full sm:h-[460px]",
}: {
  candles: Candle[];
  marks?: WalletChartMark[];
  events?: ChartIntelEvent[];
  focusTime?: number | null;
  heightClass?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const cleanedRef = useRef<Candle[]>([]);
  const [spots, setSpots] = useState<AvatarSpot[]>([]);
  const [newsSpots, setNewsSpots] = useState<NewsSpot[]>([]);
  const [hoverOhlc, setHoverOhlc] = useState<{
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  } | null>(null);

  const candleIndex = useMemo(() => {
    const map = new Map<number, Candle>();
    for (const c of normalizeCandles(candles)) map.set(c.time, c);
    return map;
  }, [candles]);

  useEffect(() => {
    if (!hostRef.current) return;

    const chart = createChart(hostRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#050506" },
        textColor: "#8b8b93",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.035)" },
        horzLines: { color: "rgba(255,255,255,0.035)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        scaleMargins: { top: 0.06, bottom: 0.26 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
        minBarSpacing: 3,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.28)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#27272a",
        },
        horzLine: {
          color: "rgba(255,255,255,0.28)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#27272a",
        },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: "rgba(255,255,255,0.35)",
      priceLineStyle: LineStyle.Dashed,
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeRef.current = volume;

    const onCrosshair = (param: Parameters<Parameters<IChartApi["subscribeCrosshairMove"]>[0]>[0]) => {
      if (!param.time || !param.seriesData) {
        setHoverOhlc(null);
        return;
      }
      const candle = param.seriesData.get(series) as CandlestickData | undefined;
      const vol = param.seriesData.get(volume) as HistogramData | undefined;
      if (!candle || candle.open == null) {
        setHoverOhlc(null);
        return;
      }
      setHoverOhlc({
        o: candle.open,
        h: candle.high,
        l: candle.low,
        c: candle.close,
        v: typeof vol?.value === "number" ? vol.value : 0,
      });
    };
    chart.subscribeCrosshairMove(onCrosshair);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    const cleaned = normalizeCandles(candles);
    cleanedRef.current = cleaned;
    const data: CandlestickData[] = cleaned.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    const volumes: HistogramData[] = cleaned.map((candle) => ({
      time: candle.time as UTCTimestamp,
      value: candle.volume || 0,
      color: candle.close >= candle.open ? "rgba(38,166,154,0.4)" : "rgba(239,83,80,0.4)",
    }));

    try {
      seriesRef.current.setData(data);
      volumeRef.current?.setData(volumes);
      chartRef.current.timeScale().fitContent();

      const candleTimes = cleaned.map((c) => c.time);
      if (focusTime != null && candleTimes.length > 0) {
        const snapped = snapMarkTime(focusTime, candleTimes);
        const idx = candleTimes.indexOf(snapped);
        chartRef.current.timeScale().setVisibleLogicalRange({
          from: Math.max(0, idx - 40),
          to: Math.min(candleTimes.length - 1, idx + 20),
        });
      }
    } catch {
      seriesRef.current.setData([]);
      volumeRef.current?.setData([]);
    }
  }, [candles, focusTime]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const layout = () => {
      const cleaned = cleanedRef.current;
      const candleTimes = cleaned.map((c) => c.time);
      const grouped = new Map<string, WalletChartMark[]>();

      for (const mark of marks) {
        const snapped = snapMarkTime(mark.time, candleTimes);
        if (!candleIndex.get(snapped)) continue;
        const key = `${snapped}:${mark.side}`;
        const list = grouped.get(key) || [];
        list.push(mark);
        grouped.set(key, list);
      }

      const next: AvatarSpot[] = [];

      for (const [groupKey, groupMarks] of grouped) {
        const [snappedRaw, side] = groupKey.split(":") as [string, "buy" | "sell"];
        const snapped = Number(snappedRaw);
        const candle = candleIndex.get(snapped);
        if (!candle) continue;

        const price = side === "buy" ? candle.low : candle.high;
        const x = chart.timeScale().timeToCoordinate(snapped as UTCTimestamp);
        const y = series.priceToCoordinate(price);
        if (x == null || y == null) continue;

        const visible = groupMarks.slice(0, MAX_VISIBLE_PER_SIDE);
        const overflow = Math.max(0, groupMarks.length - visible.length);

        visible.forEach((mark, stack) => {
          const focused = focusTime != null && Math.abs(mark.time - focusTime) < 180;
          // Fan out so profiles peek — buys below candle, sells above.
          const step = AVATAR - STACK_GAP;
          const offsetY = side === "buy" ? 18 + stack * step : -18 - stack * step;
          const offsetX = stack * 7;

          next.push({
            key: `${mark.walletAddress || "w"}-${mark.time}-${mark.side}-${mark.hash || mark.text}-${stack}`,
            left: x + offsetX,
            top: y + offsetY,
            mark,
            focused,
            stack,
            overflow: stack === visible.length - 1 && overflow > 0 ? overflow : undefined,
          });
        });
      }

      setSpots(next);

      const newsNext: NewsSpot[] = [];
      const minT = candleTimes[0];
      const maxT = candleTimes[candleTimes.length - 1];
      for (const event of events) {
        if (minT == null || maxT == null) break;
        if (event.time < minT - 3600 || event.time > maxT + 3600) continue;
        const snapped = snapMarkTime(event.time, candleTimes);
        const candle = candleIndex.get(snapped);
        if (!candle) continue;
        const x = chart.timeScale().timeToCoordinate(snapped as UTCTimestamp);
        const y = series.priceToCoordinate(candle.high);
        if (x == null || y == null) continue;
        newsNext.push({
          key: `${snapped}-${event.title}`,
          left: x,
          top: y - 14,
          title: event.title,
        });
      }
      setNewsSpots(newsNext);
    };

    layout();
    const onRange = () => layout();
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRange);
    chart.timeScale().subscribeVisibleTimeRangeChange(onRange);
    window.addEventListener("resize", layout);
    const timer = window.setInterval(layout, 700);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRange);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onRange);
      window.removeEventListener("resize", layout);
      window.clearInterval(timer);
    };
  }, [marks, events, focusTime, candleIndex, candles]);

  function fmt(n: number) {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (Math.abs(n) >= 1) return n.toFixed(4);
    return n.toPrecision(4);
  }

  return (
    <div className={cn("relative", heightClass)}>
      {hoverOhlc ? (
        <div className="pointer-events-none absolute left-3 top-2 z-20 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-black/70 px-2.5 py-1.5 font-mono text-[10px] text-zinc-300 backdrop-blur">
          <span>
            O <span className="text-white">{fmt(hoverOhlc.o)}</span>
          </span>
          <span>
            H <span className="text-teal-300">{fmt(hoverOhlc.h)}</span>
          </span>
          <span>
            L <span className="text-rose-300">{fmt(hoverOhlc.l)}</span>
          </span>
          <span>
            C{" "}
            <span className={hoverOhlc.c >= hoverOhlc.o ? "text-teal-300" : "text-rose-300"}>
              {fmt(hoverOhlc.c)}
            </span>
          </span>
          {hoverOhlc.v > 0 ? (
            <span>
              Vol <span className="text-zinc-200">{fmt(hoverOhlc.v)}</span>
            </span>
          ) : null}
        </div>
      ) : null}
      <div ref={hostRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {spots.map((spot) => {
          const seed = spot.mark.walletAddress || spot.mark.walletLabel || spot.mark.text;
          const hue = avatarTone(seed);
          const initials = (spot.mark.walletLabel || spot.mark.asset || "?")
            .replace(/[^a-zA-Z0-9]/g, " ")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0] || "")
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const avatar =
            spot.mark.avatarUrl ||
            (spot.mark.walletAddress
              ? `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(spot.mark.walletAddress.toLowerCase())}&backgroundColor=0a0a0c&size=64`
              : null);

          return (
            <div
              key={spot.key}
              title={`${spot.mark.walletLabel || "Wallet"} · ${spot.mark.text}`}
              className={cn(
                "pointer-events-auto absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-default items-center justify-center overflow-visible rounded-full border-2 bg-[#0a0a0c] shadow-[0_2px_8px_rgba(0,0,0,0.65)]",
                spot.mark.side === "buy" ? "border-teal-400" : "border-rose-400",
                spot.focused && "h-8 w-8 ring-2 ring-white/50",
              )}
              style={{ left: spot.left, top: spot.top, zIndex: 20 + spot.stack }}
            >
              <div className="h-full w-full overflow-hidden rounded-full">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const sibling = e.currentTarget.nextElementSibling;
                      if (sibling instanceof HTMLElement) sibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <span
                  className={cn(
                    "h-full w-full items-center justify-center font-mono text-[9px] font-semibold text-white",
                    avatar ? "hidden" : "flex",
                  )}
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue} 55% 38%), hsl(${hue} 45% 22%))`,
                  }}
                >
                  {initials || "W"}
                </span>
              </div>
              {spot.overflow ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 font-mono text-[8px] font-semibold text-white ring-1 ring-white/20">
                  +{spot.overflow}
                </span>
              ) : null}
            </div>
          );
        })}
        {newsSpots.map((spot) => (
          <div
            key={spot.key}
            title={spot.title}
            className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.18)]"
            style={{ left: spot.left, top: spot.top, zIndex: 18 }}
          />
        ))}
      </div>
    </div>
  );
}
