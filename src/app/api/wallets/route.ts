import { NextResponse } from "next/server";
import { createWallet, listWallets, shortAddress, chainAsset } from "@/lib/desk-db";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listWallets(session.user.id);
  const wallets = rows.map((row) => ({
    id: row.id,
    label: row.label,
    address: shortAddress(row.address),
    fullAddress: row.address,
    chain: row.chain,
    pnl30d: "—",
    lastMove: "Synced",
    score: 50,
    asset: chainAsset(row.chain),
    usd: "—",
    custom: true,
  }));

  return NextResponse.json({ wallets });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { address?: string; chain?: string; label?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.address || !body.chain) {
    return NextResponse.json({ error: "address and chain are required" }, { status: 400 });
  }

  try {
    const row = await createWallet(session.user.id, {
      address: body.address,
      chain: body.chain,
      label: body.label,
      notes: body.notes,
    });

    return NextResponse.json(
      {
        wallet: {
          id: row.id,
          label: row.label,
          address: shortAddress(row.address),
          fullAddress: row.address,
          chain: row.chain,
          pnl30d: "—",
          lastMove: "Just added",
          score: 50,
          asset: chainAsset(row.chain),
          usd: "—",
          custom: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create wallet";
    const status = message.includes("already tracked") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
