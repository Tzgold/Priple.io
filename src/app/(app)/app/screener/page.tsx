"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/DashboardShell";
import { CoinAnalysisPanel } from "@/components/app/CoinAnalysisPanel";
import { FlowsPanel } from "@/components/app/FlowsPanel";
import { PairSearchBox, type PairHit } from "@/components/app/PairSearchBox";
import { ScreenerRails, type RailCoin } from "@/components/app/ScreenerRails";
import { TokenDeskView } from "@/components/app/TokenDeskView";
import { useDesk } from "@/lib/app-store";
import type { PulseItem } from "@/lib/alchemy-pulse";
import type { BoardToken } from "@/lib/token-routes";
import { MAJOR_TOKEN_ROUTES, SYMBOL_TO_CG } from "@/lib/token-routes";

function ScreenerBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const network = searchParams.get("network");
  const address = searchParams.get("address");
  const whyParam = searchParams.get("why");
  const trackWallet = searchParams.get("wallet");
  const trackWalletLabel = searchParams.get("wl");
  const trackFocusRaw = searchParams.get("at");
  const trackFocusTime = trackFocusRaw ? Number(trackFocusRaw) : null;
  const trackSideRaw = searchParams.get("side");
  const trackSide = trackSideRaw === "buy" || trackSideRaw === "sell" ? trackSideRaw : null;

  const { watchedTokens, ready } = useDesk();
  const [board, setBoard] = useState<BoardToken[]>([]);
  const [pulseBuys, setPulseBuys] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [railsCollapsed, setRailsCollapsed] = useState(Boolean(network && address));

  useEffect(() => {
    // When a coin is selected, collapse rails so desk + analysis lead.
    if (network && address) setRailsCollapsed(true);
  }, [network, address]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [screenerRes, pulseRes] = await Promise.all([
          fetch("/api/screener", { credentials: "include" }),
          fetch("/api/pulse", { credentials: "include" }),
        ]);

        if (cancelled) return;

        if (screenerRes.ok) {
          const data = (await screenerRes.json()) as { board?: BoardToken[] };
          const rows = data.board ?? [];
          setBoard(rows);

          if (!searchParams.get("network") && !searchParams.get("address") && rows[0]) {
            const first =
              rows.find((row) => row.kind === "trending") ||
              rows.find((row) => row.kind === "major") ||
              rows[0];
            router.replace(
              `/app/screener?network=${encodeURIComponent(first.network)}&address=${encodeURIComponent(first.address)}`,
            );
          }
        }

        if (pulseRes.ok) {
          const data = (await pulseRes.json()) as { items?: PulseItem[] };
          setPulseBuys((data.items ?? []).filter((item) => item.type === "buy"));
        }
      } catch {
        // keep empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boardById = useMemo(
    () => new Map(board.map((row) => [row.id, row])),
    [board],
  );

  const walletBuyRails: RailCoin[] = useMemo(() => {
    const seen = new Set<string>();
    const rows: RailCoin[] = [];

    for (const item of pulseBuys) {
      const route = resolvePulseBuy(item);
      if (!route) continue;
      const id = `${route.network}:${route.address.toLowerCase()}`;
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push({
        id,
        network: route.network,
        address: route.address,
        symbol: item.asset,
        name: item.asset,
        imageUrl: null,
        meta: `${item.walletLabel} · ${item.usd} · ${item.time}`,
        score: boardById.get(id)?.score ?? null,
        whyHere: `Tracked wallet “${item.walletLabel}” bought ${item.amount} ${item.asset} (${item.usd}) — ${item.date} ${item.time}.`,
        walletAddress: item.walletAddress || null,
        walletLabel: item.walletLabel,
      });
      if (rows.length >= 16) break;
    }
    return rows;
  }, [pulseBuys, boardById]);

  const watchlistRails: RailCoin[] = useMemo(
    () =>
      watchedTokens.map((token) => ({
        id: token.id,
        network: token.network,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        imageUrl: token.imageUrl,
        meta: "Pinned to your watchlist",
      })),
    [watchedTokens],
  );

  const trendingRails: RailCoin[] = useMemo(
    () =>
      board
        .filter((row) => row.kind === "trending" || row.kind === "major")
        .slice(0, 24)
        .map((row) => ({
          id: row.id,
          network: row.network,
          address: row.address,
          symbol: row.symbol,
          name: row.name,
          imageUrl: row.imageUrl,
          change24h: row.change24h,
          score: row.score ?? null,
          meta: row.kind === "major" ? "Major" : row.poolName || "Trending",
        })),
    [board],
  );

  const activeCoin = useMemo(() => {
    if (!network || !address) return null;
    const id = `${network}:${address.toLowerCase()}`;
    return (
      board.find((row) => row.id === id) ||
      walletBuyRails.find((row) => row.id === id) ||
      watchlistRails.find((row) => row.id === id) ||
      trendingRails.find((row) => row.id === id) ||
      null
    );
  }, [network, address, board, walletBuyRails, watchlistRails, trendingRails]);

  const activeId =
    network && address ? `${network}:${address.toLowerCase()}` : null;

  const walletBuyCount = useMemo(() => {
    if (!activeId) return 0;
    const seen = new Set<string>();
    for (const item of pulseBuys) {
      const route = resolvePulseBuy(item);
      const id = route
        ? `${route.network}:${route.address.toLowerCase()}`
        : null;
      if (id === activeId || (!id && activeCoin && item.asset.toUpperCase() === activeCoin.symbol.toUpperCase())) {
        seen.add(item.walletAddress || item.walletLabel);
      }
    }
    return seen.size;
  }, [pulseBuys, activeId, activeCoin]);

  const whyHere =
    whyParam ||
    walletBuyRails.find((row) => row.id === activeId)?.whyHere ||
    null;

  function openCoin(coin: RailCoin) {
    const params = new URLSearchParams({
      network: coin.network,
      address: coin.address,
    });
    if (coin.whyHere) params.set("why", coin.whyHere);
    if (coin.walletAddress) {
      params.set("wallet", coin.walletAddress);
      if (coin.walletLabel) params.set("wl", coin.walletLabel);
    }
    router.push(`/app/screener?${params.toString()}`);
  }

  function openPair(hit: PairHit) {
    router.push(
      `/app/screener?network=${encodeURIComponent(hit.network)}&address=${encodeURIComponent(hit.address)}`,
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Screener"
        description="Open a coin → desk + Opportunity Score lead. Rails: wallet buys, watchlist, trending (sorted by score)."
      />

      <PairSearchBox onSelect={openPair} />

      {network && address ? (
        <div className="space-y-4">
          <TokenDeskView
            network={network}
            address={address}
            compact
            trackWallet={trackWallet}
            trackWalletLabel={trackWalletLabel}
            trackFocusTime={
              trackFocusTime != null && Number.isFinite(trackFocusTime) ? trackFocusTime : null
            }
            trackSide={trackSide}
            trackWhy={whyParam}
          />
          <CoinAnalysisPanel
            network={network}
            address={address}
            whyHere={whyHere}
            trackedWalletBuys={walletBuyCount}
          />
          <FlowsPanel
            compact
            title="Flows on this coin"
            description="Tracked wallets that bought the same asset — leader, followers, and cross-chain overlap."
            filter={{
              symbol: activeCoin?.symbol ?? undefined,
              network,
              address,
            }}
          />
        </div>
      ) : (
        <p className="rounded-[20px] border border-white/[0.08] bg-black/30 px-4 py-10 text-center font-mono text-[12px] text-zinc-600">
          {loading || !ready
            ? "Loading desk…"
            : "Pick a coin from the rails or search a pair / contract."}
        </p>
      )}

      <ScreenerRails
        walletBuys={walletBuyRails}
        watchlist={watchlistRails}
        trending={trendingRails}
        activeId={activeId}
        onSelect={openCoin}
        railsCollapsed={railsCollapsed}
        onToggleCollapsed={() => setRailsCollapsed((v) => !v)}
      />
    </div>
  );
}

function resolvePulseBuy(item: PulseItem): { network: string; address: string } | null {
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

export default function ScreenerPage() {
  return (
    <Suspense>
      <ScreenerBoard />
    </Suspense>
  );
}
