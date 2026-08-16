import { NextResponse } from "next/server";
import { fetchPoolOhlcv } from "@/lib/geckoterminal";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "market:token", 40);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const url = new URL(request.url);
  const network = url.searchParams.get("network");
  const poolAddress = url.searchParams.get("pool");
  const timeframe =
    (url.searchParams.get("timeframe") as "minute" | "hour" | "day") || "minute";
  const aggregate = Number(url.searchParams.get("aggregate") || "15");

  if (!network || !poolAddress) {
    return NextResponse.json({ error: "network and pool are required" }, { status: 400 });
  }

  try {
    const candles = await fetchPoolOhlcv({
      network,
      poolAddress,
      timeframe,
      aggregate: Number.isFinite(aggregate) ? aggregate : 15,
    });
    return NextResponse.json({ candles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load candles";
    const rateLimited = message.includes("429");
    return NextResponse.json(
      {
        candles: [],
        error: rateLimited
          ? "Market data is busy — wait a second and try again"
          : message,
        rateLimited,
      },
      { status: rateLimited ? 429 : 502 },
    );
  }
}
