import { NextResponse } from "next/server";
import { streamAskMore } from "@/lib/narrative-llm";
import {
  appendNarrativeMessage,
  countUserNarrativeMessages,
  getNarrativeThreadById,
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

  const limited = await limitUserRoute(session.user.id, "narrative:chat", 20);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const body = (await request.json().catch(() => null)) as {
    threadId?: string;
    message?: string;
  } | null;

  const threadId = clip(body?.threadId, 80);
  const message = clip(body?.message, 400);
  if (!threadId || !message) {
    return NextResponse.json({ error: "threadId and message are required" }, { status: 400 });
  }

  const thread = await getNarrativeThreadById(session.user.id, threadId);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const used = await countUserNarrativeMessages(thread.id);
  if (used >= 10) {
    return NextResponse.json(
      { error: "Ask more is capped at 10 questions — open a new briefing" },
      { status: 400 },
    );
  }

  const history = await listNarrativeMessages(thread.id);
  await appendNarrativeMessage({ threadId: thread.id, role: "user", content: message });

  try {
    const result = streamAskMore({
      packet: thread.packet,
      briefing: thread.briefing,
      history: history.map((row) => ({ role: row.role, content: row.content })),
      message,
    });

    void Promise.resolve(result.text).then((text) => {
      if (text.trim()) {
        void appendNarrativeMessage({
          threadId: thread.id,
          role: "assistant",
          content: text.trim(),
        });
      }
    });

    return result.toTextStreamResponse();
  } catch {
    return NextResponse.json({ error: "Could not reach the model" }, { status: 502 });
  }
}
