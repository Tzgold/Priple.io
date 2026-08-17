"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CoinAnalysisPanel } from "@/components/app/CoinAnalysisPanel";
import { FlowsPanel } from "@/components/app/FlowsPanel";
import { TokenDeskView } from "@/components/app/TokenDeskView";
import { useDesk } from "@/lib/app-store";
import { useScreenerBoard } from "@/hooks/useScreenerBoard";
import { resolvePulseBuy } from "@/lib/screener-lists";

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

  const { ready } = useDesk();
  const { boardById, walletBuys, pulseBuys, loading } = useScreenerBoard();

  useEffect(() => {
    if (network || address) return;
    const first = [...boardById.values()].find((row) => row.kind === "trending")
      ?? [...boardById.values()].find((row) => row.kind === "major")
      ?? [...boardById.values()][0];
    if (!first) return;
    router.replace(
      `/app/screener?network=${encodeURIComponent(first.network)}&address=${encodeURIComponent(first.address)}`,
    );
  }, [network, address, boardById, router]);

  const activeId =
    network && address ? `${network}:${address.toLowerCase()}` : null;

  const activeCoin = activeId ? boardById.get(activeId) ?? null : null;

  const walletBuyCount = useMemo(() => {
    if (!activeId) return 0;
    const seen = new Set<string>();
    for (const item of pulseBuys) {
      const route = resolvePulseBuy(item);
      const id = route ? `${route.network}:${route.address.toLowerCase()}` : null;
      const sym = activeCoin?.symbol;
      if (
        id === activeId ||
        (!id && sym && item.asset.toUpperCase() === sym.toUpperCase())
      ) {
        seen.add(item.walletAddress || item.walletLabel);
      }
    }
    return seen.size;
  }, [pulseBuys, activeId, activeCoin]);

  const whyHere =
    whyParam ||
    walletBuys.find((row) => row.id === activeId)?.whyHere ||
    null;

  return (
    <div className="min-h-0">
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
        <div className="flex min-h-[320px] items-center justify-center rounded-[20px] border border-white/[0.08] bg-black/30 px-6 py-16 text-center">
          <p className="max-w-sm font-mono text-[12px] leading-6 text-zinc-500">
            {loading || !ready
              ? "Loading desk…"
              : "Pick a token from the left list — the desk opens here without leaving the page."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ScreenerPage() {
  return (
    <Suspense>
      <ScreenerBoard />
    </Suspense>
  );
}
