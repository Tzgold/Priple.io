import type { Candle } from "@/lib/geckoterminal";

const BUCKET_SECONDS: Record<"1m" | "15m" | "1H" | "4H" | "1D", number> = {
  "1m": 60,
  "15m": 15 * 60,
  "1H": 60 * 60,
  "4H": 4 * 60 * 60,
  "1D": 24 * 60 * 60,
};

/** Build higher timeframes from a fine base series (avoids extra API calls). */
export function aggregateCandles(
  base: Candle[],
  intervalKey: keyof typeof BUCKET_SECONDS,
  sourceSeconds = 60,
): Candle[] {
  const size = BUCKET_SECONDS[intervalKey];
  if (!size || size <= sourceSeconds) {
    return base.map((c) => ({ ...c, time: Math.floor(c.time) }));
  }

  const buckets = new Map<number, Candle>();
  for (const candle of base) {
    const time = Math.floor(candle.time / size) * size;
    const prev = buckets.get(time);
    if (!prev) {
      buckets.set(time, {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      });
      continue;
    }
    buckets.set(time, {
      time,
      open: prev.open,
      high: Math.max(prev.high, candle.high),
      low: Math.min(prev.low, candle.low),
      close: candle.close,
      volume: prev.volume + candle.volume,
    });
  }

  return [...buckets.values()].sort((a, b) => a.time - b.time);
}

/** Drop non-finite / non-positive OHLC so Lightweight Charts never paints garbage. */
export function sanitizeCandles(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (const c of candles) {
    if (!Number.isFinite(c.time)) continue;
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const volume = Number(c.volume);
    if (![open, high, low, close].every((n) => Number.isFinite(n) && n > 0)) continue;
    const hi = Math.max(open, high, low, close);
    const lo = Math.min(open, high, low, close);
    if (!(hi >= lo) || lo <= 0) continue;
    out.push({
      time: Math.floor(c.time),
      open,
      high: hi,
      low: lo,
      close,
      volume: Number.isFinite(volume) && volume >= 0 ? volume : 0,
    });
  }
  return out;
}

/** Convert price candles to market-cap candles when supply is known and sane. */
export function toMarketCapCandles(candles: Candle[], supply: number | null): Candle[] {
  if (!supply || !Number.isFinite(supply) || supply <= 0) return candles;
  const scaled = candles.map((c) => ({
    time: c.time,
    open: c.open * supply,
    high: c.high * supply,
    low: c.low * supply,
    close: c.close * supply,
    volume: c.volume,
  }));
  // Refuse mcap scale if it produces nonsense (negative / non-finite already filtered).
  const cleaned = sanitizeCandles(scaled);
  return cleaned.length > 0 ? cleaned : candles;
}

/** Prefer price scale when supply estimate would invent a broken mcap axis. */
export function canScaleCandlesToMcap(supply: number | null, priceUsd: number | null): boolean {
  if (supply == null || !Number.isFinite(supply) || supply <= 0) return false;
  if (priceUsd != null && priceUsd > 0) {
    const est = supply * priceUsd;
    // Guard absurd supply (raw wei-like) or tiny dust.
    if (!Number.isFinite(est) || est <= 0 || est > 5e15) return false;
  }
  return true;
}

export function estimateMarketCap(input: {
  marketCapUsd: number | null;
  fdvUsd: number | null;
  priceUsd: number | null;
  supply: number | null;
}) {
  if (input.marketCapUsd != null && input.marketCapUsd > 0) {
    return { value: input.marketCapUsd, label: "Market cap" as const };
  }
  if (input.fdvUsd != null && input.fdvUsd > 0) {
    return { value: input.fdvUsd, label: "FDV" as const };
  }
  if (input.priceUsd != null && input.supply != null && input.supply > 0) {
    return { value: input.priceUsd * input.supply, label: "Est. mcap" as const };
  }
  return { value: null, label: "Market cap" as const };
}

export { BUCKET_SECONDS };
