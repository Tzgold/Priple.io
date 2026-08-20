import { NextResponse } from "next/server";
import { coinSubjectKey, loadCoinNarrativePacket, loadWalletNarrativePacket } from "@/lib/narrative-load";
import { writeWalletBriefing } from "@/lib/narrative-llm";
import {
  createNarrativeThread,
  getActiveNarrativeThread,
  listNarrativeMessages,
} from "@/lib/narrative-store";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "narrative:brief", 8);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    walletId?: string;
    network?: string;
    address?: string;
    whyHere?: string;
    trackedWalletBuys?: number;
  } | null;

  const type = clip(body?.type, 16);

  if (type === "wallet") {
    const walletId = clip(body?.walletId, 80);
    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 });
    }

    const existing = await getActiveNarrativeThread(session.user.id, "wallet", walletId);
    if (existing) {
      const messages = await listNarrativeMessages(existing.id);
      return NextResponse.json({
        threadId: existing.id,
        briefing: existing.briefing,
        origin: existing.origin,
        messages,
      });
    }

    const packet = await loadWalletNarrativePacket(session.user.id, walletId);
    if (!packet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const written = await writeWalletBriefing(packet);
    const thread = await createNarrativeThread({
      userId: session.user.id,
      subjectType: "wallet",
      subjectKey: walletId,
      packet,
      briefing: written.briefing,
      origin: written.origin,
    });

    return NextResponse.json({
      threadId: thread.id,
      briefing: thread.briefing,
      origin: thread.origin,
      messages: [],
    });
  }

  if (type === "coin") {
    const network = clip(body?.network, 32);
    const address = clip(body?.address, 80);
    if (!network || !address) {
      return NextResponse.json({ error: "network and address are required" }, { status: 400 });
    }

    const subjectKey = coinSubjectKey(network, address);
    const whyHere = body?.whyHere ? clip(body.whyHere, 400) : null;
    const trackedWalletBuys =
      body?.trackedWalletBuys != null && Number.isFinite(body.trackedWalletBuys)
        ? Math.max(0, Math.floor(body.trackedWalletBuys))
        : undefined;

    const existing = await getActiveNarrativeThread(session.user.id, "coin", subjectKey);
    if (existing) {
      const messages = await listNarrativeMessages(existing.id);
      return NextResponse.json({
        threadId: existing.id,
        briefing: existing.briefing,
        origin: existing.origin,
        messages,
      });
    }

    const packet = await loadCoinNarrativePacket(
      session.user.id,
      network,
      address,
      whyHere,
      trackedWalletBuys,
    );
    if (!packet) {
      return NextResponse.json({ error: "Coin not found" }, { status: 404 });
    }

    const written = await writeWalletBriefing(packet);
    const thread = await createNarrativeThread({
      userId: session.user.id,
      subjectType: "coin",
      subjectKey,
      packet,
      briefing: written.briefing,
      origin: written.origin,
    });

    return NextResponse.json({
      threadId: thread.id,
      briefing: thread.briefing,
      origin: thread.origin,
      messages: [],
    });
  }

  return NextResponse.json({ error: "type must be wallet or coin" }, { status: 400 });
}
