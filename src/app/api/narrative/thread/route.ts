import { NextResponse } from "next/server";
import {
  getActiveNarrativeThread,
  getNarrativeThreadById,
  listNarrativeMessages,
} from "@/lib/narrative-store";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

function clip(value: string | null, max: number) {
  if (!value) return "";
  return value.trim().slice(0, max);
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "narrative:thread", 30);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const url = new URL(request.url);
  const id = clip(url.searchParams.get("id"), 80);
  const walletId = clip(url.searchParams.get("walletId"), 80);

  const thread = id
    ? await getNarrativeThreadById(session.user.id, id)
    : walletId
      ? await getActiveNarrativeThread(session.user.id, "wallet", walletId)
      : null;

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messages = await listNarrativeMessages(thread.id);
  return NextResponse.json({
    threadId: thread.id,
    briefing: thread.briefing,
    origin: thread.origin,
    messages,
  });
}
