import assert from "node:assert/strict";
import {
  buildAskMoreResearchPrompt,
  buildResearchEvidence,
  detectAskIntents,
} from "./narrative-research";
import type { WalletNarrativePacket } from "./narrative-packet";
import type { WalletNarrative } from "./wallet-narrative";

assert.deepEqual(detectAskIntents("Any news headlines?", "coin"), ["news"]);
assert.deepEqual(detectAskIntents("Run the security checklist", "coin"), ["security"]);
assert.ok(detectAskIntents("What did this desk buy?", "wallet").includes("trades"));
assert.ok(!detectAskIntents("What did this desk buy?", "wallet").includes("tape"));
assert.deepEqual(detectAskIntents("hello there", "coin"), ["general"]);

const template: WalletNarrative = {
  headline: "Quiet",
  paragraphs: ["Quiet window."],
  highlight: null,
  facts: [
    { label: "Buys / sells", value: "0 / 0" },
    { label: "Assets touched", value: "0" },
    { label: "Networks", value: "0" },
    { label: "Wallet overlap", value: "0" },
  ],
  sources: ["Alchemy"],
  generatedAt: "2026-08-20T12:00:00Z",
};

const quietPacket: WalletNarrativePacket = {
  subject: {
    type: "wallet",
    walletId: "w1",
    label: "Desk Alpha",
    address: "0xabc",
    chain: "ETH",
  },
  window: { live: false, generatedAt: "2026-08-20T12:00:00Z", note: "empty" },
  counts: { buys: 0, sells: 0, assets: 0, networks: 0 },
  tradeSummary: {
    buysUsd: "—",
    sellsUsd: "—",
    netFlowUsd: "—",
    note: "Window flow only.",
    topBuys: [],
    topSells: [],
  },
  desk: {
    bias: "quiet",
    biasLabel: "Quiet window",
    feedLabel: "Quiet / not live",
    feedNote: "Not live.",
    buysCount: 0,
    sellsCount: 0,
    assetsTouched: 0,
    networksTouched: 0,
    holdingsCount: 0,
    overlapCount: 0,
  },
  activity: [],
  holdings: [],
  flows: [],
  sources: ["Alchemy"],
  template,
};

const { intents, evidence } = buildResearchEvidence(quietPacket, "Is this feed live?");
assert.ok(intents.includes("live"));
assert.equal((evidence as { window: { live: boolean } }).window.live, false);

const prompt = buildAskMoreResearchPrompt(quietPacket, "Summarize buys vs sells");
assert.match(prompt, /Required structure/);
assert.match(prompt, /Research brief/);
assert.match(prompt, /Not live|not live|Gap/i);
assert.match(prompt, /trades|general/);

console.log("narrative-research tests passed");
