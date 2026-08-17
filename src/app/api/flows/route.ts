import { NextResponse } from "next/server";
import { buildPulseForWallets, type PulseItem } from "@/lib/alchemy-pulse";
import { CURATED_SMART_MONEY, PERSONAL_PULSE_THRESHOLD } from "@/lib/curated-wallets";
import { listWallets } from "@/lib/desk-db";
import { buildFlowsFromPulse, filterFlows } from "@/lib/flows";
import { mockMoves } from "@/lib/mock/data";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";
import { MAJOR_TOKEN_ROUTES, SYMBOL_TO_CG } from "@/lib/token-routes";

function demoPulse(): PulseItem[] {
  return mockMoves.map((move) => {
    const cg = SYMBOL_TO_CG[move.asset.toUpperCase()];
    const route = cg ? MAJOR_TOKEN_ROUTES[cg] : null;
    const network = route && "cg" in route ? "coingecko" : route?.network || "eth";
    const tokenAddress = route && "cg" in route ? route.cg : route?.address || null;

    return {
      id: `demo-${move.id}`,
      walletLabel: move.wallet,
      walletAddress: "",
      action: move.action,
      amount: move.amount,
      asset: move.asset,
      usd: move.usd,
      time: move.time,
      date: move.date,
      status: move.status,
      type: move.type,
      source: "demo",
      tokenAddress,
      network,
    };
  });
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "market:flows", 15);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  const network = url.searchParams.get("network");
  const address = url.searchParams.get("address");

  const saved = await listWallets(session.user.id);
  const personalReady = saved.length >= PERSONAL_PULSE_THRESHOLD;
  const tracked = saved.map((row) => ({
    label: row.label,
    address: row.address,
    chain: row.chain,
  }));

  try {
    let items: PulseItem[] = [];
    let mode: "market" | "personal" = personalReady ? "personal" : "market";
    let live = false;

    if (tracked.length > 0) {
      const personal = await buildPulseForWallets(tracked, "personal");
      if (personal.length > 0) {
        items = personal;
        mode = "personal";
        live = true;
      }
    }

    if (items.length === 0) {
      const market = await buildPulseForWallets(
        CURATED_SMART_MONEY.map((w) => ({
          label: w.label,
          address: w.address,
          chain: w.chain,
        })),
        "market",
      );
      items = market.length > 0 ? market : demoPulse();
      mode = market.length > 0 ? "market" : "market";
      live = market.length > 0;
    }

    const snapshot = filterFlows(buildFlowsFromPulse(items), {
      symbol,
      network,
      address,
    });

    return NextResponse.json({
      mode,
      live,
      trackedCount: saved.length,
      ...snapshot,
    });
  } catch {
    const snapshot = filterFlows(buildFlowsFromPulse(demoPulse()), {
      symbol,
      network,
      address,
    });
    return NextResponse.json({
      mode: "market",
      live: false,
      trackedCount: saved.length,
      ...snapshot,
    });
  }
}
