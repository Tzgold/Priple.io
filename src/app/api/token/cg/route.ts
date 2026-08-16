import { NextResponse } from "next/server";
import type { Candle } from "@/lib/geckoterminal";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

type CgMarketChart = {
  prices?: Array<[number, number]>;
};

function formatMoney(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toPrecision(3)}`;
}

/** CoinGecko fallback desk for assets without a clean DEX route (BTC, XRP, …). */
export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "market:token", 40);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const key = process.env.COINGECKO_API_KEY;
  const headers = key ? { "x-cg-demo-api-key": key } : undefined;

  try {
    const [coinRes, chartRes] = await Promise.all([
      fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false`, {
        headers,
        next: { revalidate: 60 },
      }),
      fetch(
        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=7`,
        { headers, next: { revalidate: 60 } },
      ),
    ]);

    if (!coinRes.ok) {
      return NextResponse.json({ error: "Coin not found" }, { status: 404 });
    }

    const coin = (await coinRes.json()) as {
      id: string;
      symbol: string;
      name: string;
      image?: { small?: string; large?: string };
      links?: {
        homepage?: string[];
        twitter_screen_name?: string;
        telegram_channel_identifier?: string;
        official_forum_url?: string[];
        chat_url?: string[];
      };
      market_data?: {
        current_price?: { usd?: number };
        market_cap?: { usd?: number };
        total_volume?: { usd?: number };
        price_change_percentage_24h?: number;
      };
    };

    const chart = chartRes.ok ? ((await chartRes.json()) as CgMarketChart) : { prices: [] };
    const prices = chart.prices ?? [];
    const candles: Candle[] = [];

    // Build pseudo-candles from price points (close-based) for Lightweight Charts.
    for (let i = 0; i < prices.length; i += 1) {
      const [ms, close] = prices[i];
      const prev = prices[i - 1]?.[1] ?? close;
      const open = prev;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      candles.push({
        time: Math.floor(ms / 1000),
        open,
        high,
        low,
        close,
        volume: 0,
      });
    }

    const price = coin.market_data?.current_price?.usd ?? null;
    const change = coin.market_data?.price_change_percentage_24h ?? null;

    return NextResponse.json({
      token: {
        network: "coingecko",
        address: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        imageUrl: coin.image?.large ?? coin.image?.small ?? null,
        priceUsd: price,
        marketCapUsd: coin.market_data?.market_cap?.usd ?? null,
        fdvUsd: null,
        volume24hUsd: coin.market_data?.total_volume?.usd ?? null,
        liquidityUsd: null,
        decimals: null,
        supply: null,
        coingeckoId: coin.id,
        poolAddress: null,
        poolName: null,
        priceChange24h: change,
        priceLabel: formatMoney(price),
        marketCapLabel: formatMoney(coin.market_data?.market_cap?.usd ?? null),
        volumeLabel: formatMoney(coin.market_data?.total_volume?.usd ?? null),
        socials: {
          websites: (coin.links?.homepage || []).filter(Boolean),
          twitter: coin.links?.twitter_screen_name || null,
          telegram: coin.links?.telegram_channel_identifier || null,
          discord: (coin.links?.chat_url || []).find((u) => u.includes("discord")) || null,
        },
      },
      candles,
      trades: [],
      source: "coingecko",
    });
  } catch {
    return NextResponse.json({ error: "Failed to load coin" }, { status: 502 });
  }
}
