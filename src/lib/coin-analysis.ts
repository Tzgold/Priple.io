import { estimateMarketCap } from "@/lib/candle-math";
import { fetchCoinIntel, type CoinIntel } from "@/lib/coin-intel";
import { fetchDexScreenerEnrichment } from "@/lib/dexscreener";
import {
  fetchPoolOhlcv,
  fetchPoolTrades,
  fetchTokenDesk,
  type Candle,
  type TokenDesk,
  type TokenTrade,
} from "@/lib/geckoterminal";
import { computeOpportunityScore, type OpportunityResult } from "@/lib/opportunity-score";
import {
  fetchOnchainTokenInfo,
  type TokenHoldersInfo,
  type TokenSecurity,
} from "@/lib/token-info";
import type { PulseItem } from "@/lib/alchemy-pulse";

export type SecurityCheckStatus = "pass" | "warn" | "fail" | "unknown";

export type SecurityCheck = {
  id: string;
  label: string;
  status: SecurityCheckStatus;
  detail: string;
};

export type CoinSecurityDesk = {
  level: "low" | "medium" | "high" | "unknown";
  summary: string;
  gtScoreLabel: string;
  checks: SecurityCheck[];
};

export type CoinFlowTrade = {
  id: string;
  side: "buy" | "sell" | "unknown";
  usd: string;
  time: string;
  trader: string | null;
  txHash: string | null;
};

export type CoinTrackedMove = {
  walletLabel: string;
  side: "buy" | "sell";
  amount: string;
  usd: string;
  time: string;
  date: string;
};

export type CoinFlowTape = {
  poolName: string | null;
  poolAddress: string | null;
  summary: string;
  buys: number;
  sells: number;
  volumeUsdLabel: string;
  recent: CoinFlowTrade[];
  tracked: CoinTrackedMove[];
};

export type HolderBandTone = "ok" | "watch" | "risk" | "unknown";

export type HolderBand = {
  id: string;
  label: string;
  pctLabel: string;
  pct: number | null;
  detail: string;
  tone: HolderBandTone;
};

export type CoinHolderMap = {
  level: "low" | "medium" | "high" | "unknown";
  summary: string;
  countLabel: string;
  lastUpdated: string | null;
  bands: HolderBand[];
};

export type MomentumSignal = "up" | "down" | "flat" | "unknown";

export type MomentumWindow = {
  id: string;
  label: string;
  changeLabel: string;
  changePct: number | null;
  signal: MomentumSignal;
};

export type CoinMomentum = {
  bias: "bullish" | "bearish" | "choppy" | "quiet" | "unknown";
  summary: string;
  volLiqLabel: string;
  volLiqRatio: number | null;
  rangeLabel: string;
  windows: MomentumWindow[];
  notes: string[];
};

export type CoinAnalysis = {
  symbol: string;
  name: string;
  network: string;
  address: string;
  headline: string;
  summary: string[];
  market: {
    priceLabel: string;
    mcapLabel: string;
    mcapKind: string;
    change24hLabel: string;
    volumeLabel: string;
    liquidityLabel: string;
    depthLabel: string | null;
  };
  structure: {
    liquidityNote: string;
    volumeNote: string;
    holderNote: string;
  };
  risk: {
    level: "low" | "medium" | "high" | "unknown";
    notes: string[];
  };
  /** Structured security checklist from on-chain / GT feeds. */
  security: CoinSecurityDesk;
  /** Recent pool tape + tracked wallet moves on this coin. */
  flow: CoinFlowTape;
  /** Holder concentration map with plain-language risk. */
  holderMap: CoinHolderMap;
  /** Short-timeframe momentum + volume vs liquidity structure. */
  momentum: CoinMomentum;
  social: {
    websites: string[];
    twitter: string | null;
    telegram: string | null;
    discord: string | null;
    description: string | null;
  };
  holders: {
    countLabel: string;
    top10Label: string;
    next20Label: string;
  };
  whyHere: string | null;
  opportunity: OpportunityResult | null;
  intel: CoinIntel | null;
  sources: string[];
  generatedAt: string;
};

function authorityActive(value: string | null | undefined) {
  if (value == null) return null;
  const raw = value.trim().toLowerCase();
  if (!raw || raw === "false" || raw === "null" || raw === "none" || raw === "0") {
    return false;
  }
  return true;
}

function honeypotFlag(value: boolean | string | null | undefined): boolean | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  const raw = value.trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return null;
}

