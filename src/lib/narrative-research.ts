import type { CoinNarrativePacket, NarrativePacket, WalletNarrativePacket } from "@/lib/narrative-packet";

export type AskIntent =
  | "news"
  | "security"
  | "holders"
  | "momentum"
  | "tape"
  | "tracked"
  | "trades"
  | "holdings"
  | "overlap"
  | "live"
  | "risk"
  | "social"
  | "market"
  | "general";

function isWalletPacket(packet: NarrativePacket): packet is WalletNarrativePacket {
  return packet.subject.type === "wallet";
}

function isCoinPacket(packet: NarrativePacket): packet is CoinNarrativePacket {
  return packet.subject.type === "coin";
}

const INTENT_PATTERNS: Array<{ intent: AskIntent; re: RegExp }> = [
  { intent: "news", re: /\b(news|headline|article|press|story|stories)\b/i },
  { intent: "security", re: /\b(security|honeypot|mint|freeze|gt\s*score|checklist|rug|scam)\b/i },
  { intent: "holders", re: /\b(holder|concentration|distribution|top\s*10|whale\s*share)\b/i },
  { intent: "momentum", re: /\b(momentum|structure|1h|4h|24h|short[- ]?term|vol\s*\/?\s*liq|range)\b/i },
  { intent: "tape", re: /\b(tape|pool\s*print|recent\s*(buy|sell|trade)|flow\s*tape)\b/i },
  { intent: "tracked", re: /\b(tracked|smart\s*money|desk\s*move|who\s*(bought|sold))\b/i },
  { intent: "trades", re: /\b(buy|sell|trade|profit|pnl|p&l|net\s*flow|accumulat|distribut)\b/i },
  { intent: "holdings", re: /\b(holding|balance|portfolio|what\s*(do\s*they|does\s*it)\s*hold)\b/i },
  { intent: "overlap", re: /\b(overlap|cluster|other\s*desk|shared\s*asset)\b/i },
  { intent: "live", re: /\b(live|quiet|alchemy|feed|window)\b/i },
  { intent: "risk", re: /\b(risk|liquidity|thin|depth|danger)\b/i },
  { intent: "social", re: /\b(social|twitter|telegram|discord|reddit|follower|sentiment)\b/i },
  { intent: "market", re: /\b(price|mcap|market\s*cap|volume|24h|change)\b/i },
];

/** Detect grounded research intents from the user question. */
export function detectAskIntents(
  message: string,
  subjectType: "wallet" | "coin",
): AskIntent[] {
  const hits = INTENT_PATTERNS.filter(({ re }) => re.test(message)).map((row) => row.intent);
  const unique = Array.from(new Set(hits));

  if (unique.length === 0) return ["general"];

  // Wallet questions about "flow" / buys map to trades, not pool tape.
  if (subjectType === "wallet") {
    return unique.filter((intent) => intent !== "tape" && intent !== "tracked");
  }
  return unique;
}

function walletEvidence(packet: WalletNarrativePacket, intents: AskIntent[]) {
  const want = new Set(intents);
  const all = want.has("general");
  const brief: Record<string, unknown> = {
    subject: packet.subject,
    window: packet.window,
    desk: packet.desk,
  };

  if (all || want.has("trades") || want.has("live")) {
    brief.tradeSummary = packet.tradeSummary;
    brief.activity = packet.activity.slice(0, 12);
    brief.counts = packet.counts;
  }
  if (all || want.has("holdings")) {
    brief.holdings = packet.holdings;
  }
  if (all || want.has("overlap")) {
    brief.flows = packet.flows;
  }
  return brief;
}

function coinEvidence(packet: CoinNarrativePacket, intents: AskIntent[]) {
  const want = new Set(intents);
  const all = want.has("general");
  const brief: Record<string, unknown> = {
    subject: packet.subject,
    window: packet.window,
    market: packet.market,
    risk: packet.risk,
  };

  if (all || want.has("holders")) brief.holderMap = packet.holderMap;
  if (all || want.has("holders")) brief.holders = packet.holders;
  if (all || want.has("momentum") || want.has("market")) brief.momentum = packet.momentum;
  if (all || want.has("security")) brief.security = packet.security;
  if (all || want.has("tape")) brief.tape = packet.tape;
  if (all || want.has("tracked")) brief.tracked = packet.tracked;
  if (all || want.has("news") || want.has("social")) {
    brief.intel = packet.intel;
    brief.social = packet.social;
  }
  if (all || want.has("risk")) brief.structure = packet.structure;
  return brief;
}

/** Compact evidence slice — only the packet fields that match the question. */
export function buildResearchEvidence(packet: NarrativePacket, message: string) {
  const intents = detectAskIntents(message, packet.subject.type);
  if (isWalletPacket(packet)) {
    return { intents, evidence: walletEvidence(packet, intents) };
  }
  return { intents, evidence: coinEvidence(packet, intents) };
}

function gapsFor(packet: NarrativePacket, intents: AskIntent[]): string[] {
  const gaps: string[] = [];
  if (isWalletPacket(packet)) {
    if (!packet.window.live) {
      gaps.push("Feed is not live in this window — activity/holdings may be empty.");
    }
    if (packet.activity.length === 0 && (intents.includes("trades") || intents.includes("general"))) {
      gaps.push("No live activity rows in this window.");
    }
    if (packet.holdings.length === 0 && intents.includes("holdings")) {
      gaps.push("No holdings snapshot in this window.");
    }
    if (packet.flows.length === 0 && intents.includes("overlap")) {
      gaps.push("No overlap clusters in this pulse window.");
    }
    return gaps;
  }

  if (!isCoinPacket(packet)) return gaps;

  if (packet.intel?.headlines.length === 0 && intents.includes("news")) {
    gaps.push("No intel.headlines in this window.");
  }
  if (packet.tape?.recent.length === 0 && intents.includes("tape")) {
    gaps.push("No recent pool tape rows in this window.");
  }
  if (packet.tracked?.moves.length === 0 && intents.includes("tracked")) {
    gaps.push("No tracked desk moves in this window.");
  }
  if (packet.holderMap?.level === "unknown" && intents.includes("holders")) {
    gaps.push("Holder map is unknown / incomplete in this window.");
  }
  return gaps;
}

/**
 * User prompt for Ask more — forces a research template + scoped evidence.
 * Full packet remains in the system message as source of truth.
 */
export function buildAskMoreResearchPrompt(packet: NarrativePacket, message: string): string {
  const { intents, evidence } = buildResearchEvidence(packet, message);
  const gaps = gapsFor(packet, intents);
  const kind = packet.subject.type === "coin" ? "coin" : "wallet";

  return `User question: ${message}

Detected intents: ${intents.join(", ")}

Write a thorough grounded research answer for this ${kind}.

Required structure:
1) Lead — one direct sentence that answers the question.
2) Evidence — bullets using ONLY facts from Research brief (and the full packet in system if needed). Include concrete numbers, labels, times, and URLs exactly as given.
3) Gaps — if anything the user asked is missing, list it under a short "Not in this window" note (use the gap hints below when true).
4) Links — paste exact https URLs only when present in intel.headlines / social fields.

Rules:
- Prefer bullets over long paragraphs.
- Never invent tickers, USD, wallets, headlines, or URLs.
- Research only — no buy/sell/hold calls.

Research brief (priority fields for this question):
${JSON.stringify(evidence)}

Gap hints:
${gaps.length > 0 ? gaps.map((g) => `- ${g}`).join("\n") : "- None flagged — still say if a specific field is empty."}`;
}
