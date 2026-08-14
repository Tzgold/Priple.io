import {
  buildDepth,
  fetchOnchainTokenInfo,
  type OnchainTokenInfo,
  type TokenDepth,
} from "@/lib/token-info";
import { looksLikeAddress, type BoardToken } from "@/lib/token-routes";

export { looksLikeAddress, type BoardToken } from "@/lib/token-routes";

export const GT_NETWORKS = [
  "eth",
  "base",
  "arbitrum",
  "bsc",
  "solana",
  "polygon",
  "optimism",
] as const;

export type GtNetwork = (typeof GT_NETWORKS)[number];

export type TokenDesk = {
  network: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  decimals: number | null;
  supply: number | null;
  coingeckoId: string | null;
  poolAddress: string | null;
  poolName: string | null;
  priceChange24h: number | null;
  info: OnchainTokenInfo | null;
  depth: TokenDepth;
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TokenTrade = {
  id: string;
  kind: "buy" | "sell" | "unknown";
  priceUsd: number | null;
  amountUsd: number | null;
  txHash: string | null;
  timestamp: string | null;
  trader: string | null;
};

type Json = Record<string, unknown>;

const GT = "https://api.geckoterminal.com/api/v2";

type CacheEntry = { at: number; data: Json };
const gtCache = new Map<string, CacheEntry>();
const GT_CACHE_TTL_MS = 45_000;

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function gtGet(path: string, opts?: { noStore?: boolean; retries?: number }) {
  const cacheKey = path;
  if (!opts?.noStore) {
    const hit = gtCache.get(cacheKey);
    if (hit && Date.now() - hit.at < GT_CACHE_TTL_MS) {
      return hit.data;
    }
  }

  const retries = opts?.retries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(`${GT}${path}`, {
      headers: { Accept: "application/json" },
      ...(opts?.noStore
        ? { cache: "no-store" as const }
        : { next: { revalidate: 45 } }),
    });

    if (response.status === 429) {
      lastError = new Error("GeckoTerminal 429");
      await sleep(600 * (attempt + 1));
      continue;
    }

    if (!response.ok) {
      throw new Error(`GeckoTerminal ${response.status}`);
    }

    const data = (await response.json()) as Json;
    gtCache.set(cacheKey, { at: Date.now(), data });
    return data;
  }

  throw lastError || new Error("GeckoTerminal 429");
}

export function normalizeNetwork(input: string): string {
  const value = input.trim().toLowerCase();
  if (value === "ethereum" || value === "eth") return "eth";
  if (value === "arb") return "arbitrum";
  if (value === "bnb" || value === "bsc") return "bsc";
  if (value === "sol") return "solana";
  if (value === "matic" || value === "polygon") return "polygon";
  if (value === "op" || value === "optimism") return "optimism";
  if (value === "sui-network" || value === "sui") return "sui-network";
  return value;
}

export async function fetchTokenDesk(
  network: string,
  address: string,
): Promise<TokenDesk | null> {
  const net = normalizeNetwork(network);
  const addr = address.trim();

  const tokenJson = await gtGet(`/networks/${net}/tokens/${encodeURIComponent(addr)}`);
  const data = tokenJson.data as Json | undefined;
  if (!data) return null;
  const attrs = (data.attributes || {}) as Json;
  const relationships = (data.relationships || {}) as Json;
  const topPools =
    ((relationships.top_pools as Json | undefined)?.data as Json[] | undefined) ?? [];
  const firstPoolId = typeof topPools[0]?.id === "string" ? topPools[0].id : null;
  const poolAddress = firstPoolId?.includes("_")
    ? firstPoolId.slice(firstPoolId.indexOf("_") + 1)
    : firstPoolId;

  let poolName: string | null = null;
  let priceChange24h: number | null = null;
  let liquidityUsd = num(attrs.total_reserve_in_usd);

  if (poolAddress) {
    try {
      const poolJson = await gtGet(`/networks/${net}/pools/${encodeURIComponent(poolAddress)}`);
      const poolAttrs = ((poolJson.data as Json | undefined)?.attributes || {}) as Json;
      poolName = typeof poolAttrs.name === "string" ? poolAttrs.name : null;
      const changes = (poolAttrs.price_change_percentage || {}) as Json;
      priceChange24h = num(changes.h24);
      liquidityUsd = num(poolAttrs.reserve_in_usd) ?? liquidityUsd;
    } catch {
      // Token still useful without pool enrichment.
    }
  }

  const volume = attrs.volume_usd as Json | undefined;

  const info = await fetchOnchainTokenInfo(net, String(attrs.address || addr)).catch(() => null);

  const volume24hUsd = num(volume?.h24);
  const marketCapUsd = num(attrs.market_cap_usd);
  const fdvUsd = num(attrs.fdv_usd);
  const decimals = num(attrs.decimals);
  const rawSupply = num(attrs.normalized_total_supply);
  const totalSupply = num(attrs.total_supply);
  // Prefer normalized supply; fall back to raw total_supply / 10^decimals.
  let supply = rawSupply;
  if ((supply == null || supply <= 0) && totalSupply != null && totalSupply > 0) {
    supply =
      decimals != null && decimals >= 0 ? totalSupply / 10 ** decimals : totalSupply;
  }
  const priceUsd = num(attrs.price_usd);
  const resolvedMcap =
    marketCapUsd ??
    fdvUsd ??
    (priceUsd != null && supply != null && supply > 0 ? priceUsd * supply : null);

  return {
    network: net,
    address: String(attrs.address || addr),
    name: String(attrs.name || "Unknown"),
    symbol: String(attrs.symbol || "???").toUpperCase(),
    imageUrl: info?.imageUrl || (typeof attrs.image_url === "string" ? attrs.image_url : null),
    priceUsd,
    marketCapUsd, // raw reported mcap only — UI falls back via estimateMarketCap
    fdvUsd,
    volume24hUsd,
    liquidityUsd,
    decimals,
    supply,
    coingeckoId:
      info?.coingeckoId ||
      (typeof attrs.coingecko_coin_id === "string" ? attrs.coingecko_coin_id : null),
    poolAddress,
    poolName,
    priceChange24h,
    info,
    depth: buildDepth({
      liquidityUsd,
      volume24hUsd,
      fdvUsd,
      marketCapUsd: resolvedMcap,
    }),
  };
}

