/** Multi-factor Opportunity Score — ranks attention, not buy signals. */

export type OpportunityDimensionKey = "flows" | "market" | "risk" | "social";

export type OpportunityDimension = {
  key: OpportunityDimensionKey;
  label: string;
  value: number;
  detail: string;
};

export type OpportunityResult = {
  total: number;
  dimensions: OpportunityDimension[];
  headline: string;
};

export type OpportunityInputs = {
  change24h?: number | null;
  volume24hUsd?: number | null;
  liquidityUsd?: number | null;
  marketCapUsd?: number | null;
  riskLevel?: "low" | "medium" | "high" | "unknown";
  gtScore?: number | null;
  hasSocials?: boolean;
  holderTop10Pct?: number | null;
  /** Distinct tracked-wallet buys on this token (pulse). */
  trackedWalletBuys?: number;
  /** User opened coin from a tracked-wallet buy rail. */
  hasWhyHere?: boolean;
  sentimentUpPct?: number | null;
  twitterFollowers?: number | null;
  headlineCount?: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreFlows(input: OpportunityInputs): OpportunityDimension {
  const buys = Math.max(0, input.trackedWalletBuys ?? 0);
  let value = 28;
  const parts: string[] = [];

  if (input.hasWhyHere) {
    value += 28;
    parts.push("opened from a tracked-wallet buy");
  }
  if (buys > 0) {
    value += Math.min(30, buys * 12);
    parts.push(
      buys === 1
        ? "1 tracked wallet bought recently"
        : `${buys} tracked wallets bought recently`,
    );
  }
  const change = input.change24h ?? 0;
  if (buys > 0 && change > 0) {
    value += 8;
    parts.push("price still green on 24h tape");
  }
  if (parts.length === 0) {
    parts.push("no followed-wallet accumulation yet");
  }

  return {
    key: "flows",
    label: "On-chain flows",
    value: clamp(value),
    detail: parts.join(" · "),
  };
}

function scoreMarket(input: OpportunityInputs): OpportunityDimension {
  const change = input.change24h ?? 0;
  const volume = Math.max(input.volume24hUsd ?? 0, 0);
  const liquidity = Math.max(input.liquidityUsd ?? 0, 0);
  const mcap = Math.max(input.marketCapUsd ?? 0, 0);

  let value = 38;
  const parts: string[] = [];

  if (change >= -8 && change <= 18) {
    value += 18;
    parts.push(change >= 0 ? "24h momentum positive" : "pullback within normal range");
  } else if (change > 18) {
    value += 6;
    parts.push("extended 24h move — late-entry risk");
  } else {
    value -= 6;
    parts.push("heavy 24h drawdown");
  }

  if (liquidity >= 250_000) {
    value += 22;
    parts.push("deep liquidity");
  } else if (liquidity >= 25_000) {
    value += 14;
    parts.push("usable liquidity");
  } else if (liquidity > 0) {
    value += 4;
    parts.push("thin liquidity");
  }

  if (volume > 0 && liquidity > 0) {
    const ratio = volume / liquidity;
    if (ratio >= 0.4 && ratio <= 6) {
      value += 12;
      parts.push("volume expanding with book depth");
    } else if (ratio > 8) {
      value -= 8;
      parts.push("volume very high vs liquidity");
    }
  } else if (volume > 50_000) {
    value += 8;
    parts.push("active 24h volume");
  }

  if (mcap > 0) {
    value += Math.min(12, Math.log10(mcap + 1) * 1.6);
  }

  if (parts.length === 0) parts.push("market structure data limited");

  return {
    key: "market",
    label: "Market structure",
    value: clamp(value),
    detail: parts.join(" · "),
  };
}

function scoreRisk(input: OpportunityInputs): OpportunityDimension {
  const level = input.riskLevel ?? "unknown";
  let value =
    level === "low" ? 82 : level === "medium" ? 58 : level === "high" ? 24 : 48;

  const parts: string[] = [];
  if (level === "low") parts.push("no hard red flags in feeds");
  else if (level === "medium") parts.push("some concentration or liquidity flags");
  else if (level === "high") parts.push("honeypot / liquidity / holder warnings");
  else parts.push("risk feeds incomplete");

  if (input.gtScore != null) {
    value = clamp(value * 0.55 + input.gtScore * 0.45);
    parts.push(`GT security ${input.gtScore.toFixed(0)}/100`);
  }

  const top10 = input.holderTop10Pct;
  if (top10 != null) {
    if (top10 <= 35) value += 8;
    else if (top10 >= 55) value -= 12;
    parts.push(`top 10 hold ~${top10.toFixed(0)}%`);
  }

  return {
    key: "risk",
    label: "Risk quality",
    value: clamp(value),
    detail: parts.join(" · "),
  };
}

function scoreSocial(input: OpportunityInputs): OpportunityDimension {
  let value = input.hasSocials ? 52 : 28;
  const parts: string[] = [];
  const headlines = input.headlineCount ?? 0;
  const followers = input.twitterFollowers;
  const sentiment = input.sentimentUpPct;
  const hasCrowd =
    sentiment != null || (followers != null && followers > 0) || headlines > 0;

  if (input.hasSocials) {
    parts.push("public web / social links found");
    value += 8;
  } else if (!hasCrowd) {
    parts.push("no crowd or news data");
  } else {
    parts.push("little verified social presence");
  }

  if (sentiment != null) {
    value += (sentiment - 50) * 0.35;
    parts.push(`CG sentiment ${sentiment.toFixed(0)}% up`);
  }

  if (followers != null && followers > 10_000) {
    value += Math.min(12, Math.log10(followers) * 3);
    parts.push(`${followers >= 1_000_000 ? `${(followers / 1_000_000).toFixed(1)}M` : `${Math.round(followers / 1000)}k`} X followers`);
  }

  if (headlines > 0) {
    value += Math.min(10, headlines * 2);
    parts.push(`${headlines} recent headline${headlines === 1 ? "" : "s"}`);
  }

  if (input.gtScore != null && sentiment == null && headlines === 0) {
    value = clamp(value * 0.55 + input.gtScore * 0.45);
    if (!input.hasSocials) parts.push(`GT score ${input.gtScore.toFixed(0)}/100`);
  }

  return {
    key: "social",
    label: "Social momentum",
    value: clamp(value),
    detail: parts.join(" · "),
  };
}

function buildHeadline(total: number, dimensions: OpportunityDimension[]) {
  const top = [...dimensions].sort((a, b) => b.value - a.value)[0];
  if (total >= 80) return `Strong convergence — led by ${top.label.toLowerCase()}.`;
  if (total >= 65) return `Above-average setup — watch ${top.label.toLowerCase()}.`;
  if (total >= 45) return `Mixed evidence — ${top.label.toLowerCase()} is the bright spot.`;
  return `Weak composite — ${top.label.toLowerCase()} is not enough alone.`;
}

/** Full desk score from market + risk + optional wallet context. */
export function computeOpportunityScore(input: OpportunityInputs): OpportunityResult {
  const dimensions = [
    scoreFlows(input),
    scoreMarket(input),
    scoreRisk(input),
    scoreSocial(input),
  ];

  const weights = { flows: 0.28, market: 0.3, risk: 0.24, social: 0.18 } as const;
  const total = clamp(
    dimensions.reduce((sum, dim) => sum + dim.value * weights[dim.key], 0),
  );

  return {
    total,
    dimensions,
    headline: buildHeadline(total, dimensions),
  };
}

/** Lightweight score for screener rows (market-only + optional wallet buys). */
export function scoreFromMarketSnapshot(input: OpportunityInputs): number {
  return computeOpportunityScore({
    ...input,
    riskLevel: input.riskLevel ?? "unknown",
    hasSocials: input.hasSocials ?? false,
  }).total;
}

/** Back-compat helper for CoinGecko major list sorting. */
export function legacyMajorScore(input: {
  change24h: number | null;
  volume: number | null;
  marketCap: number | null;
}) {
  return scoreFromMarketSnapshot({
    change24h: input.change24h,
    volume24hUsd: input.volume,
    marketCapUsd: input.marketCap,
    liquidityUsd: null,
    riskLevel: "low",
    hasSocials: true,
  });
}
