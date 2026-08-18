import type { PulseItem } from "@/lib/alchemy-pulse";
import type { ScreenerListCoin } from "@/components/app/ScreenerTokenColumn";
import type { BoardToken } from "@/lib/token-routes";
import { MAJOR_TOKEN_ROUTES, SYMBOL_TO_CG } from "@/lib/token-routes";
import type { WatchedToken } from "@/lib/watched-tokens";

export function boardToListCoin(row: BoardToken, meta?: string): ScreenerListCoin {
  return {
    id: row.id,
    network: row.network,
    address: row.address,
    symbol: row.symbol,
    name: row.name,
    imageUrl: row.imageUrl,
    change24h: row.change24h,
    score: row.score ?? null,
    priceUsd: row.priceUsd,
    marketCapUsd: row.marketCapUsd,
    meta: meta ?? row.poolName ?? row.kind,
  };
}

export function resolvePulseBuy(item: PulseItem): { network: string; address: string } | null {
  if (item.tokenAddress) {
    return { network: item.network || "eth", address: item.tokenAddress };
  }

  const cg = SYMBOL_TO_CG[item.asset.toUpperCase()];
  if (!cg) return null;
  const route = MAJOR_TOKEN_ROUTES[cg];
  if (!route) return null;
  if ("cg" in route) return { network: "coingecko", address: route.cg };
  return { network: route.network, address: route.address };
}

export function buildScreenerLists(
  board: BoardToken[],
  pulseBuys: PulseItem[],
  watchedTokens: WatchedToken[],
) {
  const boardById = new Map(board.map((row) => [row.id, row]));

  const walletBuys: ScreenerListCoin[] = [];
  const seen = new Set<string>();
  for (const item of pulseBuys) {
    if (item.source === "demo") continue;
    const route = resolvePulseBuy(item);
    if (!route) continue;
    const id = `${route.network}:${route.address.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const fromBoard = boardById.get(id);
    walletBuys.push({
      id,
      network: route.network,
      address: route.address,
      symbol: item.asset,
      name: fromBoard?.name || item.asset,
      imageUrl: fromBoard?.imageUrl ?? null,
      meta: `${item.walletLabel} · ${item.usd}`,
      change24h: fromBoard?.change24h ?? null,
      score: fromBoard?.score ?? null,
      priceUsd: fromBoard?.priceUsd ?? null,
      marketCapUsd: fromBoard?.marketCapUsd ?? null,
      whyHere:
        item.source === "personal"
          ? `Tracked wallet “${item.walletLabel}” bought ${item.amount} ${item.asset} (${item.usd}) — ${item.date} ${item.time}.`
          : `Curated desk “${item.walletLabel}” bought ${item.amount} ${item.asset} (${item.usd}) — ${item.date} ${item.time}.`,
      walletAddress: item.walletAddress || null,
      walletLabel: item.walletLabel,
    });
    if (walletBuys.length >= 24) break;
  }

  const watchlist: ScreenerListCoin[] = watchedTokens.map((token) => {
    const fromBoard = boardById.get(token.id);
    return {
      id: token.id,
      network: token.network,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      imageUrl: token.imageUrl,
      meta: "Watchlist",
      change24h: fromBoard?.change24h ?? null,
      score: fromBoard?.score ?? null,
      priceUsd: fromBoard?.priceUsd ?? null,
      marketCapUsd: fromBoard?.marketCapUsd ?? null,
    };
  });

  const trending = board
    .filter((row) => row.kind === "trending")
    .slice(0, 40)
    .map((row) => boardToListCoin(row, row.poolName || "Trending"));

  const majors = board
    .filter((row) => row.kind === "major")
    .map((row) => boardToListCoin(row, "Major"));

  const topScore = [...board]
    .filter((row) => row.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 40)
    .map((row) => boardToListCoin(row, `Score ${row.score}`));

  return { boardById, walletBuys, watchlist, trending, majors, topScore };
}
