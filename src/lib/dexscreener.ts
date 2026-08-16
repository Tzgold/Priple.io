/** DexScreener helpers — public API, no API key. */

import { normalizeNetwork } from "@/lib/geckoterminal";

const GT_TO_DS: Record<string, string> = {
  eth: "ethereum",
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum",
  bsc: "bsc",
  optimism: "optimism",
  polygon: "polygon",
  solana: "solana",
  avalanche: "avalanche",
  fantom: "fantom",
};

export function toDexScreenerChain(network: string): string | null {
  const net = normalizeNetwork(network);
  return GT_TO_DS[net] ?? GT_TO_DS[network.trim().toLowerCase()] ?? null;
}

/** Dark embed chart (pair preferred; token address also works). */
export function dexScreenerEmbedUrl(network: string, pairOrTokenAddress: string): string | null {
  const chain = toDexScreenerChain(network);
  if (!chain || !pairOrTokenAddress) return null;
  const params = new URLSearchParams({
    embed: "1",
    theme: "dark",
    trades: "0",
    info: "0",
  });
  return `https://dexscreener.com/${chain}/${pairOrTokenAddress}?${params.toString()}`;
}

export function dexScreenerPairPageUrl(network: string, pairOrTokenAddress: string): string | null {
  const chain = toDexScreenerChain(network);
  if (!chain || !pairOrTokenAddress) return null;
  return `https://dexscreener.com/${chain}/${pairOrTokenAddress}`;
}

export type DexScreenerSocials = {
  websites: string[];
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
};

export type DexScreenerEnrichment = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  priceChange24h: number | null;
  pairAddress: string | null;
  pairUrl: string | null;
  imageUrl: string | null;
  socials: DexScreenerSocials;
  pools: DexPoolOption[];
  source: "dexscreener";
};

export type DexPoolOption = {
  pairAddress: string;
  pairUrl: string | null;
  dexId: string | null;
  quoteSymbol: string | null;
  label: string;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  priceUsd: number | null;
  priceChange24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  chainId: string | null;
};

type DsPair = {
  chainId?: string;
  pairAddress?: string;
  url?: string;
  dexId?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  info?: {
    imageUrl?: string;
    websites?: Array<{ url?: string } | string>;
    socials?: Array<{ type?: string; platform?: string; url?: string; handle?: string }>;
  };
};

function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseSocials(info: DsPair["info"]): DexScreenerSocials {
  const websites: string[] = [];
  let twitter: string | null = null;
  let telegram: string | null = null;
  let discord: string | null = null;

  for (const site of info?.websites || []) {
    const url = typeof site === "string" ? site : site?.url;
    if (url) websites.push(url);
  }

  for (const social of info?.socials || []) {
    const kind = (social.type || social.platform || "").toLowerCase();
    const raw = social.url || social.handle || "";
    if (!raw) continue;
    if (kind.includes("twitter") || kind === "x") {
      twitter = raw.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "").replace(/^@/, "");
    } else if (kind.includes("telegram")) {
      telegram = raw.replace(/^https?:\/\/(www\.)?t\.me\//i, "").replace(/^@/, "");
    } else if (kind.includes("discord")) {
      discord = raw.startsWith("http") ? raw : `https://discord.gg/${raw}`;
    }
  }

  return { websites, twitter, telegram, discord };
}

