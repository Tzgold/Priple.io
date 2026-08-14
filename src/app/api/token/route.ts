import { NextResponse } from "next/server";
import {
  fetchPoolOhlcv,
  fetchPoolTrades,
  fetchTokenDesk,
  looksLikeAddress,
  searchTokens,
} from "@/lib/geckoterminal";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const network = url.searchParams.get("network");
  const address = url.searchParams.get("address");
  const query = url.searchParams.get("query");

  try {
    if (query && !network) {
      const hits = await searchTokens(query);
      if (hits.length === 0) {
        return NextResponse.json({ error: "Token not found", hits: [] }, { status: 404 });
      }
      return NextResponse.json({ hits, hit: hits[0] });
    }

    if (!network || !address) {
      return NextResponse.json(
        { error: "network and address are required (or query)" },
        { status: 400 },
      );
    }

    const desk = await fetchTokenDesk(network, address);
    if (!desk) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    let candles: Awaited<ReturnType<typeof fetchPoolOhlcv>> = [];
    let trades: Awaited<ReturnType<typeof fetchPoolTrades>> = [];

    if (desk.poolAddress) {
      const timeframe =
        (url.searchParams.get("timeframe") as "minute" | "hour" | "day") || "minute";
      const aggregate = Number(url.searchParams.get("aggregate") || "1");
      const [ohlcv, tradeRows] = await Promise.all([
        fetchPoolOhlcv({
          network: desk.network,
          poolAddress: desk.poolAddress,
          timeframe,
          aggregate: Number.isFinite(aggregate) ? aggregate : 1,
          limit: timeframe === "minute" ? 1000 : undefined,
        }).catch(() => []),
        fetchPoolTrades(desk.network, desk.poolAddress).catch(() => []),
      ]);
      candles = ohlcv;
      trades = tradeRows;
    }

    return NextResponse.json({
      token: desk,
      candles,
      trades,
      resolvedByAddress: looksLikeAddress(address),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load token desk";
    const rateLimited = message.includes("429");
    return NextResponse.json(
      {
        error: rateLimited
          ? "Market data is busy — wait a second and try again"
          : message,
        rateLimited,
      },
      { status: rateLimited ? 429 : 502 },
    );
  }
}
