import type { FlowCluster } from "@/lib/flows";
import {
  buildWalletNarrative,
  clustersForWallet,
  type WalletNarrative,
} from "@/lib/wallet-narrative";
import type { WalletDossier } from "@/lib/wallet-dossier";

export type PacketWindowNote = "alchemy" | "empty";

export type NarrativePacketActivity = {
  side: "buy" | "sell";
  asset: string;
  amount: string;
  usd: string;
  time: string;
  date: string;
  hash?: string;
  network: string;
};

export type NarrativePacket = {
  subject: {
    type: "wallet";
    walletId: string;
    label: string;
    address: string;
    chain: string;
  };
  window: {
    live: boolean;
    generatedAt: string;
    note: PacketWindowNote;
  };
  counts: {
    buys: number;
    sells: number;
    assets: number;
    networks: number;
  };
  activity: NarrativePacketActivity[];
  holdings: Array<{ symbol: string; network: string }>;
  flows: Array<{
    symbol: string;
    walletCount: number;
    led: boolean;
    leaderLabel: string | null;
  }>;
  sources: string[];
  template: WalletNarrative;
};

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

const TICKER_STOP = new Set([
  "THE",
  "AND",
  "FOR",
  "THIS",
  "THAT",
  "FROM",
  "WITH",
  "WINDOW",
  "FEED",
  "LIVE",
  "DEMO",
  "NONE",
  "MORE",
  "THEN",
  "ALSO",
  "NOT",
  "WAS",
  "WERE",
  "HAS",
  "HAD",
  "HAVE",
  "ITS",
  "OWN",
  "NO",
  "ON",
  "IN",
  "OF",
  "TO",
  "OR",
  "VS",
  "USD",
]);

export function buildWalletPacketFromDossier(input: {
  walletId: string;
  dossier: WalletDossier;
  clusters: FlowCluster[];
}): NarrativePacket {
  const { dossier } = input;
  const live = Boolean(dossier.live);
  const template = buildWalletNarrative(dossier, input.clusters);
  const related = clustersForWallet(input.clusters, dossier.address, dossier.label);

  const activity = (live ? dossier.activity : [])
    .filter((row) => row.side === "buy" || row.side === "sell")
    .slice(0, 24)
    .map((row) => ({
      side: row.side,
      asset: clip(row.asset, 24),
      amount: clip(row.amount, 32),
      usd: clip(row.usd, 32),
      time: clip(row.time, 24),
      date: clip(row.date, 24),
      hash: row.hash ? clip(row.hash, 80) : undefined,
      network: clip(row.network || "eth", 32),
    }));

  const holdings = (live ? dossier.holdings : []).slice(0, 12).map((row) => ({
    symbol: clip(row.symbol, 24),
    network: clip(row.network || "eth", 32),
  }));

  const assets = Array.from(new Set(activity.map((row) => row.asset.toUpperCase())));
  const networks = Array.from(
    new Set(
      [
        ...activity.map((row) => row.network),
        ...holdings.map((row) => row.network),
      ].filter(Boolean),
    ),
  );

  return {
    subject: {
      type: "wallet",
      walletId: clip(input.walletId, 80),
      label: clip(dossier.label, 64),
      address: clip(dossier.address, 80),
      chain: clip(dossier.chain, 24),
    },
    window: {
      live,
      generatedAt: new Date().toISOString(),
      note: live ? "alchemy" : "empty",
    },
    counts: {
      buys: live ? dossier.buysCount : 0,
      sells: live ? dossier.sellsCount : 0,
      assets: assets.length,
      networks: networks.length,
    },
    activity,
    holdings,
    flows: related.slice(0, 8).map((cluster) => ({
      symbol: clip(cluster.symbol, 24),
      walletCount: cluster.walletCount,
      led: cluster.leader?.walletLabel === dossier.label,
      leaderLabel: cluster.leader ? clip(cluster.leader.walletLabel, 64) : null,
    })),
    sources: template.sources,
    template: {
      ...template,
      headline: clip(template.headline, 160),
      paragraphs: template.paragraphs.map((line) => clip(line, 400)),
    },
  };
}

export function allowedPacketSymbols(packet: NarrativePacket) {
  const allowed = new Set<string>();
  for (const row of packet.activity) allowed.add(row.asset.toUpperCase());
  for (const row of packet.holdings) allowed.add(row.symbol.toUpperCase());
  for (const row of packet.flows) allowed.add(row.symbol.toUpperCase());
  for (const part of packet.subject.label.toUpperCase().split(/[^A-Z0-9]+/)) {
    if (part.length >= 2 && part.length <= 10) allowed.add(part);
  }
  return allowed;
}

/** True when LLM prose names a ticker that is not in the packet. */
export function briefingDriftedFromPacket(
  briefing: Pick<WalletNarrative, "headline" | "paragraphs" | "highlight">,
  packet: NarrativePacket,
) {
  const allowed = allowedPacketSymbols(packet);
  const blob = [
    briefing.headline,
    ...briefing.paragraphs,
    briefing.highlight?.title ?? "",
    briefing.highlight?.body ?? "",
  ].join(" ");

  const tickers = blob.match(/\b[A-Z]{2,10}\b/g) ?? [];
  for (const ticker of tickers) {
    if (TICKER_STOP.has(ticker)) continue;
    if (allowed.has(ticker)) continue;
    return true;
  }
  return false;
}
