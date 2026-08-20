import assert from "node:assert/strict";
import { buildMomentum } from "./coin-analysis";
import type { Candle } from "./geckoterminal";

const bullish = buildMomentum({
  change1h: 4.2,
  change6h: 9.1,
  change24h: 18.5,
  volume24hUsd: 400_000,
  liquidityUsd: 80_000,
});
assert.equal(bullish.bias, "bullish");
assert.match(bullish.volLiqLabel, /5\.0×/);
assert.equal(bullish.windows.find((w) => w.id === "1h")?.signal, "up");

const choppy = buildMomentum({
  change1h: 6,
  change6h: -7,
  change24h: 2,
  volume24hUsd: 50_000,
  liquidityUsd: 100_000,
});
assert.equal(choppy.bias, "choppy");

const candles: Candle[] = [
  { time: 1_000_000, open: 1, high: 1.1, low: 0.9, close: 1, volume: 10 },
  { time: 1_000_000 + 3600 * 4, open: 1, high: 1.2, low: 0.95, close: 1.15, volume: 12 },
  { time: 1_000_000 + 3600 * 24, open: 1.15, high: 1.4, low: 1.1, close: 1.3, volume: 20 },
];

const fromCandles = buildMomentum({
  change1h: null,
  change6h: null,
  change24h: null,
  volume24hUsd: null,
  liquidityUsd: null,
  candles,
});
assert.ok(fromCandles.windows.some((w) => w.changePct != null));
assert.match(fromCandles.rangeLabel, /range/i);

const cex = buildMomentum({
  change1h: null,
  change6h: null,
  change24h: null,
  volume24hUsd: null,
  liquidityUsd: null,
  cexMajor: true,
});
assert.match(cex.summary, /CEX/i);

console.log("coin-momentum tests passed");