/** Build a grounded security checklist from CoinGecko onchain / GT fields. */
export function buildSecurityDesk(
  sec: TokenSecurity | null | undefined,
  opts?: { cexMajor?: boolean },
): CoinSecurityDesk {
  if (opts?.cexMajor) {
    return {
      level: "unknown",
      summary: "CEX majors — honeypot / mint / freeze checks are not the right lens.",
      gtScoreLabel: "—",
      checks: [
        {
          id: "venue",
          label: "Venue risk",
          status: "unknown",
          detail: "Risk is market/volatility and venue, not contract honeypot style.",
        },
      ],
    };
  }

  if (!sec) {
    return {
      level: "unknown",
      summary: "Security flags not available in this window’s feeds.",
      gtScoreLabel: "—",
      checks: [
        {
          id: "availability",
          label: "Feed coverage",
          status: "unknown",
          detail: "No on-chain security attributes returned for this token.",
        },
      ],
    };
  }

  const checks: SecurityCheck[] = [];
  let fail = 0;
  let warn = 0;

  const honey = honeypotFlag(sec.isHoneypot);
  if (honey === true) {
    fail += 1;
    checks.push({
      id: "honeypot",
      label: "Honeypot",
      status: "fail",
      detail: "Flagged as possible honeypot — treat as high risk.",
    });
  } else if (honey === false) {
    checks.push({
      id: "honeypot",
      label: "Honeypot",
      status: "pass",
      detail: "Not flagged as honeypot in available feeds.",
    });
  } else {
    checks.push({
      id: "honeypot",
      label: "Honeypot",
      status: "unknown",
      detail: "Honeypot status not reported.",
    });
  }

  const mint = authorityActive(sec.mintAuthority);
  if (mint === true) {
    fail += 1;
    checks.push({
      id: "mint",
      label: "Mint authority",
      status: "fail",
      detail: "Mint authority may still be active — supply can expand.",
    });
  } else if (mint === false) {
    checks.push({
      id: "mint",
      label: "Mint authority",
      status: "pass",
      detail: "Mint authority reported revoked / inactive.",
    });
  } else {
    checks.push({
      id: "mint",
      label: "Mint authority",
      status: "unknown",
      detail: "Mint authority not reported for this chain/token.",
    });
  }

  const freeze = authorityActive(sec.freezeAuthority);
  if (freeze === true) {
    fail += 1;
    checks.push({
      id: "freeze",
      label: "Freeze authority",
      status: "fail",
      detail: "Freeze authority may still be active — transfers can be blocked.",
    });
  } else if (freeze === false) {
    checks.push({
      id: "freeze",
      label: "Freeze authority",
      status: "pass",
      detail: "Freeze authority reported revoked / inactive.",
    });
  } else {
    checks.push({
      id: "freeze",
      label: "Freeze authority",
      status: "unknown",
      detail: "Freeze authority not reported for this chain/token.",
    });
  }

  if (sec.verified === true) {
    checks.push({
      id: "verified",
      label: "Verified",
      status: "pass",
      detail: "Marked verified in available feeds.",
    });
  } else if (sec.verified === false) {
    warn += 1;
    checks.push({
      id: "verified",
      label: "Verified",
      status: "warn",
      detail: "Not marked verified in available feeds.",
    });
  } else {
    checks.push({
      id: "verified",
      label: "Verified",
      status: "unknown",
      detail: "Verification status not reported.",
    });
  }

  if (sec.gtScore != null) {
    const score = sec.gtScore;
    const status: SecurityCheckStatus =
      score < 40 ? "fail" : score < 60 ? "warn" : "pass";
    if (status === "fail") fail += 1;
    else if (status === "warn") warn += 1;
    checks.push({
      id: "gtScore",
      label: "GT score",
      status,
      detail: `GeckoTerminal score ${score.toFixed(0)}/100.`,
    });
  } else {
    checks.push({
      id: "gtScore",
      label: "GT score",
      status: "unknown",
      detail: "GeckoTerminal score not available.",
    });
  }

  if (sec.developerHoldingPct != null) {
    const pct = sec.developerHoldingPct;
    const status: SecurityCheckStatus =
      pct > 20 ? "fail" : pct > 10 ? "warn" : "pass";
    if (status === "fail") fail += 1;
    else if (status === "warn") warn += 1;
    checks.push({
      id: "devHolding",
      label: "Developer holding",
      status,
      detail: `Developer holding ~${pct.toFixed(1)}%.`,
    });
  } else {
    checks.push({
      id: "devHolding",
      label: "Developer holding",
      status: "unknown",
      detail: "Developer holding % not reported.",
    });
  }

  const level: CoinSecurityDesk["level"] =
    fail >= 1 ? "high" : warn >= 2 ? "medium" : warn === 1 ? "medium" : fail === 0 && warn === 0 ? "low" : "unknown";

  const known = checks.filter((c) => c.status !== "unknown").length;
  const summary =
    known === 0
      ? "Security flags not available in this window’s feeds."
      : fail > 0
        ? `${fail} hard flag${fail === 1 ? "" : "s"} in available security feeds.`
        : warn > 0
          ? `${warn} soft warning${warn === 1 ? "" : "s"} — no hard honeypot/mint/freeze fail in feeds.`
          : "No hard security red flags in available feeds.";

  return {
    level,
    summary,
    gtScoreLabel: sec.gtScore != null ? `${sec.gtScore.toFixed(0)}/100` : "—",
    checks,
  };
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (Math.abs(value) >= 1) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(3)}`;
}

function shortTrader(address: string | null | undefined) {
  if (!address) return null;
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function relativeTradeTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - ms) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function mapTrackedMoves(moves: PulseItem[]): CoinTrackedMove[] {
  return moves
    .filter((item) => item.type === "buy" || item.type === "sell")
    .slice(0, 12)
    .map((item) => ({
      walletLabel: item.walletLabel,
      side: item.type === "sell" ? ("sell" as const) : ("buy" as const),
      amount: item.amount,
      usd: item.usd,
      time: item.time,
      date: item.date,
    }));
}

function buildFlowTape(input: {
  poolName: string | null;
  poolAddress: string | null;
  trades: TokenTrade[];
  trackedMoves?: PulseItem[];
  cexMajor?: boolean;
}): CoinFlowTape {
  const tracked = mapTrackedMoves(input.trackedMoves ?? []);

  if (input.cexMajor) {
    return {
      poolName: null,
      poolAddress: null,
      summary: "CEX majors — no single DEX pool tape in this desk.",
      buys: 0,
      sells: 0,
      volumeUsdLabel: "—",
      recent: [],
      tracked,
    };
  }

  const recent: CoinFlowTrade[] = input.trades.slice(0, 16).map((trade) => ({
    id: trade.id,
    side: trade.kind,
    usd: money(trade.amountUsd),
    time: relativeTradeTime(trade.timestamp),
    trader: shortTrader(trade.trader),
    txHash: trade.txHash,
  }));

  let buys = 0;
  let sells = 0;
  let volume = 0;
  let volumeKnown = false;
  for (const trade of input.trades) {
    if (trade.kind === "buy") buys += 1;
    else if (trade.kind === "sell") sells += 1;
    if (trade.amountUsd != null && Number.isFinite(trade.amountUsd)) {
      volume += trade.amountUsd;
      volumeKnown = true;
    }
  }

  const parts: string[] = [];
  if (recent.length === 0) {
    parts.push("No recent pool prints above $1 in this window.");
  } else {
    parts.push(
      `${recent.length} recent pool print${recent.length === 1 ? "" : "s"} · ${buys} buy / ${sells} sell`,
    );
  }
  if (tracked.length > 0) {
    parts.push(
      `${tracked.length} tracked desk move${tracked.length === 1 ? "" : "s"} on this coin`,
    );
  } else {
    parts.push("No tracked desk moves on this coin in the personal pulse window.");
  }

  return {
    poolName: input.poolName,
    poolAddress: input.poolAddress,
    summary: parts.join(" · "),
    buys,
    sells,
    volumeUsdLabel: volumeKnown ? money(volume) : "—",
    recent,
    tracked,
  };
}

/** Attach personal tracked moves onto an existing analysis flow tape. */
export function withTrackedFlowMoves(
  analysis: CoinAnalysis,
  moves: PulseItem[],
): CoinAnalysis {
  const tracked = mapTrackedMoves(moves);
  const baseSummary = analysis.flow.summary
    .replace(/\s*·\s*No tracked desk moves on this coin in the personal pulse window\./i, "")
    .replace(/\s*·\s*\d+ tracked desk move[s]? on this coin/i, "")
    .trim();

  const trackedNote =
    tracked.length > 0
      ? `${tracked.length} tracked desk move${tracked.length === 1 ? "" : "s"} on this coin`
      : "No tracked desk moves on this coin in the personal pulse window.";

  return {
    ...analysis,
    flow: {
      ...analysis.flow,
      tracked,
      summary: baseSummary ? `${baseSummary} · ${trackedNote}` : trackedNote,
    },
  };
}

function pctLabel(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function bandToneForTop10(pct: number | null): HolderBandTone {
  if (pct == null) return "unknown";
  if (pct > 55) return "risk";
  if (pct > 40) return "watch";
  return "ok";
}

/** Build a grounded holder concentration map from on-chain distribution fields. */
export function buildHolderMap(
  holders: TokenHoldersInfo | null | undefined,
  opts?: { cexMajor?: boolean },
): CoinHolderMap {
  if (opts?.cexMajor) {
    return {
      level: "unknown",
      summary: "CEX majors — on-chain holder concentration is less meaningful than venue liquidity.",
      countLabel: "—",
      lastUpdated: null,
      bands: [
        {
          id: "venue",
          label: "Distribution lens",
          pctLabel: "—",
          pct: null,
          detail: "Use exchange order books for concentration risk on CEX majors.",
          tone: "unknown",
        },
      ],
    };
  }

  if (!holders) {
    return {
      level: "unknown",
      summary: "Holder concentration not available in this window’s feeds.",
      countLabel: "—",
      lastUpdated: null,
      bands: [
        {
          id: "availability",
          label: "Feed coverage",
          pctLabel: "—",
          pct: null,
          detail: "No holder distribution attributes returned for this token.",
          tone: "unknown",
        },
      ],
    };
  }

  const top10 = holders.top10Pct;
  const next20 = holders.next20Pct;
  const next20b = holders.next20bPct;
  const rest = holders.restPct;

  const bands: HolderBand[] = [
    {
      id: "top10",
      label: "Top 10",
      pctLabel: pctLabel(top10),
      pct: top10,
      detail:
        top10 == null
          ? "Top 10 share not reported."
          : top10 > 55
            ? "Extreme concentration — a few wallets can move price hard."
            : top10 > 40
              ? "Elevated concentration — watch for coordinated dumps."
              : "Healthier top-10 share than most memes.",
      tone: bandToneForTop10(top10),
    },
    {
      id: "next20",
      label: "Next 20 (11–30)",
      pctLabel: pctLabel(next20),
      pct: next20,
      detail:
        next20 == null
          ? "Next-20 band not reported."
          : `Wallets 11–30 hold ~${next20.toFixed(1)}% — mid-tier desk concentration.`,
      tone: next20 == null ? "unknown" : next20 > 25 ? "watch" : "ok",
    },
    {
      id: "next20b",
      label: "Next 20 (31–50)",
      pctLabel: pctLabel(next20b),
      pct: next20b,
      detail:
        next20b == null
          ? "31–50 band not reported."
          : `Wallets 31–50 hold ~${next20b.toFixed(1)}%.`,
      tone: next20b == null ? "unknown" : "ok",
    },
    {
      id: "rest",
      label: "Rest of holders",
      pctLabel: pctLabel(rest),
      pct: rest,
      detail:
        rest == null
          ? "Long-tail share not reported."
          : rest < 20
            ? "Thin long tail — supply is clustered at the top."
            : `Broader float holds ~${rest.toFixed(1)}%.`,
      tone: rest == null ? "unknown" : rest < 20 ? "watch" : "ok",
    },
  ];

  const level: CoinHolderMap["level"] =
    top10 == null
      ? "unknown"
      : top10 > 55
        ? "high"
        : top10 > 40
          ? "medium"
          : "low";

  const countLabel =
    holders.count != null ? holders.count.toLocaleString("en-US") : "—";

  const summary =
    top10 == null && holders.count == null
      ? "Holder concentration not available in this window’s feeds."
      : top10 == null
        ? `About ${countLabel} holders reported — distribution bands incomplete.`
        : top10 > 55
          ? `High concentration risk — top 10 control ~${top10.toFixed(1)}%${holders.count != null ? ` across ~${countLabel} holders` : ""}.`
          : top10 > 40
            ? `Moderate concentration — top 10 control ~${top10.toFixed(1)}%${holders.count != null ? ` across ~${countLabel} holders` : ""}.`
            : `Relatively distributed — top 10 hold ~${top10.toFixed(1)}%${holders.count != null ? ` across ~${countLabel} holders` : ""}.`;

  return {
    level,
    summary,
    countLabel,
    lastUpdated: holders.lastUpdated,
    bands,
  };
}

function changeLabel(pct: number | null | undefined) {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function signalForChange(pct: number | null | undefined): MomentumSignal {
  if (pct == null || !Number.isFinite(pct)) return "unknown";
  if (pct >= 3) return "up";
  if (pct <= -3) return "down";
  return "flat";
}

function pctMove(from: number, to: number): number | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return ((to - from) / from) * 100;
}

function candleChange(candles: Candle[], hoursBack: number): number | null {
  if (candles.length < 2) return null;
  const latest = candles[candles.length - 1];
  if (!latest) return null;
  const target = latest.time - hoursBack * 3600;
  let anchor = candles[0];
  for (const candle of candles) {
    if (candle.time <= target) anchor = candle;
    else break;
  }
  if (!anchor || anchor.time > latest.time) return null;
  return pctMove(anchor.close, latest.close);
}

function candleRangeLabel(candles: Candle[]): string {
  if (candles.length < 2) return "Range not available.";
  const slice = candles.slice(-24);
  let high = -Infinity;
  let low = Infinity;
  for (const candle of slice) {
    high = Math.max(high, candle.high);
    low = Math.min(low, candle.low);
  }
  if (!Number.isFinite(high) || !Number.isFinite(low) || low <= 0) {
    return "Range not available.";
  }
  const width = ((high - low) / low) * 100;
  return `24h candle range ~${width.toFixed(1)}% (high ${money(high)} / low ${money(low)}).`;
}

/** Build short-timeframe momentum + volume/liquidity structure from pool feeds. */
export function buildMomentum(input: {
  change1h: number | null;
  change6h: number | null;
  change24h: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  candles?: Candle[];
  cexMajor?: boolean;
}): CoinMomentum {
  if (input.cexMajor) {
    return {
      bias: "unknown",
      summary: "CEX majors — use the chart lane for momentum; DEX vol/liq is not the right lens.",
      volLiqLabel: "—",
      volLiqRatio: null,
      rangeLabel: "Use TradingView for structure on CEX majors.",
      windows: [
        { id: "1h", label: "1H", changeLabel: "—", changePct: null, signal: "unknown" },
        { id: "6h", label: "6H", changeLabel: "—", changePct: null, signal: "unknown" },
        { id: "24h", label: "24H", changeLabel: "—", changePct: null, signal: "unknown" },
      ],
      notes: ["Prefer the TradingView lane for CEX-style momentum."],
    };
  }

  const candles = input.candles ?? [];
  const change1h = input.change1h ?? candleChange(candles, 1);
  const change6h = input.change6h ?? candleChange(candles, 6);
  const change4h = candleChange(candles, 4);
  const change24h = input.change24h ?? candleChange(candles, 24);

  const windows: MomentumWindow[] = [
    {
      id: "1h",
      label: "1H",
      changeLabel: changeLabel(change1h),
      changePct: change1h,
      signal: signalForChange(change1h),
    },
    {
      id: "4h",
      label: "4H",
      changeLabel: changeLabel(change4h ?? change6h),
      changePct: change4h ?? change6h,
      signal: signalForChange(change4h ?? change6h),
    },
    {
      id: "24h",
      label: "24H",
      changeLabel: changeLabel(change24h),
      changePct: change24h,
      signal: signalForChange(change24h),
    },
  ];

  const vol = input.volume24hUsd;
  const liq = input.liquidityUsd;
  const volLiqRatio =
    vol != null && liq != null && liq > 0 && Number.isFinite(vol / liq) ? vol / liq : null;
  const volLiqLabel =
    volLiqRatio == null ? "—" : `${volLiqRatio.toFixed(1)}× vol / liq`;

  const notes: string[] = [];
  if (volLiqRatio != null) {
    if (volLiqRatio > 8) {
      notes.push("24h volume is very high vs liquidity — possible wash or thin-book churn.");
    } else if (volLiqRatio > 3) {
      notes.push("Active turnover vs the book — moves can travel fast.");
    } else if (volLiqRatio < 0.4) {
      notes.push("Quiet tape vs liquidity — momentum may fade without new flow.");
    } else {
      notes.push("Volume vs liquidity looks orderly for this pool window.");
    }
  } else {
    notes.push("Volume / liquidity ratio not available in this window.");
  }

  const known = windows.filter((w) => w.changePct != null);
  const up = known.filter((w) => (w.changePct ?? 0) >= 3).length;
  const down = known.filter((w) => (w.changePct ?? 0) <= -3).length;
  const mixed = known.length >= 2 && up > 0 && down > 0;

  let bias: CoinMomentum["bias"] = "unknown";
  if (known.length === 0) bias = "unknown";
  else if (mixed) bias = "choppy";
  else if (up >= 2 || (change24h != null && change24h >= 8 && up >= 1)) bias = "bullish";
  else if (down >= 2 || (change24h != null && change24h <= -8 && down >= 1)) bias = "bearish";
  else if (known.every((w) => Math.abs(w.changePct ?? 0) < 3)) bias = "quiet";
  else if (up > down) bias = "bullish";
  else if (down > up) bias = "bearish";
  else bias = "choppy";

  const summary =
    known.length === 0
      ? "Momentum windows not available in this pool’s feeds."
      : bias === "bullish"
        ? `Short-timeframe bias leans up — ${windows.map((w) => `${w.label} ${w.changeLabel}`).join(" · ")}.`
        : bias === "bearish"
          ? `Short-timeframe bias leans down — ${windows.map((w) => `${w.label} ${w.changeLabel}`).join(" · ")}.`
          : bias === "choppy"
            ? `Choppy structure across windows — ${windows.map((w) => `${w.label} ${w.changeLabel}`).join(" · ")}.`
            : bias === "quiet"
              ? `Quiet tape — moves stay inside a few percent across short windows.`
              : "Momentum reads incomplete for this window.";

  return {
    bias,
    summary,
    volLiqLabel,
    volLiqRatio,
    rangeLabel: candleRangeLabel(candles),
    windows,
    notes: notes.slice(0, 4),
  };
}

function buildRisk(desk: TokenDesk) {
  const notes: string[] = [];
  let score = 0;
  const sec = desk.info?.security;

  if (sec?.isHoneypot === true || sec?.isHoneypot === "true") {
    notes.push("Flagged as possible honeypot — treat as high risk.");
    score += 3;
  }
  if (sec?.mintAuthority && sec.mintAuthority !== "false" && sec.mintAuthority !== "null") {
    notes.push("Mint authority may still be active.");
    score += 2;
  }
  if (sec?.freezeAuthority && sec.freezeAuthority !== "false" && sec.freezeAuthority !== "null") {
    notes.push("Freeze authority may still be active.");
    score += 2;
  }
  if (desk.liquidityUsd != null && desk.liquidityUsd < 10_000) {
    notes.push("Very thin liquidity (<$10k) — exits can fail.");
    score += 3;
  } else if (desk.liquidityUsd != null && desk.liquidityUsd < 25_000) {
    notes.push("Thin liquidity — exits can slip hard.");
    score += 2;
  } else if (desk.liquidityUsd != null && desk.liquidityUsd < 100_000) {
    notes.push("Moderate liquidity — size carefully.");
    score += 1;
  }
  if (
    desk.volume24hUsd != null &&
    desk.liquidityUsd != null &&
    desk.liquidityUsd > 0 &&
    desk.volume24hUsd / desk.liquidityUsd > 8
  ) {
    notes.push("24h volume is very high vs liquidity — possible wash or thin book churn.");
    score += 1;
  }
  if (desk.info?.holders.top10Pct != null && desk.info.holders.top10Pct > 55) {
    notes.push(`Extreme concentration: top 10 hold ~${desk.info.holders.top10Pct.toFixed(0)}%.`);
    score += 2;
  } else if (desk.info?.holders.top10Pct != null && desk.info.holders.top10Pct > 40) {
    notes.push(`Top 10 holders control ~${desk.info.holders.top10Pct.toFixed(0)}%.`);
    score += 1;
  }
  if (sec?.developerHoldingPct != null && sec.developerHoldingPct > 10) {
    notes.push(`Developer holding ~${sec.developerHoldingPct.toFixed(1)}%.`);
    score += 1;
  }
  if (sec?.gtScore != null) {
    notes.push(`GeckoTerminal score ${sec.gtScore.toFixed(0)}/100.`);
    if (sec.gtScore < 40) score += 2;
    else if (sec.gtScore < 60) score += 1;
  }
  if (sec?.verified === false) {
    notes.push("Token not marked verified in available feeds.");
    score += 1;
  }
  if (notes.length === 0) notes.push("No hard security red flags in available feeds.");

  const level = score >= 5 ? "high" : score >= 2 ? "medium" : score === 0 ? "low" : "medium";
  return { level: level as "low" | "medium" | "high" | "unknown", notes };
}

function buildStructure(desk: TokenDesk, mcapValue: number | null) {
  const liq = desk.liquidityUsd;
  const vol = desk.volume24hUsd;
  const top10 = desk.info?.holders.top10Pct;

  const liquidityNote =
    liq == null
      ? "Liquidity not reported for this pool."
      : liq < 25_000
        ? `Liquidity ${money(liq)} — thin book; expect slippage.`
        : liq < 250_000
          ? `Liquidity ${money(liq)} — usable for small size.`
          : `Liquidity ${money(liq)} — deeper book on this pool.`;

  const volumeNote =
    vol == null
      ? "24h volume not reported."
      : liq != null && liq > 0
        ? `24h volume ${money(vol)} (${(vol / liq).toFixed(1)}× liquidity).`
        : `24h volume ${money(vol)}.`;

  const holderNote =
    top10 == null
      ? "Holder concentration not available."
      : top10 > 40
        ? `Top 10 control ${top10.toFixed(1)}% — concentration risk.`
        : `Top 10 control ${top10.toFixed(1)}% — healthier distribution than most memes.`;

  if (mcapValue != null && liq != null && mcapValue > 0) {
    // depth already covered in market.depthLabel; keep notes focused
  }

  return { liquidityNote, volumeNote, holderNote };
}

/** Grounded research brief from live desk sources (no LLM required). */
export async function buildCoinAnalysis(input: {
  network: string;
  address: string;
  whyHere?: string | null;
  trackedWalletBuys?: number;
}): Promise<CoinAnalysis | null> {
  const sources: string[] = [];
  let desk: TokenDesk | null = null;

  if (input.network === "coingecko") {
    const intel = await fetchCoinIntel({
      network: "coingecko",
      address: input.address,
      coingeckoId: input.address,
      symbol: input.address,
      hasSocialLinks: false,
    });
    return {
      symbol: (intel.symbol || input.address).toUpperCase(),
      name: input.address,
      network: "coingecko",
      address: input.address,
      headline: "Major / CoinGecko desk — use TradingView chart for market structure.",
      summary: [
        "This asset is routed through CoinGecko / CEX-style data.",
        "Prefer the TradingView lane for price action; pair this with your watchlist and wallet pulse for context.",
        ...intel.pulse.slice(0, 2),
      ].slice(0, 6),
      market: {
        priceLabel: "—",
        mcapLabel: "—",
        mcapKind: "Market cap",
        change24hLabel: "—",
        volumeLabel: "—",
        liquidityLabel: "—",
        depthLabel: null,
      },
      structure: {
        liquidityNote: "CEX majors — liquidity is venue-dependent, not a single DEX pool.",
        volumeNote: "Use TradingView volume for structure.",
        holderNote: "On-chain holder concentration is less relevant for CEX majors.",
      },
      risk: { level: "unknown", notes: ["CEX majors — risk is market/volatility, not honeypot style."] },
      security: buildSecurityDesk(null, { cexMajor: true }),
      flow: buildFlowTape({
        poolName: null,
        poolAddress: null,
        trades: [],
        cexMajor: true,
      }),
      holderMap: buildHolderMap(null, { cexMajor: true }),
      momentum: buildMomentum({
        change1h: null,
        change6h: null,
        change24h: null,
        volume24hUsd: null,
        liquidityUsd: null,
        cexMajor: true,
      }),
      social: { websites: [], twitter: null, telegram: null, discord: null, description: null },
      holders: { countLabel: "—", top10Label: "—", next20Label: "—" },
      whyHere: input.whyHere ?? null,
      opportunity: computeOpportunityScore({
        change24h: null,
        riskLevel: "unknown",
        hasSocials: intel.social.twitterFollowers != null || intel.headlines.length > 0,
        hasWhyHere: Boolean(input.whyHere),
        trackedWalletBuys: input.whyHere ? 1 : 0,
        sentimentUpPct: intel.social.sentimentUpPct,
        twitterFollowers: intel.social.twitterFollowers,
        headlineCount: intel.headlines.length,
      }),
      intel,
      sources: ["CoinGecko", "TradingView", ...intel.sources],
      generatedAt: new Date().toISOString(),
    };
  }

  const [deskResult, enrichResult] = await Promise.all([
    fetchTokenDesk(input.network, input.address).catch(() => null),
    fetchDexScreenerEnrichment(input.address, input.network).catch(() => null),
  ]);
  desk = deskResult;
  const enrich = enrichResult;
  if (desk) sources.push("GeckoTerminal");
  if (enrich) sources.push("DexScreener");

  if (!desk && !enrich) return null;

  const info =
    desk?.info ||
    (await fetchOnchainTokenInfo(input.network, input.address).catch(() => null));
  if (info && !sources.includes("CoinGecko onchain")) sources.push("CoinGecko onchain");

  const merged: TokenDesk = desk
    ? {
        ...desk,
        priceUsd: desk.priceUsd ?? enrich?.priceUsd ?? null,
        marketCapUsd: desk.marketCapUsd ?? enrich?.marketCapUsd ?? null,
        fdvUsd: desk.fdvUsd ?? enrich?.fdvUsd ?? null,
        volume24hUsd: desk.volume24hUsd ?? enrich?.volume24hUsd ?? null,
        liquidityUsd: desk.liquidityUsd ?? enrich?.liquidityUsd ?? null,
        priceChange1h: desk.priceChange1h ?? null,
        priceChange6h: desk.priceChange6h ?? null,
        priceChange24h: desk.priceChange24h ?? enrich?.priceChange24h ?? null,
        poolAddress: desk.poolAddress ?? enrich?.pairAddress ?? null,
        info: info || desk.info,
      }
    : {
        network: input.network,
        address: input.address,
        name: enrich?.name || (enrich?.pairAddress ? "Token" : "Unknown"),
        symbol: (enrich?.symbol || "???").toUpperCase(),
        imageUrl: enrich?.imageUrl ?? null,
        priceUsd: enrich?.priceUsd ?? null,
        marketCapUsd: enrich?.marketCapUsd ?? null,
        fdvUsd: enrich?.fdvUsd ?? null,
        volume24hUsd: enrich?.volume24hUsd ?? null,
        liquidityUsd: enrich?.liquidityUsd ?? null,
        decimals: null,
        supply: null,
        coingeckoId: info?.coingeckoId ?? null,
        poolAddress: enrich?.pairAddress ?? null,
        poolName: null,
        priceChange1h: null,
        priceChange6h: null,
        priceChange24h: enrich?.priceChange24h ?? null,
        info,
        depth: {
          liquidityUsd: enrich?.liquidityUsd ?? null,
          volume24hUsd: enrich?.volume24hUsd ?? null,
          fdvUsd: enrich?.fdvUsd ?? null,
          marketCapUsd: enrich?.marketCapUsd ?? null,
          depthRatio: null,
        },
      };

  if (info?.imageUrl && !merged.imageUrl) merged.imageUrl = info.imageUrl;
  if (info?.coingeckoId) merged.coingeckoId = info.coingeckoId;

  const mcap = estimateMarketCap({
    marketCapUsd: merged.marketCapUsd,
    fdvUsd: merged.fdvUsd,
    priceUsd: merged.priceUsd,
    supply: merged.supply,
  });

  const change = merged.priceChange24h;
  const risk = buildRisk(merged);
  const security = buildSecurityDesk(merged.info?.security);
  const structure = buildStructure(merged, mcap.value);

  const hasPoolWindows =
    merged.priceChange1h != null &&
    merged.priceChange6h != null &&
    merged.priceChange24h != null;
  const hasSocials = Boolean(
    info?.socials.twitter ||
      info?.socials.telegram ||
      (info?.socials.websites?.length ?? 0) > 0,
  );

  const poolAddress = merged.poolAddress;
  const [tradesResult, candlesResult, intel] = await Promise.all([
    poolAddress
      ? fetchPoolTrades(merged.network, poolAddress, 24).catch(() => [] as TokenTrade[])
      : Promise.resolve([] as TokenTrade[]),
    poolAddress && !hasPoolWindows
      ? fetchPoolOhlcv({
          network: merged.network,
          poolAddress,
          timeframe: "hour",
          aggregate: 1,
          limit: 24,
          soft: true,
        }).catch(() => [] as Candle[])
      : Promise.resolve([] as Candle[]),
    fetchCoinIntel({
      network: input.network,
      address: input.address,
      coingeckoId: merged.coingeckoId,
      symbol: merged.symbol,
      hasSocialLinks: hasSocials,
    }),
  ]);
  const poolTrades = tradesResult;
  const hourCandles = candlesResult;
  if (poolTrades.length > 0 && !sources.includes("GeckoTerminal trades")) {
    sources.push("GeckoTerminal trades");
  }
  if (hourCandles.length > 0 && !sources.includes("GeckoTerminal OHLCV")) {
    sources.push("GeckoTerminal OHLCV");
  }
  if (intel.sources.length > 0) {
    for (const source of intel.sources) {
      if (!sources.includes(source)) sources.push(source);
    }
  }

  const flow = buildFlowTape({
    poolName: merged.poolName,
    poolAddress: merged.poolAddress,
    trades: poolTrades,
  });
  const holderMap = buildHolderMap(merged.info?.holders);
  const momentum = buildMomentum({
    change1h: merged.priceChange1h,
    change6h: merged.priceChange6h,
    change24h: merged.priceChange24h,
    volume24hUsd: merged.volume24hUsd,
    liquidityUsd: merged.liquidityUsd,
    candles: hourCandles,
  });
  if (hasPoolWindows && hourCandles.length === 0) {
    momentum.rangeLabel =
      "Candle range skipped — pool already published 1H/6H/24H windows.";
  }
  const depth =
    merged.liquidityUsd != null && mcap.value != null && mcap.value > 0
      ? `${((merged.liquidityUsd / mcap.value) * 100).toFixed(1)}% liq / mcap`
      : null;

  const summary: string[] = [];
  if (input.whyHere) summary.push(input.whyHere);

  if (change != null) {
    summary.push(
      change >= 0
        ? `Up ${change.toFixed(1)}% over 24h on available pool data.`
        : `Down ${Math.abs(change).toFixed(1)}% over 24h on available pool data.`,
    );
  }
  summary.push(structure.liquidityNote);
  summary.push(structure.volumeNote);
  summary.push(structure.holderNote);
  if (mcap.value != null) {
    summary.push(`${mcap.label} prints around ${money(mcap.value)}.`);
  }
  if (hasSocials) {
    summary.push("Public social / web links are available — check them before sizing any idea.");
  } else {
    summary.push("Little verified social presence in feeds — treat narrative claims carefully.");
  }

  const headline =
    input.whyHere?.startsWith("Tracked")
      ? `${merged.symbol}: on your radar because a tracked wallet moved it`
      : `${merged.symbol}: live desk brief from market + on-chain feeds`;

  const opportunity = computeOpportunityScore({
    change24h: change,
    volume24hUsd: merged.volume24hUsd,
    liquidityUsd: merged.liquidityUsd,
    marketCapUsd: mcap.value,
    riskLevel: risk.level,
    gtScore: merged.info?.security?.gtScore ?? null,
    hasSocials,
    holderTop10Pct: merged.info?.holders.top10Pct ?? null,
    hasWhyHere: Boolean(input.whyHere),
    trackedWalletBuys: input.trackedWalletBuys ?? (input.whyHere ? 1 : 0),
    sentimentUpPct: intel.social.sentimentUpPct,
    twitterFollowers: intel.social.twitterFollowers,
    headlineCount: intel.headlines.length,
  });

  return {
    symbol: merged.symbol,
    name: merged.name,
    network: merged.network,
    address: merged.address,
    headline,
    summary: summary.slice(0, 6),
    market: {
      priceLabel: money(merged.priceUsd),
      mcapLabel: money(mcap.value),
      mcapKind: mcap.label,
      change24hLabel:
        change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
      volumeLabel: money(merged.volume24hUsd),
      liquidityLabel: money(merged.liquidityUsd),
      depthLabel: depth,
    },
    structure,
    risk,
    security,
    flow,
    holderMap,
    momentum,
    social: {
      websites: (info?.socials.websites ?? []).filter((url) => /^https?:\/\//i.test(url)),
      twitter: info?.socials.twitter ?? null,
      telegram: info?.socials.telegram ?? null,
      discord: info?.socials.discord ?? null,
      description: info?.description ?? null,
    },
    holders: {
      countLabel:
        info?.holders.count != null ? info.holders.count.toLocaleString("en-US") : "—",
      top10Label:
        info?.holders.top10Pct != null ? `${info.holders.top10Pct.toFixed(1)}%` : "—",
      next20Label:
        info?.holders.next20Pct != null ? `${info.holders.next20Pct.toFixed(1)}%` : "—",
    },
    whyHere: input.whyHere ?? null,
    opportunity,
    intel,
    sources,
    generatedAt: new Date().toISOString(),
  };
}
