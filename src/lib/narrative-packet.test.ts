import assert from "node:assert/strict";
import { briefingDriftedFromPacket, buildWalletPacketFromDossier } from "./narrative-packet";
import type { WalletDossier } from "@/lib/wallet-dossier";

const quiet: WalletDossier = {
  id: "w1",
  label: "Desk Alpha",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  shortAddress: "0x1234…5678",
  chain: "ETH",
  live: false,
  activity: [
    {
      id: "demo-1",
      side: "buy",
      action: "Bought",
      asset: "PEPE",
      amount: "1",
      usd: "$1",
      time: "now",
      date: "Today",
      timeSec: null,
      tokenAddress: null,
      network: "eth",
      screenerHref: null,
    },
  ],
  holdings: [{ id: "h", symbol: "PEPE", name: "Pepe", balanceLabel: "1", tokenAddress: null, network: "eth", screenerHref: null }],
  buysCount: 4,
  sellsCount: 1,
  note: null,
};

const emptyPacket = buildWalletPacketFromDossier({
  walletId: "w1",
  dossier: quiet,
  clusters: [],
});

assert.equal(emptyPacket.window.live, false);
assert.equal(emptyPacket.window.note, "empty");
assert.equal(emptyPacket.activity.length, 0);
assert.equal(emptyPacket.holdings.length, 0);
assert.equal(emptyPacket.counts.buys, 0);
assert.equal(emptyPacket.tradeSummary.buysUsd, "—");
assert.equal(emptyPacket.tradeSummary.sellsUsd, "—");
assert.equal(emptyPacket.desk.bias, "quiet");
assert.equal(emptyPacket.desk.buysCount, 0);

const live: WalletDossier = {
  ...quiet,
  live: true,
  buysCount: 2,
  sellsCount: 0,
  activity: [
    {
      id: "a1",
      side: "buy",
      action: "Bought",
      asset: "LINK",
      amount: "12",
      usd: "$18,000",
      time: "10:00",
      date: "Today",
      timeSec: null,
      hash: "0xabc",
      tokenAddress: null,
      network: "eth",
      screenerHref: null,
    },
  ],
  holdings: [],
};

const livePacket = buildWalletPacketFromDossier({
  walletId: "w1",
  dossier: live,
  clusters: [],
});

assert.equal(livePacket.window.note, "alchemy");
assert.equal(livePacket.activity[0]?.asset, "LINK");
assert.equal(livePacket.tradeSummary.buysUsd, "$18,000");
assert.equal(livePacket.tradeSummary.topBuys[0]?.asset, "LINK");
assert.match(livePacket.tradeSummary.note, /Not realized profit/);
assert.equal(livePacket.desk.bias, "accumulating");
assert.equal(livePacket.desk.buysCount, 2);
assert.equal(
  briefingDriftedFromPacket(
    { headline: "Desk Alpha bought LINK", paragraphs: ["Two buys in LINK."], highlight: null },
    livePacket,
  ),
  false,
);
assert.equal(
  briefingDriftedFromPacket(
    { headline: "They loaded PEPE", paragraphs: ["Huge PEPE print."], highlight: null },
    livePacket,
  ),
  true,
);

console.log("narrative-packet tests passed");
