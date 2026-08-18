import { NextResponse } from "next/server";
import { fetchCoinIntel } from "@/lib/coin-intel";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

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
  const network = url.searchParams.get("network") || undefined;
  const address = url.searchParams.get("address") || undefined;
  const symbol = url.searchParams.get("symbol") || undefined;
  const coingeckoId = url.searchParams.get("cg") || undefined;
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intel failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