export async function fetchPoolOhlcv(input: {
  network: string;
  poolAddress: string;
  timeframe?: "minute" | "hour" | "day";
  aggregate?: number;
  limit?: number;
}): Promise<Candle[]> {
  const net = normalizeNetwork(input.network);
  const timeframe = input.timeframe ?? "minute";
  const aggregate = input.aggregate ?? 15;
  const limit =
    input.limit ??
    (timeframe === "day" ? 180 : timeframe === "hour" ? 336 : 1000);
  const path =
    `/networks/${net}/pools/${encodeURIComponent(input.poolAddress)}/ohlcv/${timeframe}` +
    `?aggregate=${aggregate}&limit=${limit}&currency=usd`;

  const json = await gtGet(path, { noStore: false, retries: 3 });
  const list =
    (((json.data as Json | undefined)?.attributes as Json | undefined)?.ohlcv_list as
      | unknown[]
      | undefined) ?? [];

  const candles: Candle[] = [];
  for (const row of list) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const [time, open, high, low, close, volume] = row.map((v) => Number(v));
    if (![time, open, high, low, close].every(Number.isFinite)) continue;
    candles.push({ time, open, high, low, close, volume: volume || 0 });
  }

  return normalizeCandles(candles);
}

function normalizeCandles(candles: Candle[]): Candle[] {
  const byTime = new Map<number, Candle>();
  for (const candle of candles) {
    if (!Number.isFinite(candle.time)) continue;
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

export async function fetchPoolTrades(
  network: string,
  poolAddress: string,
  limit = 40,
): Promise<TokenTrade[]> {
  const net = normalizeNetwork(network);
  const json = await gtGet(
    `/networks/${net}/pools/${encodeURIComponent(poolAddress)}/trades?trade_volume_in_usd_greater_than=1`,
  );
  const rows = (json.data as Json[] | undefined) ?? [];

  return rows.slice(0, limit).map((row, index) => {
    const attrs = (row.attributes || {}) as Json;
    const kindRaw = String(attrs.kind || "").toLowerCase();
    const kind: TokenTrade["kind"] = kindRaw.includes("buy")
      ? "buy"
      : kindRaw.includes("sell")
        ? "sell"
        : "unknown";
    return {
      id: String(row.id || `${poolAddress}-${index}`),
      kind,
      priceUsd: num(attrs.price_to_in_usd) ?? num(attrs.price_from_in_usd),
      amountUsd: num(attrs.volume_in_usd),
      txHash: typeof attrs.tx_hash === "string" ? attrs.tx_hash : null,
      timestamp: typeof attrs.block_timestamp === "string" ? attrs.block_timestamp : null,
      trader: typeof attrs.tx_from_address === "string" ? attrs.tx_from_address : null,
    };
  });
}

export type TokenSearchHit = {
  network: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  source: "dex" | "coingecko";
  pairLabel?: string | null;
};

async function searchCoinGecko(query: string): Promise<TokenSearchHit[]> {
  const key = process.env.COINGECKO_API_KEY;
  const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: key ? { "x-cg-demo-api-key": key } : undefined,
      cache: "no-store",
    });
    if (!response.ok) return [];
    const json = (await response.json()) as {
      coins?: Array<{ id: string; name: string; symbol: string; large?: string; thumb?: string }>;
    };
    return (json.coins || []).slice(0, 8).map((coin) => ({
      network: "coingecko",
      address: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      imageUrl: coin.large || coin.thumb || null,
      source: "coingecko" as const,
      pairLabel: `${coin.symbol.toUpperCase()} / USD`,
    }));
  } catch {
    return [];
  }
}

