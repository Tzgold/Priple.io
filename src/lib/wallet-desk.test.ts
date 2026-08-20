import assert from "node:assert/strict";
import { buildWalletDeskBrief } from "./wallet-desk";
import type { WalletDossier } from "./wallet-dossier";

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
  holdings: [
    {
      id: "h",
      symbol: "PEPE",
      name: "Pepe",
      balanceLabel: "1",
      tokenAddress: null,
      network: "eth",
      screenerHref: null,
    },
  ],
  buysCount: 4,
  sellsCount: 1,
  note: "Quiet on this chain.",
};

const quietDesk = buildWalletDeskBrief(quiet, []);
assert.equal(quietDesk.live, false);
assert.equal(quietDesk.bias, "quiet");
assert.equal(quietDesk.buysCount, 0);
assert.equal(quietDesk.trade.topBuys.length, 0);
assert.equal(quietDesk.holdings.count, 0);
assert.match(quietDesk.feedNote, /Quiet on this chain|not a live/i);

const live: WalletDossier = {
  ...quiet,
  live: true,
  note: null,
  buysCount: 2,
  sellsCount: 1,
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
    {
      id: "a2",
      side: "sell",
      action: "Sold",
      asset: "UNI",
      amount: "40",
      usd: "$4,000",
      time: "11:00",
      date: "Today",
      timeSec: null,
      tokenAddress: null,
      network: "eth",
      screenerHref: null,
    },
  ],
  holdings: [
    {
      id: "h1",
      symbol: "ETH",
      name: "Ether",
      balanceLabel: "2.4",
      tokenAddress: null,
      network: "eth",
      screenerHref: null,
      native: true,
    },
  ],
};

const liveDesk = buildWalletDeskBrief(live, []);
assert.equal(liveDesk.live, true);
assert.equal(liveDesk.bias, "accumulating");
assert.equal(liveDesk.trade.buysUsd, "$18,000");
assert.equal(liveDesk.trade.sellsUsd, "$4,000");
assert.equal(liveDesk.trade.netFlowUsd, "-$14,000");
assert.equal(liveDesk.trade.topBuys[0]?.asset, "LINK");
assert.equal(liveDesk.holdings.top[0]?.symbol, "ETH");
assert.match(liveDesk.trade.note, /Not realized profit/);

console.log("wallet-desk tests passed");
