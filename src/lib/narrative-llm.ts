import { z } from "zod";
import { generateText, Output, streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { NarrativePacket } from "@/lib/narrative-packet";
import { briefingDriftedFromPacket } from "@/lib/narrative-packet";
import type { WalletNarrative } from "@/lib/wallet-narrative";

const MODEL_PRIMARY = process.env.OPENAI_MODEL_PRIMARY ?? "openai/gpt-4o-mini";
const MODEL_FALLBACK = process.env.OPENAI_MODEL_FALLBACK ?? "google/gemini-2.0-flash-001";
const TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS ?? "20000", 10);

function openrouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  return createOpenRouter({ apiKey });
}

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

export const NARRATIVE_SYSTEM_WALLET = `You are Priple's desk analyst. Research only — never investment advice.
Use ONLY the JSON fact packet. Do not invent wallets, tickers, USD sizes, headlines, or overlap.

Wallet rules:
- If window.live is false, say this window is not a live personal feed (quiet / no Alchemy transfers).
- If activity is empty, say the desk was quiet. Do not pad with demo tape.
- When explaining trades, use activity rows + tradeSummary. Be specific: side, asset, amount, usd, time.
- Use desk.bias / desk.biasLabel and desk.feedLabel when summarizing the window posture.
- tradeSummary.netFlowUsd is window flow (sell USD − buy USD), NOT realized profit. Always say that if the user asks about profit/PnL.
- Holdings are a snapshot (symbol, network, balance), not cost basis. Do not invent entry prices or % gains.
- No buy/sell/hold recommendations, no price targets, no hype.

Tone for briefings: terminal, specific, clear.
Sources are copied by the server — do not add sources.
Facts row labels must stay: "Buys / sells", "Assets touched", "Networks", "Wallet overlap".`;

export const NARRATIVE_SYSTEM_COIN = `You are Priple's desk analyst. Research only — never investment advice.
Use ONLY the JSON fact packet. Do not invent wallets, tickers, USD sizes, headlines, posts, or links.

Coin rules:
- Discuss market, holders, tracked wallet moves, pool tape, momentum, risk, security checklist, social, and news only from the packet.
- Use holders.count, holders.top10, holders.next20 and holderMap.bands when discussing concentration.
- For holder / concentration / distribution questions: use holderMap.summary and walk holderMap.bands (label, pct, detail, tone).
- For momentum / structure / short TF questions: use momentum.windows, momentum.bias, momentum.volLiqLabel, momentum.rangeLabel, and momentum.notes.
- For security / honeypot / mint / freeze / GT score questions: use security.checks and security.summary. Quote each check label + status + detail. Do not invent flags.
- For flow / tape / recent trades: use tape.recent and tape.summary. For tracked desks: use tracked.moves.
- If tracked.moves is empty, say no tracked desks moved this coin in this window.
- If tape.recent is empty, say no recent pool prints were in this window.
- For news questions: use intel.headlines. Quote title + source and paste the exact url from the packet. Never invent a URL.
- For social questions: use social.* and intel social counts (followers, reddit, telegram, sentiment, heat).
- If headlines/social fields are empty or missing, say they are not in this window — do not invent posts.
- No buy/sell/hold recommendations, no price targets, no hype.

Tone for briefings: terminal, specific, clear. Include real links when the packet has them.
Sources are copied by the server — do not add sources.
Facts row labels must stay: "24H change", "Liquidity", "Risk", "Tracked desks".`;

function systemForPacket(packet: NarrativePacket) {
  return packet.subject.type === "coin" ? NARRATIVE_SYSTEM_COIN : NARRATIVE_SYSTEM_WALLET;
}

export const ASK_MORE_SYSTEM = `You are answering a follow-up question about THIS packet and briefing only.

Answer quality (required):
- Fully answer what the user asked. Do not give one-line replies when the packet has detail.
- Prefer 1 short lead sentence, then structured bullets or numbered items with the facts.
- Pull every relevant field from the packet — amounts, USD, times, wallets, risk notes, headlines, links, social counts.
- If they ask about news: list each relevant headline with title, source, and the exact https URL.
- If they ask about trades / buys / sells / profit: list the relevant rows and use tradeSummary; clearly say netFlowUsd is window flow, not realized PnL.
- If they ask about risk / liquidity / social: explain using structure, risk.notes, market, and intel fields.
- If they ask about security / honeypot / mint / freeze / GT score: walk security.checks (label, status, detail) and security.summary.
- If they ask about flow / tape / recent buys/sells on the pool: list tape.recent rows and tape.summary; separately list tracked.moves when relevant.
- If they ask about holders / concentration / distribution: use holderMap.summary and holderMap.bands.
- If they ask about momentum / structure / short TF / vol vs liq: use momentum.bias, momentum.windows, momentum.volLiqLabel, momentum.rangeLabel, and momentum.notes.
- If something is missing from the packet, say exactly what is not in this window — then still answer with what IS available.
- Stay research-only. Refuse trade calls ("should I buy"). Never invent numbers, wallets, posts, or URLs.

Length guide: usually 120–350 words when the packet has data. Short only when the packet truly has almost nothing.`;

