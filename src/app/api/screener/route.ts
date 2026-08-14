import { NextResponse } from "next/server";
import { fetchScreenerTokens } from "@/lib/coingecko";
import { fetchTrendingBoard } from "@/lib/geckoterminal";
import { MAJOR_TOKEN_ROUTES, type BoardToken } from "@/lib/token-routes";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ tokens, live }, trending] = await Promise.all([
    fetchScreenerTokens(),
    fetchTrendingBoard(["eth", "solana", "base"]).catch(() => [] as BoardToken[]),
  ]);

  const majors: BoardToken[] = tokens
    .map((token) => {
      const route = MAJOR_TOKEN_ROUTES[token.id];
      if (!route || "cg" in route) {
        return {
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
        };
      }
      return {
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
    })
    .filter((row) => row.network !== "coingecko" || row.address === "bitcoin" || row.address === "ripple");

  const board = [...majors, ...trending.filter((row) => !majors.some((m) => m.id === row.id))];

  return NextResponse.json({
    tokens,
    board,
    live,
    updatedAt: new Date().toISOString(),
  });
}
