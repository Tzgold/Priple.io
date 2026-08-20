import type { FlowCluster } from "@/lib/flows";
import type { CoinAnalysis } from "@/lib/coin-analysis";
import type { PulseItem } from "@/lib/alchemy-pulse";
import { buildCoinNarrativeTemplate } from "@/lib/coin-narrative";
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

export type WalletTradeSummary = {
  /** Window buys / sells only — not lifetime PnL. */
  buysUsd: string;
  sellsUsd: string;
  netFlowUsd: string;
  note: string;
  topBuys: Array<{ asset: string; amount: string; usd: string }>;
  topSells: Array<{ asset: string; amount: string; usd: string }>;
};

export type WalletNarrativePacket = {
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
  tradeSummary: WalletTradeSummary;
  activity: NarrativePacketActivity[];
  holdings: Array<{ symbol: string; network: string; balance: string }>;
  flows: Array<{
    symbol: string;
    walletCount: number;
    led: boolean;
    leaderLabel: string | null;
  }>;
  sources: string[];
  template: WalletNarrative;
};

export type CoinNarrativePacket = {
  subject: {
    type: "coin";
    network: string;
    address: string;
    symbol: string;
    name: string;
  };
  window: {
    generatedAt: string;
    trackedWalletMoves: number;
  };
  market: {
    price: string;
    mcap: string;
    change24h: string;
    liquidity: string;
    volume24h: string;
    depth: string | null;
  };
  holders: {
    count: string;
    top10: string;
    next20: string;
  };
  holderMap: {
    level: string;
    summary: string;
    countLabel: string;
    lastUpdated: string | null;
    bands: Array<{
      id: string;
      label: string;
      pctLabel: string;
      pct: number | null;
      detail: string;
      tone: string;
    }>;
  };
  tracked: {
    whyHere: string | null;
    walletBuys: number;
    moves: Array<{
      walletLabel: string;
      side: "buy" | "sell";
      amount: string;
      usd: string;
      time: string;
      date: string;
    }>;
  };
  tape: {
    poolName: string | null;
    summary: string;
    buys: number;
    sells: number;
    volumeUsd: string;
    recent: Array<{
      side: string;
      usd: string;
      time: string;
      trader: string | null;
    }>;
  };
  structure: {
    liquidityNote: string;
    volumeNote: string;
    holderNote: string;
  };
  risk: {
    level: string;
    notes: string[];
  };
  security: {
    level: string;
    summary: string;
    gtScore: string;
    checks: Array<{
      id: string;
      label: string;
      status: string;
      detail: string;
    }>;
  };
  social: {
    websites: string[];
    twitter: string | null;
    telegram: string | null;
    discord: string | null;
    description: string | null;
  };
  intel: {
    heatLabel: string;
    heat: number | null;
    twitterFollowers: number | null;
    redditSubscribers: number | null;
    telegramUsers: number | null;
    sentimentUpPct: number | null;
    pulse: string[];
    headlines: Array<{
      title: string;
      source: string;
      url: string;
      publishedAt: string;
    }>;
  } | null;
  opportunity: {
    score: number;
    label: string;
    reasons: string[];
  } | null;
  flows: Array<{
    symbol: string;
    walletCount: number;
    leaderLabel: string | null;
  }>;
  sources: string[];
  template: WalletNarrative;
};

export type NarrativePacket = WalletNarrativePacket | CoinNarrativePacket;

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