export async function searchTokens(query: string): Promise<TokenSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const hits: TokenSearchHit[] = [];
  const seen = new Set<string>();

  const push = (hit: TokenSearchHit) => {
    const key = `${hit.network}:${hit.address.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(hit);
  };

  if (looksLikeAddress(q)) {
    const networks = q.startsWith("0x")
      ? (["eth", "base", "arbitrum", "bsc", "optimism", "polygon"] as const)
      : (["solana"] as const);

    for (const network of networks) {
      try {
        const desk = await fetchTokenDesk(network, q);
        if (desk?.symbol) {
          push({
            network: desk.network,
            address: desk.address,
            name: desk.name,
            symbol: desk.symbol,
            imageUrl: desk.imageUrl,
            source: "dex",
            pairLabel: desk.poolName || `${desk.symbol} / ${desk.network.toUpperCase()}`,
          });
          break;
        }
      } catch {
        // try next
      }
    }
  }

  const [cgHits, gtJson] = await Promise.all([
    searchCoinGecko(q),
    gtGet(
      `/search/pools?query=${encodeURIComponent(q)}&page=1&include=base_token`,
      { noStore: true },
    ).catch(() => null),
  ]);

  for (const hit of cgHits) push(hit);

  const pools = (gtJson?.data as Json[] | undefined) ?? [];
  const included = (gtJson?.included as Json[] | undefined) ?? [];

  for (const pool of pools.slice(0, 15)) {
    const id = String(pool.id || "");
    const network = id.includes("_") ? id.slice(0, id.indexOf("_")) : "eth";
    // Prefer chains we can chart well; still allow others.
    const baseRel = ((pool.relationships as Json | undefined)?.base_token as Json | undefined)
      ?.data as Json | undefined;
    const baseId = typeof baseRel?.id === "string" ? baseRel.id : null;
    const base = included.find((item) => item.id === baseId);
    const tokenAttrs = (base?.attributes || {}) as Json;
    const address = typeof tokenAttrs.address === "string" ? tokenAttrs.address : null;
    if (!address) continue;

    const poolAttrs = (pool.attributes || {}) as Json;
    push({
      network,
      address,
      name: String(tokenAttrs.name || "Token"),
      symbol: String(tokenAttrs.symbol || "???").toUpperCase(),
      imageUrl: typeof tokenAttrs.image_url === "string" ? tokenAttrs.image_url : null,
      source: "dex",
      pairLabel:
        typeof poolAttrs.name === "string"
          ? poolAttrs.name
          : `${String(tokenAttrs.symbol || "???").toUpperCase()} / ${network.toUpperCase()}`,
    });
  }

  return hits.slice(0, 12);
}

/** @deprecated use searchTokens */
export async function searchTokenByQuery(query: string) {
  const hits = await searchTokens(query);
  return hits[0] ?? null;
}

function moneyNum(value: unknown) {
  return num(value);
}

export async function fetchTrendingBoard(networks: string[] = ["eth", "solana", "base"]) {
  const rows: BoardToken[] = [];
  const seen = new Set<string>();

  for (const network of networks) {
    try {
      const json = await gtGet(
        `/networks/${network}/trending_pools?page=1&include=base_token%2Cquote_token`,
      );
      const pools = (json.data as Json[] | undefined) ?? [];
      const included = (json.included as Json[] | undefined) ?? [];

      for (const pool of pools) {
        const attrs = (pool.attributes || {}) as Json;
        const baseRel = ((pool.relationships as Json | undefined)?.base_token as Json | undefined)
          ?.data as Json | undefined;
        const baseId = typeof baseRel?.id === "string" ? baseRel.id : null;
        const base = included.find((item) => item.id === baseId);
        const tokenAttrs = (base?.attributes || {}) as Json;
        const address = typeof tokenAttrs.address === "string" ? tokenAttrs.address : null;
        if (!address) continue;

        const key = `${network}:${address.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const changes = (attrs.price_change_percentage || {}) as Json;
        rows.push({
          id: key,
          network,
          address,
          symbol: String(tokenAttrs.symbol || "???").toUpperCase(),
          name: String(tokenAttrs.name || attrs.name || "Token"),
          imageUrl: typeof tokenAttrs.image_url === "string" ? tokenAttrs.image_url : null,
          priceUsd: moneyNum(attrs.base_token_price_usd),
          change24h: moneyNum(changes.h24),
          volume24hUsd: moneyNum((attrs.volume_usd as Json | undefined)?.h24),
          liquidityUsd: moneyNum(attrs.reserve_in_usd),
          marketCapUsd:
            moneyNum(attrs.market_cap_usd) ??
            moneyNum(attrs.fdv_usd) ??
            (() => {
              const price = moneyNum(attrs.base_token_price_usd);
              const supply =
                moneyNum(tokenAttrs.normalized_total_supply) ??
                moneyNum(tokenAttrs.total_supply);
              return price != null && supply != null && supply > 0 ? price * supply : null;
            })(),
          fdvUsd: moneyNum(attrs.fdv_usd),
          kind: "trending",
          poolName: typeof attrs.name === "string" ? attrs.name : null,
        });
      }
    } catch {
      // skip network
    }
  }

  return rows;
}
