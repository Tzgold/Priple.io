import { NextResponse } from "next/server";
import { fetchCoinIntel } from "@/lib/coin-intel";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

function clip(value: string | null, max: number) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "market:intel", 20);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const url = new URL(request.url);
  const network = clip(url.searchParams.get("network"), 32);
  const address = clip(url.searchParams.get("address"), 64);
  const symbol = clip(url.searchParams.get("symbol"), 24);
  const coingeckoId = clip(url.searchParams.get("cg"), 80);
  const hasSocialLinks = url.searchParams.get("social") === "1";

  if (!network && !address && !symbol && !coingeckoId) {
    return NextResponse.json({ error: "symbol or token id is required" }, { status: 400 });
  }

  try {
    const intel = await fetchCoinIntel({
      network,
      address,
      coingeckoId,
      symbol,
      hasSocialLinks,
    });
    return NextResponse.json({ intel });
  } catch {
    return NextResponse.json({ error: "Could not load social/news feeds" }, { status: 502 });
  }
}
