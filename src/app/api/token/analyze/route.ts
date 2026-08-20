import { NextResponse } from "next/server";
import { buildPulseForWallets, type PulseItem } from "@/lib/alchemy-pulse";
import {
  buildCoinAnalysis,
  withTrackedFlowMoves,
} from "@/lib/coin-analysis";
import { listWallets } from "@/lib/desk-db";
import { coinSubjectKey } from "@/lib/narrative-load";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { resolvePulseBuy } from "@/lib/screener-lists";
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
  const walletBuysRaw = url.searchParams.get("walletBuys");
  const trackedWalletBuys = walletBuysRaw ? Number(walletBuysRaw) : undefined;

  if (!network || !address) {
    return NextResponse.json({ error: "network and address are required" }, { status: 400 });
  }

  try {
    const analysisPromise = buildCoinAnalysis({
      network,
      address,
      whyHere,
      trackedWalletBuys:
        trackedWalletBuys != null && Number.isFinite(trackedWalletBuys)
          ? Math.max(0, Math.floor(trackedWalletBuys))
          : undefined,
    });

    const pulsePromise = (async (): Promise<PulseItem[]> => {
      const wallets = await listWallets(session.user.id);
      if (wallets.length === 0) return [];
      return buildPulseForWallets(
        wallets.map((wallet) => ({
          label: wallet.label,
          address: wallet.address,
          chain: wallet.chain,
        })),
        "personal",
      );
    })().catch(() => [] as PulseItem[]);

    const [analysisBase, pulse] = await Promise.all([analysisPromise, pulsePromise]);
    if (!analysisBase) {
      return NextResponse.json({ error: "Could not build analysis" }, { status: 404 });
    }

    let analysis = analysisBase;
    if (pulse.length > 0) {
      const subject = coinSubjectKey(network, address);
      const trackedMoves = pulse.filter((item) => {
        if (item.source !== "personal") return false;
        const route = resolvePulseBuy(item);
        if (route) {
          return coinSubjectKey(route.network, route.address) === subject;
        }
        return item.asset.toUpperCase() === analysis.symbol.toUpperCase();
      });
      analysis = withTrackedFlowMoves(analysis, trackedMoves);
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