/** Best pair for a token address (public DexScreener API). */
export async function fetchDexScreenerEnrichment(
  tokenAddress: string,
  preferredNetwork?: string,
): Promise<DexScreenerEnrichment | null> {
  const addr = tokenAddress.trim();
  if (!addr || addr.length < 8) return null;

  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(addr)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { pairs?: DsPair[] | null };
  const pairs = (json.pairs || []).filter(Boolean);
  if (pairs.length === 0) return null;

  const preferred = preferredNetwork ? toDexScreenerChain(preferredNetwork) : null;
  const ranked = [...pairs].sort((a, b) => {
    const chainScore = (p: DsPair) =>
      preferred && p.chainId === preferred ? 1_000_000_000 : 0;
    const liq = (p: DsPair) => p.liquidity?.usd ?? 0;
    return chainScore(b) + liq(b) - (chainScore(a) + liq(a));
  });

  const best = ranked[0];
  const pools: DexPoolOption[] = ranked.slice(0, 8).map((pair) => {
    const base = (pair.baseToken?.symbol || "?").toUpperCase();
    const quote = (pair.quoteToken?.symbol || "").toUpperCase() || null;
    const dex = pair.dexId || "dex";
    return {
      pairAddress: pair.pairAddress || "",
      pairUrl: pair.url || null,
      dexId: pair.dexId || null,
      quoteSymbol: quote,
      label: `${base}/${quote || "?"} · ${dex}${pair.liquidity?.usd != null ? ` · $${Math.round(pair.liquidity.usd).toLocaleString("en-US")}` : ""}`,
      liquidityUsd: num(pair.liquidity?.usd),
      volume24hUsd: num(pair.volume?.h24),
      priceUsd: num(pair.priceUsd),
      priceChange24h: num(pair.priceChange?.h24),
      marketCapUsd: num(pair.marketCap),
      fdvUsd: num(pair.fdv),
      chainId: pair.chainId || null,
    };
  }).filter((p) => p.pairAddress);

  return {
    priceUsd: num(best.priceUsd),
    marketCapUsd: num(best.marketCap),
    fdvUsd: num(best.fdv),
    volume24hUsd: num(best.volume?.h24),
    liquidityUsd: num(best.liquidity?.usd),
    priceChange24h: num(best.priceChange?.h24),
    pairAddress: best.pairAddress || null,
    pairUrl: best.url || null,
    imageUrl: best.info?.imageUrl || null,
    socials: parseSocials(best.info),
    pools,
    source: "dexscreener",
  };
}

export type DexSearchHit = {
  network: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  pairLabel: string;
  pairAddress: string | null;
  dexId: string | null;
  quoteSymbol: string | null;
  priceUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  priceChange24h: number | null;
};

type DsSearchPair = DsPair & {
  dexId?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
};

const DS_CHAIN_TO_GT: Record<string, string> = {
  ethereum: "eth",
  base: "base",
  arbitrum: "arbitrum",
  bsc: "bsc",
  optimism: "optimism",
  polygon: "polygon",
  solana: "solana",
  avalanche: "avalanche",
  fantom: "fantom",
};

/** Free-text pair/token search via DexScreener (richer than GT alone). */
export async function searchDexScreener(query: string): Promise<DexSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];

  const json = (await res.json()) as { pairs?: DsSearchPair[] | null };
  const pairs = (json.pairs || []).filter(Boolean);
  if (pairs.length === 0) return [];

  const ranked = [...pairs].sort(
    (a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0),
  );

  const hits: DexSearchHit[] = [];
  const seen = new Set<string>();

  for (const pair of ranked) {
    const chain = pair.chainId || "";
    const network = DS_CHAIN_TO_GT[chain] || chain;
    if (!network) continue;
    const base = pair.baseToken;
    const address = (base?.address || "").trim();
    if (!address) continue;
    const key = `${network}:${address.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const symbol = (base?.symbol || "???").toUpperCase();
    const quote = (pair.quoteToken?.symbol || "").toUpperCase() || null;
    hits.push({
      network,
      address,
      name: base?.name || symbol,
      symbol,
      imageUrl: pair.info?.imageUrl || null,
      pairLabel: quote ? `${symbol} / ${quote}` : `${symbol} / ${network.toUpperCase()}`,
      pairAddress: pair.pairAddress || null,
      dexId: pair.dexId || null,
      quoteSymbol: quote,
      priceUsd: num(pair.priceUsd),
      volume24hUsd: num(pair.volume?.h24),
      liquidityUsd: num(pair.liquidity?.usd),
      priceChange24h: num(pair.priceChange?.h24),
    });
    if (hits.length >= 20) break;
  }

  return hits;
}
