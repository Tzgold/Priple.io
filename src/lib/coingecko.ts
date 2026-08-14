import { mockTokens } from "@/lib/mock/data";

export type ScreenerToken = {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  volume: string;
  score: number;
  positive: boolean;
  priceRaw: number;
  changeRaw: number;
  volumeRaw: number;
  marketCapRaw: number;
  rank: number | null;
  live: boolean;
  imageUrl: string | null;
};

type CoinGeckoMarket = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
};

const DEFAULT_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "solana",
  "chainlink",
  "ripple",
  "arbitrum",
  "optimism",
  "binancecoin",
  "usd-coin",
].join(",");

function formatPrice(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1000) {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(3)}`;
}

function formatChange(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatVolume(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/** Lightweight Opportunity Score until we wire multi-factor research. */
export function opportunityScore(input: {
  change24h: number | null;
  volume: number | null;
  marketCap: number | null;
}) {
  const change = input.change24h ?? 0;
  const volume = Math.max(input.volume ?? 0, 1);
  const mcap = Math.max(input.marketCap ?? 0, 1);
  const momentum = Math.max(-20, Math.min(25, change * 1.4));
  const liquidity = Math.min(20, Math.log10(volume) * 2.2);
  const size = Math.min(15, Math.log10(mcap) * 1.4);
  return Math.round(Math.max(5, Math.min(98, 42 + momentum + liquidity + size)));
}

function mapMarket(coin: CoinGeckoMarket): ScreenerToken {
  const change = coin.price_change_percentage_24h;
  const score = opportunityScore({
    change24h: change,
    volume: coin.total_volume,
    marketCap: coin.market_cap,
  });

  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: formatPrice(coin.current_price),
    change24h: formatChange(change),
    volume: formatVolume(coin.total_volume),
    score,
    positive: (change ?? 0) >= 0,
    priceRaw: coin.current_price ?? 0,
    changeRaw: change ?? 0,
    volumeRaw: coin.total_volume ?? 0,
    marketCapRaw: coin.market_cap ?? 0,
    rank: coin.market_cap_rank,
    live: true,
    imageUrl: coin.image ?? null,
  };
}

function mockAsScreener(): ScreenerToken[] {
  return mockTokens.map((token, index) => ({
    id: token.symbol.toLowerCase(),
    symbol: token.symbol,
    name: token.name,
    price: token.price,
    change24h: token.change24h,
    volume: token.volume,
    score: token.score,
    positive: token.positive,
    priceRaw: 0,
    changeRaw: parseFloat(token.change24h) || 0,
    volumeRaw: 0,
    marketCapRaw: 0,
    rank: index + 1,
    live: false,
    imageUrl: null,
  }));
}

export async function fetchScreenerTokens(): Promise<{
  tokens: ScreenerToken[];
  live: boolean;
}> {
  const key = process.env.COINGECKO_API_KEY;
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", DEFAULT_IDS);
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  try {
    const response = await fetch(url.toString(), {
      headers: key ? { "x-cg-demo-api-key": key } : undefined,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { tokens: mockAsScreener(), live: false };
    }

    const data = (await response.json()) as CoinGeckoMarket[];
    if (!Array.isArray(data) || data.length === 0) {
      return { tokens: mockAsScreener(), live: false };
    }

    const tokens = data.map(mapMarket).sort((a, b) => b.score - a.score);
    return { tokens, live: true };
  } catch {
    return { tokens: mockAsScreener(), live: false };
  }
}
