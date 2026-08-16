import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { fetchMultiWalletChartMarks } from "@/lib/wallet-dossier";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const wallets: Array<{ address: string; label?: string }> = [];
  const seen = new Set<string>();

  function pushWallet(address: string | null | undefined, label?: string) {
    const addr = (address || "").trim();
    if (!addr || addr.length < 8) return;
    const key = addr.toLowerCase();
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
  pushWallet(focusWallet, focusLabel);

  if (wallets.length === 0) {
    return NextResponse.json({ error: "wallet or wallets is required", marks: [] }, { status: 400 });
  }

  const at = atRaw ? Number(atRaw) : NaN;
  const side = sideRaw === "sell" ? "sell" : sideRaw === "buy" ? "buy" : null;

  try {
    const marks = await fetchMultiWalletChartMarks({
      wallets,
      tokenAddress: token,
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
      wallets: wallets.map((w) => w.address),
      focusWallet: focusWallet || null,
      live: marks.length > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load marks";
    return NextResponse.json({ error: message, marks: [] }, { status: 502 });
  }
}
