import { NextResponse } from "next/server";
import {
  createAlertRule,
  listAlertRules,
  listWallets,
  relativeTime,
} from "@/lib/desk-db";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rules, wallets] = await Promise.all([
    listAlertRules(session.user.id),
    listWallets(session.user.id),
  ]);
  const labelById = new Map(wallets.map((wallet) => [wallet.id, wallet.label]));

  return NextResponse.json({
    rules: rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      walletId: rule.wallet_id,
      walletLabel: rule.wallet_id ? labelById.get(rule.wallet_id) || "Wallet" : "Any tracked wallet",
      side: rule.side,
      minUsd: rule.min_usd,
      enabled: rule.enabled,
      createdAt: relativeTime(new Date(rule.created_at)),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "alerts:rules", 30);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  let body: {
    title?: string;
    walletId?: string | null;
    side?: string;
    minUsd?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const row = await createAlertRule(session.user.id, {
      title: body.title || "Wallet size alert",
      walletId: body.walletId,
      side: body.side,
      minUsd: body.minUsd,
    });

    return NextResponse.json(
      {
        rule: {
          id: row.id,
          title: row.title,
          walletId: row.wallet_id,
          side: row.side,
          minUsd: row.min_usd,
          enabled: row.enabled,
          createdAt: "now",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create rule";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
