import { NextResponse } from "next/server";
import { alchemyCoverageNote } from "@/lib/alchemy-networks";
import { CURATED_SMART_MONEY } from "@/lib/curated-wallets";
import { deleteWallet, getWallet } from "@/lib/desk-db";
import { mockMoves, mockWallets } from "@/lib/mock/data";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";
import {
  buildDemoWalletDossier,
  buildLiveWalletDossier,
  type WalletDossier,
} from "@/lib/wallet-dossier";

type Params = { params: Promise<{ id: string }> };

function withCoverageNote(dossier: WalletDossier, chain: string): WalletDossier {
  if (dossier.live) return dossier;
  const coverage = alchemyCoverageNote(chain);
  if (!coverage.message) return dossier;
  return { ...dossier, note: coverage.message };
}

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "alchemy:dossier", 15);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const owned = await getWallet(session.user.id, id);
  if (owned) {
    const live = await buildLiveWalletDossier({
      id: owned.id,
      label: owned.label,
      address: owned.address,
      chain: owned.chain,
    });
    if (live) return NextResponse.json({ dossier: live, coverage: alchemyCoverageNote(owned.chain) });
    return NextResponse.json({
      dossier: withCoverageNote(
        buildDemoWalletDossier({
          id: owned.id,
          label: owned.label,
          address: owned.address,
          chain: owned.chain,
          moves: mockMoves,
        }),
        owned.chain,
      ),
      coverage: alchemyCoverageNote(owned.chain),
    });
  }

  const curated = CURATED_SMART_MONEY.find((wallet) => wallet.id === id);
  if (curated) {
    const live = await buildLiveWalletDossier({
      id: curated.id,
      label: curated.label,
      address: curated.address,
      chain: curated.chain,
    });
    if (live) {
      return NextResponse.json({ dossier: live, coverage: alchemyCoverageNote(curated.chain) });
    }
    return NextResponse.json({
      dossier: withCoverageNote(
        buildDemoWalletDossier({
          id: curated.id,
          label: curated.label,
          address: curated.address,
          chain: curated.chain,
          moves: mockMoves,
        }),
        curated.chain,
      ),
      coverage: alchemyCoverageNote(curated.chain),
    });
  }

  const mock = mockWallets.find((wallet) => wallet.id === id);
  if (mock) {
    const curatedMatch = CURATED_SMART_MONEY.find(
      (wallet) => wallet.label.toLowerCase() === mock.label.toLowerCase(),
    );
    const address = curatedMatch?.address || mock.fullAddress || mock.address;
    const chain = curatedMatch?.chain || mock.chain;

    if (
      curatedMatch ||
      (typeof mock.fullAddress === "string" &&
        mock.fullAddress.startsWith("0x") &&
        mock.fullAddress.length === 42)
    ) {
      const live = await buildLiveWalletDossier({
        id: mock.id,
        label: mock.label,
        address,
        chain,
      });
      if (live) {
        return NextResponse.json({ dossier: live, coverage: alchemyCoverageNote(chain) });
      }
    }

    return NextResponse.json({
      dossier: withCoverageNote(
        buildDemoWalletDossier({
          id: mock.id,
          label: mock.label,
          address,
          chain,
          moves: mockMoves,
        }),
        chain,
      ),
      coverage: alchemyCoverageNote(chain),
    });
  }

  return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const deleted = await deleteWallet(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
