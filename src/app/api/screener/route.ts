import { NextResponse } from "next/server";
import { fetchScreenerTokens } from "@/lib/coingecko";
import { fetchTrendingBoard } from "@/lib/geckoterminal";
import { scoreFromMarketSnapshot } from "@/lib/opportunity-score";
import { MAJOR_TOKEN_ROUTES, type BoardToken } from "@/lib/token-routes";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

function withOpportunityScore(row: BoardToken, tokenScore?: number | null): BoardToken {
  if (tokenScore != null) {
    return { ...row, score: tokenScore };
  }
  return {
    ...row,
    score: scoreFromMarketSnapshot({
      change24h: row.change24h,
      volume24hUsd: row.volume24hUsd,
      liquidityUsd: row.liquidityUsd,
      marketCapUsd: row.marketCapUsd,
      riskLevel:
        row.liquidityUsd != null && row.liquidityUsd < 25_000
          ? "medium"
          : row.liquidityUsd != null && row.liquidityUsd >= 250_000
            ? "low"
            : "unknown",
    }),
  };
}

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "market:screener", 20);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const [{ tokens, live }, trending] = await Promise.all([
    fetchScreenerTokens(),
    fetchTrendingBoard(["eth", "solana", "base"]).catch(() => [] as BoardToken[]),
  ]);

  const majors: BoardToken[] = tokens
    .map((token) => {
      const route = MAJOR_TOKEN_ROUTES[token.id];
      const base = !route || "cg" in route
        ? {
            id: `cg:${token.id}`,
            network: "coingecko",
            address: token.id,
            symbol: token.symbol,
            name: token.name,
            imageUrl: token.imageUrl,
            priceUsd: token.priceRaw || null,
            change24h: token.changeRaw || null,
            volume24hUsd: token.volumeRaw || null,
            liquidityUsd: null,
            marketCapUsd: token.marketCapRaw || null,
            fdvUsd: null,
            kind: "major" as const,
            poolName: null,
          }
        : {
            id: `${route.network}:${route.address.toLowerCase()}`,
            network: route.network,
            address: route.address,
            symbol: token.symbol,
            name: token.name,
            imageUrl: token.imageUrl,
            priceUsd: token.priceRaw || null,
            change24h: token.changeRaw || null,
            volume24hUsd: token.volumeRaw || null,
            liquidityUsd: null,
            marketCapUsd: token.marketCapRaw || null,
            fdvUsd: null,
            kind: "major" as const,
            poolName: null,
          };
      return withOpportunityScore(base, token.score);
    })
    .filter((row) => row.network !== "coingecko" || row.address === "bitcoin" || row.address === "ripple");

  const board = [
    ...majors,
    ...trending
      .filter((row) => !majors.some((m) => m.id === row.id))
      .map((row) => withOpportunityScore(row)),
  ].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return NextResponse.json({
    tokens,
    board,
    live,
    updatedAt: new Date().toISOString(),
  });
}
