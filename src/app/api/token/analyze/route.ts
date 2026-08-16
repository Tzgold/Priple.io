import { NextResponse } from "next/server";
import { buildCoinAnalysis } from "@/lib/coin-analysis";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "market:analyze", 15);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const url = new URL(request.url);
  const network = url.searchParams.get("network");
  const address = url.searchParams.get("address");
  const whyHere = url.searchParams.get("why") || null;

  if (!network || !address) {
    return NextResponse.json({ error: "network and address are required" }, { status: 400 });
  }

  try {
    const analysis = await buildCoinAnalysis({ network, address, whyHere });
    if (!analysis) {
      return NextResponse.json({ error: "Could not build analysis" }, { status: 404 });
    }
    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
