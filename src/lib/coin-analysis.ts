import { estimateMarketCap } from "@/lib/candle-math";
import { fetchDexScreenerEnrichment } from "@/lib/dexscreener";
import { fetchTokenDesk, type TokenDesk } from "@/lib/geckoterminal";
import { fetchOnchainTokenInfo } from "@/lib/token-info";

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
  risk: {
    level: "low" | "medium" | "high" | "unknown";
    notes: string[];
  };
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
  };
  whyHere: string | null;
  sources: string[];
  generatedAt: string;
};

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
  if (desk.liquidityUsd != null && desk.liquidityUsd < 25_000) {
    notes.push("Thin liquidity — exits can slip hard.");
    score += 2;
  }
  if (desk.info?.holders.top10Pct != null && desk.info.holders.top10Pct > 40) {
    notes.push(`Top 10 holders control ~${desk.info.holders.top10Pct.toFixed(0)}%.`);
    score += 1;
  }
  if (sec?.gtScore != null) {
    notes.push(`GeckoTerminal score ${sec.gtScore.toFixed(0)}/100.`);
    if (sec.gtScore < 40) score += 2;
  }
  if (notes.length === 0) notes.push("No hard security red flags in available feeds.");

  const level = score >= 4 ? "high" : score >= 2 ? "medium" : score === 0 ? "low" : "medium";
  return { level: level as "low" | "medium" | "high" | "unknown", notes };
}

/** Grounded research brief from live desk sources (no LLM required). */
export async function buildCoinAnalysis(input: {
  network: string;
  address: string;
  whyHere?: string | null;
}): Promise<CoinAnalysis | null> {
  const sources: string[] = [];
  let desk: TokenDesk | null = null;

  if (input.network === "coingecko") {
    return {
      symbol: input.address.toUpperCase(),
      name: input.address,
      network: "coingecko",
      address: input.address,
      headline: "Major / CoinGecko desk — use TradingView chart for market structure.",
      summary: [
        "This asset is routed through CoinGecko / CEX-style data.",
        "Prefer the TradingView lane for price action; pair this with your watchlist and wallet pulse for context.",
      ],
      market: {
        priceLabel: "—",
        mcapLabel: "—",
        mcapKind: "Market cap",
        change24hLabel: "—",
        volumeLabel: "—",
        liquidityLabel: "—",
        depthLabel: null,
      },
      risk: { level: "unknown", notes: ["CEX majors — risk is market/volatility, not honeypot style."] },
      social: { websites: [], twitter: null, telegram: null, discord: null, description: null },
      holders: { countLabel: "—", top10Label: "—" },
      whyHere: input.whyHere ?? null,
      sources: ["CoinGecko", "TradingView"],
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
  if (merged.volume24hUsd != null && merged.liquidityUsd != null) {
    summary.push(
      `24h volume ${money(merged.volume24hUsd)} against ${money(merged.liquidityUsd)} liquidity.`,
    );
  }
  if (mcap.value != null) {
    summary.push(`${mcap.label} prints around ${money(mcap.value)}.`);
  }
  if (info?.socials.twitter || info?.socials.telegram || (info?.socials.websites?.length ?? 0) > 0) {
    summary.push("Public social / web links are available — check them before sizing any idea.");
  } else {
    summary.push("Little verified social presence in feeds — treat narrative claims carefully.");
  }
  if (summary.length < 2) {
    summary.push("Research surface is live; keep confirming pool, liquidity, and holder risk yourself.");
  }

  const headline =
    input.whyHere?.startsWith("Tracked")
      ? `${merged.symbol}: on your radar because a tracked wallet moved it`
      : `${merged.symbol}: live desk brief from market + on-chain feeds`;

  return {
    symbol: merged.symbol,
    name: merged.name,
    network: merged.network,
    address: merged.address,
    headline,
    summary: summary.slice(0, 5),
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
    risk,
    social: {
      websites: info?.socials.websites ?? [],
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
    },
    whyHere: input.whyHere ?? null,
    sources,
    generatedAt: new Date().toISOString(),
  };
}
