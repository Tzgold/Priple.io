import assert from "node:assert/strict";
import { canScaleCandlesToMcap, sanitizeCandles, toMarketCapCandles } from "./candle-math";
import type { Candle } from "./geckoterminal";

const good: Candle[] = [
  { time: 100, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
  { time: 160, open: 1.5, high: 1.8, low: 1.2, close: 1.4, volume: 5 },
];

const dirty: Candle[] = [
  ...good,
  { time: 220, open: -1, high: 2, low: -3, close: 1, volume: 1 },
  { time: 280, open: NaN, high: 1, low: 1, close: 1, volume: 1 },
  { time: 340, open: 1, high: 0.5, low: 2, close: 1, volume: 1 },
];

const cleaned = sanitizeCandles(dirty);
assert.equal(cleaned.length, 3);
assert.ok(cleaned.every((c) => c.low > 0 && c.high >= c.low));

const mcap = toMarketCapCandles(good, 1000);
assert.equal(mcap[0].close, 1500);
assert.equal(canScaleCandlesToMcap(1e30, 0.01), false);
assert.equal(canScaleCandlesToMcap(1_000_000, 0.5), true);

console.log("candle-math.test.ts: ok");
