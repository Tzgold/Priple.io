import { z } from "zod";
import { generateText, Output, streamText } from "ai";
import type { NarrativePacket } from "@/lib/narrative-packet";
import { briefingDriftedFromPacket } from "@/lib/narrative-packet";
import type { WalletNarrative } from "@/lib/wallet-narrative";

export const NARRATIVE_MODEL = "google/gemini-3.5-flash-lite";

const factSchema = z.object({
  label: z.string(),
  value: z.string(),
  tone: z.enum(["up", "down", "neutral"]).optional(),
});

const briefingSchema = z.object({
  headline: z.string(),
  paragraphs: z.array(z.string()).max(4),
  highlight: z
    .object({
      title: z.string(),
      body: z.string(),
    })
    .nullable(),
  facts: z.array(factSchema).max(4),
});

export const NARRATIVE_SYSTEM = `You are Priple's desk analyst. Research only — never investment advice.
Use ONLY the JSON fact packet. Do not invent wallets, tickers, USD sizes, headlines, or overlap.
If window.live is false, say this window is not a live personal feed (quiet / no Alchemy transfers).
If activity is empty, say the desk was quiet. Do not pad with demo tape.
No buy/sell/hold recommendations, no price targets, no hype ("loading", "this will run").
Tone: terminal, specific, short.
Sources are copied by the server — do not add sources.
Facts row labels must stay: "Buys / sells", "Assets touched", "Networks", "Wallet overlap".`;

export const ASK_MORE_SYSTEM = `${NARRATIVE_SYSTEM}
Answer the user's question about THIS packet and briefing only.
If the answer is not in the packet, say it is not in this window.
Refuse trade calls.`;

function packetPrompt(packet: NarrativePacket) {
  const { template: _template, ...rest } = packet;
  return JSON.stringify(rest);
}

function asBriefing(
  raw: z.infer<typeof briefingSchema>,
  packet: NarrativePacket,
): WalletNarrative | null {
  const briefing: WalletNarrative = {
    headline: raw.headline.trim().slice(0, 160),
    paragraphs: raw.paragraphs.map((line) => line.trim().slice(0, 400)).filter(Boolean).slice(0, 4),
    highlight: raw.highlight
      ? {
          title: raw.highlight.title.trim().slice(0, 80),
          body: raw.highlight.body.trim().slice(0, 400),
        }
      : null,
    facts: packet.template.facts,
    sources: packet.sources,
    generatedAt: new Date().toISOString(),
  };
  if (!briefing.headline || briefing.paragraphs.length === 0) return null;
  if (briefingDriftedFromPacket(briefing, packet)) return null;
  return briefing;
}

export async function writeWalletBriefing(
  packet: NarrativePacket,
): Promise<{ briefing: WalletNarrative; origin: "llm" | "template" }> {
  try {
    const result = await generateText({
      model: NARRATIVE_MODEL,
      output: Output.object({ schema: briefingSchema }),
      system: NARRATIVE_SYSTEM,
      prompt: `Write a wallet briefing from this packet:\n${packetPrompt(packet)}`,
      abortSignal: AbortSignal.timeout(20_000),
    });
    const parsed = briefingSchema.safeParse(result.output);
    if (!parsed.success) {
      return { briefing: packet.template, origin: "template" };
    }
    const briefing = asBriefing(parsed.data, packet);
    if (!briefing) return { briefing: packet.template, origin: "template" };
    return { briefing, origin: "llm" };
  } catch {
    return { briefing: packet.template, origin: "template" };
  }
}

export function streamAskMore(input: {
  packet: NarrativePacket;
  briefing: WalletNarrative;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
}) {
  const messages = [
    ...input.history.map((row) => ({
      role: row.role,
      content: row.content,
    })),
    { role: "user" as const, content: input.message },
  ];

  return streamText({
    model: NARRATIVE_MODEL,
    system: `${ASK_MORE_SYSTEM}\n\nPacket:\n${packetPrompt(input.packet)}\n\nBriefing:\n${JSON.stringify({
      headline: input.briefing.headline,
      paragraphs: input.briefing.paragraphs,
      sources: input.briefing.sources,
    })}`,
    messages,
    abortSignal: AbortSignal.timeout(30_000),
  });
}
