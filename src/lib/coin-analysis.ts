import { estimateMarketCap } from "@/lib/candle-math";
import { fetchCoinIntel, type CoinIntel } from "@/lib/coin-intel";
import { fetchDexScreenerEnrichment } from "@/lib/dexscreener";
import { fetchTokenDesk, type TokenDesk } from "@/lib/geckoterminal";
import { computeOpportunityScore, type OpportunityResult } from "@/lib/opportunity-score";
import {
  fetchOnchainTokenInfo,
  type TokenSecurity,
} from "@/lib/token-info";

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

  try {
    desk = await fetchTokenDesk(input.network, input.address);
    if (desk) sources.push("GeckoTerminal");
  } catch {
    desk = null;
  }

  const enrich = await fetchDexScreenerEnrichment(input.address, input.network).catch(() => null);
  if (enrich) sources.push("DexScreener");

  if (!desk && !enrich) return null;

  const info =
    desk?.info ||
    (await fetchOnchainTokenInfo(input.network, input.address).catch(() => null));
  if (info) sources.push("CoinGecko onchain");

  const merged: TokenDesk = desk
    ? {
        ...desk,
        priceUsd: desk.priceUsd ?? enrich?.priceUsd ?? null,
        marketCapUsd: desk.marketCapUsd ?? enrich?.marketCapUsd ?? null,
        fdvUsd: desk.fdvUsd ?? enrich?.fdvUsd ?? null,
        volume24hUsd: desk.volume24hUsd ?? enrich?.volume24hUsd ?? null,
        liquidityUsd: desk.liquidityUsd ?? enrich?.liquidityUsd ?? null,
        priceChange24h: desk.priceChange24h ?? enrich?.priceChange24h ?? null,
        info: info || desk.info,
      }
    : {
        network: input.network,
        address: input.address,
        name: enrich?.pairAddress ? "Token" : "Unknown",
        symbol: "???",
        imageUrl: null,
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
  if (info?.socials.twitter || info?.socials.telegram || (info?.socials.websites?.length ?? 0) > 0) {
    summary.push("Public social / web links are available — check them before sizing any idea.");
  } else {
    summary.push("Little verified social presence in feeds — treat narrative claims carefully.");
  }

  const headline =
    input.whyHere?.startsWith("Tracked")
      ? `${merged.symbol}: on your radar because a tracked wallet moved it`
      : `${merged.symbol}: live desk brief from market + on-chain feeds`;

  const hasSocials = Boolean(
    info?.socials.twitter ||
      info?.socials.telegram ||
      (info?.socials.websites?.length ?? 0) > 0,
  );

  const intel = await fetchCoinIntel({
    network: input.network,
    address: input.address,
    coingeckoId: merged.coingeckoId,
    symbol: merged.symbol,
    hasSocialLinks: hasSocials,
  });
  if (intel.sources.length > 0) {
    for (const source of intel.sources) {
      if (!sources.includes(source)) sources.push(source);
    }
  }

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
