import { NextResponse } from "next/server";
import { buildPulseForWallets, type PulseItem } from "@/lib/alchemy-pulse";
import { CURATED_SMART_MONEY, PERSONAL_PULSE_THRESHOLD } from "@/lib/curated-wallets";
import { listWallets } from "@/lib/desk-db";
import { mockMoves } from "@/lib/mock/data";
import { syncAlertsFromPulse } from "@/lib/pulse-alerts";
import { requireSession } from "@/lib/session";

function demoPulse(source: "market" | "personal"): PulseItem[] {
  return mockMoves.map((move) => ({
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
    source: source === "personal" ? "personal" : "demo",
  }));
}

async function maybeSyncAlerts(userId: string, items: PulseItem[]) {
  try {
    return await syncAlertsFromPulse(userId, items);
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const forced = url.searchParams.get("mode");

  const saved = await listWallets(session.user.id);
  const personalReady = saved.length >= PERSONAL_PULSE_THRESHOLD;
  const mode =
    forced === "market" || forced === "personal"
      ? forced
      : personalReady
        ? "personal"
        : "market";

  const ethTracked = saved
    .filter((row) => row.chain === "ETH")
    .map((row) => ({ label: row.label, address: row.address }));

  try {
    // Always harvest alerts from the user's own ETH desks when they have any.
    let personalItems: PulseItem[] = [];
    if (ethTracked.length > 0) {
      personalItems = await buildPulseForWallets(ethTracked, "personal");
      await maybeSyncAlerts(session.user.id, personalItems);
    }

    if (mode === "personal") {
      const items = personalItems.length > 0 ? personalItems : demoPulse("personal");
      return NextResponse.json({
        mode,
        personalReady,
        trackedCount: saved.length,
        threshold: PERSONAL_PULSE_THRESHOLD,
        live: personalItems.length > 0,
        alertsCreated: personalItems.length > 0,
        items,
      });
    }

    const marketItems = await buildPulseForWallets(
      CURATED_SMART_MONEY.map((wallet) => ({
        label: wallet.label,
        address: wallet.address,
      })),
      "market",
    );

    // Empty desk: seed inbox from significant market pulse so alerts feel live.
    if (ethTracked.length === 0 && marketItems.length > 0) {
      await maybeSyncAlerts(session.user.id, marketItems);
    }

    const items = marketItems.length > 0 ? marketItems : demoPulse("market");
    return NextResponse.json({
      mode,
      personalReady,
      trackedCount: saved.length,
      threshold: PERSONAL_PULSE_THRESHOLD,
      live: marketItems.length > 0,
      items,
      curated: CURATED_SMART_MONEY.map((wallet) => ({
        id: wallet.id,
        label: wallet.label,
        address: wallet.address,
        blurb: wallet.blurb,
      })),
    });
  } catch {
    return NextResponse.json({
      mode,
      personalReady,
      trackedCount: saved.length,
      threshold: PERSONAL_PULSE_THRESHOLD,
      live: false,
      items: demoPulse(mode),
    });
  }
}