function briefingPromptFor(packet: NarrativePacket) {
  if (packet.subject.type === "coin") {
    return `Write a thorough coin desk briefing from this packet.

Structure:
- headline: one sharp line naming the symbol and the main story (tracked flow, risk, or market move).
- paragraphs: 2–4 paragraphs. Cover market (price, mcap, 24h, liquidity, volume), momentum bias when present, holderMap concentration when present, security.summary / hard flags when present, tape or tracked desk moves when present, risk notes, and any intel headlines or social heat — only from the packet.
- highlight: optional callout when there is a standout (large tracked buy, headline, or risk flag); otherwise null.
- facts: use exactly the template fact labels from the packet — do not rename them.

Be specific with numbers and wallet labels from tracked.moves. If intel.headlines exist, mention at least one by title (no invented URLs in paragraphs — links are for Ask more).
If tracked.moves is empty, say so clearly.

Packet:
${packetPrompt(packet)}`;
  }

  return `Write a thorough wallet desk briefing from this packet.

Structure:
- headline: one sharp line on what this desk did in the window (or that the feed is quiet / not live).
- paragraphs: 2–4 paragraphs. Cover live vs quiet window (desk.feedLabel / desk.biasLabel), concrete buys/sells from activity, tradeSummary totals, notable holdings (symbol + balance), and overlap with other desks from flows.
- highlight: optional callout for the largest trade or flow overlap; null if nothing stands out.
- facts: use exactly the template fact labels from the packet — do not rename them.

Cite specific trades (side, asset, amount, usd, time). If window.live is false, lead with that — do not describe demo tape as live activity.
If profit is implied, clarify tradeSummary is window flow only, not realized PnL.

Packet:
${packetPrompt(packet)}`;
}

function askMorePromptFor(packet: NarrativePacket, message: string) {
  if (packet.subject.type === "coin") {
    return `User question: ${message}

Write a thorough desk answer for this coin.
Cover every part of the question using market, holders, holderMap.bands, momentum.windows, tracked.moves, tape.recent, risk, security.checks, structure, social, intel.headlines (with URLs), opportunity, and flows when relevant.
Use bullets for lists. Paste exact https URLs from intel.headlines when citing news.`;
  }

  return `User question: ${message}

Write a thorough desk answer for this wallet.
Cover every part of the question using activity (include hash/network when listing trades), tradeSummary, desk (bias / feed), holdings (symbol + balance), flows, and window.live.
List concrete trades (side, asset, amount, usd, time) when relevant.
If profit/PnL is asked, explain using tradeSummary and state it is not realized profit.`;
}

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

async function callBriefingModel(
  modelId: string,
  packet: NarrativePacket,
): Promise<WalletNarrative | null> {
  const or = openrouter();
  const result = await generateText({
    model: or(modelId),
    output: Output.object({ schema: briefingSchema }),
    system: systemForPacket(packet),
    prompt: briefingPromptFor(packet),
    maxOutputTokens: 1400,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const parsed = briefingSchema.safeParse(result.output);
  if (!parsed.success) return null;
  return asBriefing(parsed.data, packet);
}

export async function writeWalletBriefing(
  packet: NarrativePacket,
): Promise<{ briefing: WalletNarrative; origin: "llm" | "template" }> {
  for (const modelId of [MODEL_PRIMARY, MODEL_FALLBACK]) {
    try {
      const briefing = await callBriefingModel(modelId, packet);
      if (briefing) return { briefing, origin: "llm" };
    } catch {
      // try next model
    }
  }
  return { briefing: packet.template, origin: "template" };
}

export async function streamAskMore(input: {
  packet: NarrativePacket;
  briefing: WalletNarrative;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
}) {
  const or = openrouter();
  const prior = input.history.map((row) => ({
    role: row.role,
    content: row.content,
  }));

  const system = `${systemForPacket(input.packet)}

${ASK_MORE_SYSTEM}

Packet (source of truth):
${packetPrompt(input.packet)}

Briefing already shown to the user:
${JSON.stringify({
  headline: input.briefing.headline,
  paragraphs: input.briefing.paragraphs,
  sources: input.briefing.sources,
})}`;

  const messages = [
    ...prior,
    {
      role: "user" as const,
      content: askMorePromptFor(input.packet, input.message),
    },
  ];

  // Prefer primary; fall back only if constructing the stream fails immediately.
  try {
    return streamText({
      model: or(MODEL_PRIMARY),
      system,
      messages,
      maxOutputTokens: 1600,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return streamText({
      model: or(MODEL_FALLBACK),
      system,
      messages,
      maxOutputTokens: 1600,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}
