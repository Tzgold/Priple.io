import assert from "node:assert/strict";
import { buildHolderMap } from "./coin-analysis";
import type { TokenHoldersInfo } from "./token-info";

const healthy: TokenHoldersInfo = {
  count: 12_400,
  top10Pct: 28.5,
  next20Pct: 18.2,
  next20bPct: 12.1,
  restPct: 41.2,
  lastUpdated: "2026-08-20T12:00:00Z",
};

const healthyMap = buildHolderMap(healthy);
assert.equal(healthyMap.level, "low");
assert.match(healthyMap.summary, /distributed/i);
assert.equal(healthyMap.bands.find((b) => b.id === "top10")?.tone, "ok");
assert.equal(healthyMap.countLabel, "12,400");

const extreme: TokenHoldersInfo = {
  count: 800,
  top10Pct: 72,
  next20Pct: 14,
  next20bPct: 6,
  restPct: 8,
  lastUpdated: null,
};

const extremeMap = buildHolderMap(extreme);
assert.equal(extremeMap.level, "high");
assert.equal(extremeMap.bands.find((b) => b.id === "top10")?.tone, "risk");
assert.equal(extremeMap.bands.find((b) => b.id === "rest")?.tone, "watch");
assert.match(extremeMap.summary, /High concentration/i);

const missing = buildHolderMap(null);
assert.equal(missing.level, "unknown");
assert.match(missing.summary, /not available/i);

const cex = buildHolderMap(null, { cexMajor: true });
assert.match(cex.summary, /CEX/i);

console.log("coin-holder-map tests passed");
