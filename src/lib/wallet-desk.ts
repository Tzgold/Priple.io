import type { FlowCluster } from "@/lib/flows";
import { clustersForWallet } from "@/lib/wallet-narrative";
import type { WalletActivityItem, WalletDossier } from "@/lib/wallet-dossier";

export type WalletDeskBias = "accumulating" | "distributing" | "mixed" | "quiet";

export type WalletDeskTradeRow = {
  asset: string;
  amount: string;
  usd: string;
  time: string;
  date: string;
  network: string;
};

export type WalletDeskBrief = {
  live: boolean;
  feedLabel: string;
  feedNote: string;
  bias: WalletDeskBias;
  biasLabel: string;
  buysCount: number;
  sellsCount: number;
  assetsTouched: number;
  networksTouched: number;
  trade: {
    buysUsd: string;
    sellsUsd: string;
    netFlowUsd: string;
    note: string;
    topBuys: WalletDeskTradeRow[];
    topSells: WalletDeskTradeRow[];
  };
  holdings: {
    count: number;
    top: Array<{ symbol: string; balance: string; network: string }>;
    note: string;
  };
  overlap: {
    count: number;
    rows: Array<{
      symbol: string;
      walletCount: number;
      led: boolean;
      leaderLabel: string | null;
    }>;
    note: string;
  };
};

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

function biasFromCounts(buys: number, sells: number): WalletDeskBias {
  if (buys === 0 && sells === 0) return "quiet";
  if (buys > sells * 1.5) return "accumulating";
  if (sells > buys * 1.5) return "distributing";
  return "mixed";
}

function biasLabel(bias: WalletDeskBias) {
  if (bias === "accumulating") return "Accumulating";
  if (bias === "distributing") return "Distributing";
  if (bias === "mixed") return "Mixed flow";
  return "Quiet window";
}

function toTradeRows(rows: WalletActivityItem[], side: "buy" | "sell", limit = 5) {
  return rows
    .filter((row) => row.side === side)
    .map((row) => ({
      asset: row.asset,
      amount: row.amount,
      usd: row.usd,
      time: row.time,
      date: row.date,
      network: row.network || "eth",
      rank: parseUsdLabel(row.usd) ?? 0,
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map(({ rank: _rank, ...rest }) => rest);
}

/** Grounded wallet desk brief — mirrors coin analysis clarity for Ask Priple + UI. */
export function buildWalletDeskBrief(
  dossier: WalletDossier,
  clusters: FlowCluster[] = [],
): WalletDeskBrief {
  const liveActivity = dossier.live ? dossier.activity : [];
  const liveHoldings = dossier.live ? dossier.holdings : [];

  let buysUsd = 0;
  let sellsUsd = 0;
  let buyKnown = false;
  let sellKnown = false;
  for (const row of liveActivity) {
    const usd = parseUsdLabel(row.usd);
    if (row.side === "buy") {
      if (usd != null) {
        buysUsd += usd;
        buyKnown = true;
      }
    } else if (usd != null) {
      sellsUsd += usd;
      sellKnown = true;
    }
  }

  const assets = new Set(liveActivity.map((row) => row.asset.toUpperCase()));
  const networks = new Set(
    [
      ...liveActivity.map((row) => row.network),
      ...liveHoldings.map((row) => row.network),
    ].filter(Boolean),
  );

  const related = clustersForWallet(clusters, dossier.address, dossier.label);
  const bias = biasFromCounts(
    dossier.live ? dossier.buysCount : 0,
    dossier.live ? dossier.sellsCount : 0,
  );

  return {
    live: Boolean(dossier.live),
    feedLabel: dossier.live ? "Live Alchemy feed" : "Quiet / not live",
    feedNote: dossier.live
      ? "Transfers in this window come from Alchemy — not a prediction."
      : dossier.note ||
        "This window is not a live personal feed (quiet or unsupported network). Demo tape is not shown as live activity.",
    bias,
    biasLabel: biasLabel(bias),
    buysCount: dossier.live ? dossier.buysCount : 0,
    sellsCount: dossier.live ? dossier.sellsCount : 0,
    assetsTouched: assets.size,
    networksTouched: networks.size,
    trade: {
      buysUsd: buyKnown ? formatUsdTotal(buysUsd) : "—",
      sellsUsd: sellKnown ? formatUsdTotal(sellsUsd) : "—",
      netFlowUsd: buyKnown || sellKnown ? formatUsdTotal(sellsUsd - buysUsd) : "—",
      note: "Window flow only (sell USD − buy USD). Not realized profit — cost basis is not in this desk.",
      topBuys: toTradeRows(liveActivity, "buy"),
      topSells: toTradeRows(liveActivity, "sell"),
    },
    holdings: {
      count: liveHoldings.length,
      top: liveHoldings.slice(0, 8).map((row) => ({
        symbol: row.symbol,
        balance: row.balanceLabel,
        network: row.network || "eth",
      })),
      note: dossier.live
        ? liveHoldings.length > 0
          ? "Holdings are a snapshot, not cost basis or PnL."
          : "No holdings returned in this live snapshot."
        : "Holdings hidden until the feed is live for this chain.",
    },
    overlap: {
      count: related.length,
      rows: related.slice(0, 6).map((cluster) => ({
        symbol: cluster.symbol,
        walletCount: cluster.walletCount,
        led: cluster.leader?.walletLabel === dossier.label,
        leaderLabel: cluster.leader?.walletLabel ?? null,
      })),
      note:
        related.length > 0
          ? "Overlap clusters from personal pulse — who moved the same assets."
          : "No overlap clusters with other desks in this pulse window.",
    },
  };
}
