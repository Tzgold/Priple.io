import { NextResponse } from "next/server";
import { listWallets } from "@/lib/desk-db";
import { requireSession } from "@/lib/session";
import { fetchMultiWalletChartMarks } from "@/lib/wallet-dossier";

/** Simple per-user in-memory throttle for marks (shared Alchemy budget). */
const marksHits = new Map<string, { count: number; resetAt: number }>();

function allowMarksRequest(userId: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 20;
  const row = marksHits.get(userId);
  if (!row || now > row.resetAt) {
    marksHits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= max) return false;
  row.count += 1;
  return true;
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!allowMarksRequest(session.user.id)) {
    return NextResponse.json(
      { error: "Too many mark requests — wait a minute", marks: [] },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const focusWallet = url.searchParams.get("wallet");
  const focusLabel = url.searchParams.get("label") || undefined;
  const walletsParam = url.searchParams.get("wallets");
  const labelsParam = url.searchParams.get("labels");
  const atRaw = url.searchParams.get("at");
  const sideRaw = url.searchParams.get("side");
  const asset = url.searchParams.get("asset") || undefined;
  const network = url.searchParams.get("network") || undefined;

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  let labelMap: Record<string, string> = {};
  if (labelsParam) {
    try {
      labelMap = JSON.parse(labelsParam) as Record<string, string>;
    } catch {
      labelMap = {};
    }
  }

  const owned = await listWallets(session.user.id);
  const ownedSet = new Set(owned.map((w) => w.address.trim().toLowerCase()));
  for (const w of owned) {
    if (w.label) labelMap[w.address.toLowerCase()] = w.label;
  }

  const wallets: Array<{ address: string; label?: string }> = [];
  const seen = new Set<string>();

  function pushWallet(address: string | null | undefined, label?: string, force = false) {
    const addr = (address || "").trim();
    if (!addr || addr.length < 8) return;
    const key = addr.toLowerCase();
    // Only track desks the user owns (plus optional focus already owned).
    if (!force && !ownedSet.has(key)) return;
    if (seen.has(key)) return;
    seen.add(key);
    wallets.push({
      address: addr,
      label: label || labelMap[key] || labelMap[addr] || undefined,
    });
  }

  if (walletsParam) {
    for (const part of walletsParam.split(",")) pushWallet(part);
  }

  const atPreview = atRaw ? Number(atRaw) : NaN;
  const sidePreview = sideRaw === "sell" ? "sell" : sideRaw === "buy" ? "buy" : null;
  const hasSeed = Number.isFinite(atPreview) && Boolean(sidePreview);

  // Focus wallet: owned desks always; curated/unowned only for a single dossier seed (no RPC fan-out).
  if (focusWallet) {
    const focusKey = focusWallet.trim().toLowerCase();
    if (ownedSet.has(focusKey) || hasSeed) {
      pushWallet(focusWallet, focusLabel, true);
    }
  }

  // Fill remaining slots from the user's own desks only.
  if (wallets.length < 6) {
    for (const row of owned) {
      if (wallets.length >= 6) break;
      pushWallet(row.address, row.label, true);
    }
  }

  if (wallets.length === 0) {
    return NextResponse.json({ error: "No wallets to mark", marks: [] }, { status: 400 });
  }

  const at = atPreview;
  const side = sidePreview;

  try {
    // Never RPC-fan-out arbitrary/unowned addresses — only the user's desks.
    const walletsForFetch = wallets.filter((w) =>
      ownedSet.has(w.address.trim().toLowerCase()),
    );

    const marks = await fetchMultiWalletChartMarks({
      wallets: walletsForFetch,
      tokenAddress: token,
      network: network || undefined,
      seed:
        focusWallet && Number.isFinite(at) && side
          ? {
              walletAddress: focusWallet,
              walletLabel: focusLabel || null,
              timeSec: at,
              side,
              asset: asset || undefined,
            }
          : null,
    });

    return NextResponse.json({
      marks,
      token,
      network: network || null,
      wallets: wallets.map((w) => w.address),
      focusWallet: focusWallet || null,
      live: marks.length > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load marks";
    return NextResponse.json({ error: message, marks: [] }, { status: 502 });
  }
}
