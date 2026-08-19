import { NextResponse } from "next/server";
import { loadWalletNarrativePacket } from "@/lib/narrative-load";
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
  } | null;

  const walletId = clip(body?.walletId, 80);
  if (body?.type !== "wallet" || !walletId) {
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