/** Parse labels like "$1,234", "$1.2M", "$—" into a number or null. */
function parseUsdLabel(value: string): number | null {
  const raw = value.trim();
  if (!raw || raw === "—" || raw === "-") return null;
  const cleaned = raw.replace(/[$,\s]/g, "");
  const match = cleaned.match(/^(-?[\d.]+)([KMB])?$/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const unit = (match[2] || "").toUpperCase();
  const mult = unit === "K" ? 1_000 : unit === "M" ? 1_000_000 : unit === "B" ? 1_000_000_000 : 1;
  return base * mult;
}

function formatUsdTotal(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
  return `${sign}$${abs.toFixed(2)}`;
}

function buildWalletTradeSummary(
  activity: NarrativePacketActivity[],
): WalletTradeSummary {
  let buys = 0;
  let sells = 0;
  let buyKnown = false;
  let sellKnown = false;
  const buysList: Array<{ asset: string; amount: string; usd: string; rank: number }> = [];
  const sellsList: Array<{ asset: string; amount: string; usd: string; rank: number }> = [];

  for (const row of activity) {
    const usd = parseUsdLabel(row.usd);
    if (row.side === "buy") {
      if (usd != null) {
        buys += usd;
        buyKnown = true;
      }
      buysList.push({ asset: row.asset, amount: row.amount, usd: row.usd, rank: usd ?? 0 });
    } else {
      if (usd != null) {
        sells += usd;
        sellKnown = true;
      }
      sellsList.push({ asset: row.asset, amount: row.amount, usd: row.usd, rank: usd ?? 0 });
    }
  }

  buysList.sort((a, b) => b.rank - a.rank);
  sellsList.sort((a, b) => b.rank - a.rank);

  return {
    buysUsd: buyKnown ? formatUsdTotal(buys) : "—",
    sellsUsd: sellKnown ? formatUsdTotal(sells) : "—",
    netFlowUsd:
      buyKnown || sellKnown ? formatUsdTotal(sells - buys) : "—",
    note:
      "Window flow only (sell USD − buy USD). Not realized profit — cost basis and open holdings are not in this packet.",
    topBuys: buysList.slice(0, 5).map(({ asset, amount, usd }) => ({ asset, amount, usd })),
    topSells: sellsList.slice(0, 5).map(({ asset, amount, usd }) => ({ asset, amount, usd })),
  };
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
}): WalletNarrativePacket {
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
    balance: clip(row.balanceLabel, 32),
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
    tradeSummary: buildWalletTradeSummary(activity),
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

export function buildCoinPacketFromAnalysis(input: {
  analysis: CoinAnalysis;
  trackedMoves: PulseItem[];
  clusters: FlowCluster[];
}): CoinNarrativePacket {
  const { analysis } = input;
  const personalMoves = input.trackedMoves.filter((item) => item.source === "personal");
  const walletLabels = new Set(personalMoves.map((item) => item.walletLabel));

  const template = buildCoinNarrativeTemplate(analysis, walletLabels.size);

  const moves = personalMoves.slice(0, 24).map((item) => ({
    walletLabel: clip(item.walletLabel, 64),
    side: (item.type === "sell" ? "sell" : "buy") as "buy" | "sell",
    amount: clip(item.amount, 32),
    usd: clip(item.usd, 32),
    time: clip(item.time, 24),
    date: clip(item.date, 24),
  }));

  const symbolFlows = input.clusters
    .filter((cluster) => cluster.symbol.toUpperCase() === analysis.symbol.toUpperCase())
    .slice(0, 8);

  return {
    subject: {
      type: "coin",
      network: clip(analysis.network, 32),
      address: clip(analysis.address, 80),
      symbol: clip(analysis.symbol, 24),
      name: clip(analysis.name, 64),
    },
    window: {
      generatedAt: new Date().toISOString(),
      trackedWalletMoves: moves.length,
    },
    market: {
      price: clip(analysis.market.priceLabel, 32),
      mcap: clip(analysis.market.mcapLabel, 32),
      change24h: clip(analysis.market.change24hLabel, 24),
      liquidity: clip(analysis.market.liquidityLabel, 32),
      volume24h: clip(analysis.market.volumeLabel, 32),
      depth: analysis.market.depthLabel ? clip(analysis.market.depthLabel, 32) : null,
    },
    holders: {
      count: clip(analysis.holders.countLabel, 24),
      top10: clip(analysis.holders.top10Label, 24),
      next20: clip(analysis.holders.next20Label, 24),
    },
    holderMap: {
      level: analysis.holderMap.level,
      summary: clip(analysis.holderMap.summary, 320),
      countLabel: clip(analysis.holderMap.countLabel, 32),
      lastUpdated: analysis.holderMap.lastUpdated
        ? clip(analysis.holderMap.lastUpdated, 40)
        : null,
      bands: analysis.holderMap.bands.slice(0, 6).map((band) => ({
        id: clip(band.id, 24),
        label: clip(band.label, 48),
        pctLabel: clip(band.pctLabel, 16),
        pct: band.pct,
        detail: clip(band.detail, 240),
        tone: clip(band.tone, 16),
      })),
    },
    tracked: {
      whyHere: analysis.whyHere ? clip(analysis.whyHere, 400) : null,
      walletBuys: walletLabels.size,
      moves:
        analysis.flow.tracked.length > 0
          ? analysis.flow.tracked.slice(0, 24).map((item) => ({
              walletLabel: clip(item.walletLabel, 64),
              side: item.side,
              amount: clip(item.amount, 32),
              usd: clip(item.usd, 32),
              time: clip(item.time, 24),
              date: clip(item.date, 24),
            }))
          : moves,
    },
    tape: {
      poolName: analysis.flow.poolName ? clip(analysis.flow.poolName, 80) : null,
      summary: clip(analysis.flow.summary, 320),
      buys: analysis.flow.buys,
      sells: analysis.flow.sells,
      volumeUsd: clip(analysis.flow.volumeUsdLabel, 32),
      recent: analysis.flow.recent.slice(0, 16).map((row) => ({
        side: clip(row.side, 16),
        usd: clip(row.usd, 32),
        time: clip(row.time, 24),
        trader: row.trader ? clip(row.trader, 32) : null,
      })),
    },
    structure: {
      liquidityNote: clip(analysis.structure.liquidityNote, 400),
      volumeNote: clip(analysis.structure.volumeNote, 400),
      holderNote: clip(analysis.structure.holderNote, 400),
    },
    risk: {
      level: analysis.risk.level,
      notes: analysis.risk.notes.map((note) => clip(note, 400)).slice(0, 8),
    },
    security: {
      level: analysis.security.level,
      summary: clip(analysis.security.summary, 240),
      gtScore: clip(analysis.security.gtScoreLabel, 24),
      checks: analysis.security.checks.slice(0, 8).map((check) => ({
        id: clip(check.id, 32),
        label: clip(check.label, 48),
        status: clip(check.status, 16),
        detail: clip(check.detail, 240),
      })),
    },
    social: {
      websites: analysis.social.websites.map((url) => clip(url, 240)).slice(0, 4),
      twitter: analysis.social.twitter ? clip(analysis.social.twitter, 64) : null,
      telegram: analysis.social.telegram ? clip(analysis.social.telegram, 64) : null,
      discord: analysis.social.discord ? clip(analysis.social.discord, 120) : null,
      description: analysis.social.description
        ? clip(analysis.social.description, 400)
        : null,
    },
    intel: analysis.intel
      ? {
          heatLabel: analysis.intel.social.heatLabel,
          heat: analysis.intel.social.heat,
          twitterFollowers: analysis.intel.social.twitterFollowers,
          redditSubscribers: analysis.intel.social.redditSubscribers,
          telegramUsers: analysis.intel.social.telegramUsers,
          sentimentUpPct: analysis.intel.social.sentimentUpPct,
          pulse: analysis.intel.pulse.map((line) => clip(line, 400)).slice(0, 6),
          headlines: analysis.intel.headlines.slice(0, 8).map((row) => ({
            title: clip(row.title, 160),
            source: clip(row.source, 64),
            url: clip(row.url, 240),
            publishedAt: clip(row.publishedAt, 40),
          })),
        }
      : null,
    opportunity: analysis.opportunity
      ? {
          score: analysis.opportunity.total,
          label: clip(analysis.opportunity.headline, 80),
          reasons: analysis.opportunity.dimensions
            .map((dim) => clip(`${dim.label}: ${dim.detail}`, 200))
            .slice(0, 5),
        }
      : null,
    flows: symbolFlows.map((cluster) => ({
      symbol: clip(cluster.symbol, 24),
      walletCount: cluster.walletCount,
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

  if (packet.subject.type === "wallet") {
    const walletPacket = packet as WalletNarrativePacket;
    for (const row of walletPacket.activity) allowed.add(row.asset.toUpperCase());
    for (const row of walletPacket.holdings) allowed.add(row.symbol.toUpperCase());
    for (const part of walletPacket.subject.label.toUpperCase().split(/[^A-Z0-9]+/)) {
      if (part.length >= 2 && part.length <= 10) allowed.add(part);
    }
  } else {
    const coinPacket = packet as CoinNarrativePacket;
    allowed.add(coinPacket.subject.symbol.toUpperCase());
    for (const row of coinPacket.tracked.moves) {
      const label = row.walletLabel.toUpperCase().split(/\s+/)[0] ?? "";
      if (label.length >= 2) allowed.add(label);
    }
  }

  for (const row of packet.flows) allowed.add(row.symbol.toUpperCase());
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
