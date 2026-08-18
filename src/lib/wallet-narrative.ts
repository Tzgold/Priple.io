import type { PulseItem } from "@/lib/alchemy-pulse";
import type { FlowCluster } from "@/lib/flows";
import type { WalletDossier } from "@/lib/wallet-dossier";

export type NarrativeFact = {
  label: string;
  value: string;
  tone?: "up" | "down" | "neutral";
};

export type WalletNarrative = {
  headline: string;
  paragraphs: string[];
  highlight: { title: string; body: string } | null;
  facts: NarrativeFact[];
  sources: string[];
  generatedAt: string;
};

function uniqueAssets(dossier: WalletDossier) {
  return Array.from(new Set(dossier.activity.map((row) => row.asset.toUpperCase())));
}

function uniqueNetworks(dossier: WalletDossier) {
  const fromActivity = dossier.activity.map((row) => row.network);
  const fromHoldings = dossier.holdings.map((row) => row.network);
  return Array.from(new Set([...fromActivity, ...fromHoldings].filter(Boolean)));
}

function topAssets(dossier: WalletDossier, limit = 3) {
  const counts = new Map<string, { buys: number; sells: number }>();
  for (const row of dossier.activity) {
    const key = row.asset.toUpperCase();
    const current = counts.get(key) ?? { buys: 0, sells: 0 };
    if (row.side === "buy") current.buys += 1;
    else current.sells += 1;
    counts.set(key, current);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].buys + b[1].sells - (a[1].buys + a[1].sells))
    .slice(0, limit)
    .map(([asset, counts]) => ({ asset, ...counts }));
}

function clustersForWallet(clusters: FlowCluster[], address: string, label: string) {
  const addr = address.toLowerCase();
  const usableAddress = addr.length >= 8 && !addr.includes("…");
  return clusters.filter((cluster) =>
    cluster.moves.some((move) => {
      if (usableAddress && move.walletAddress) {
        return move.walletAddress.toLowerCase() === addr;
      }
      return !usableAddress && move.walletLabel === label;
    }),
  );
}

function biasLabel(buys: number, sells: number) {
  if (buys === 0 && sells === 0) return "quiet";
  if (buys > sells * 1.5) return "accumulating";
  if (sells > buys * 1.5) return "distributing";
  return "mixed";
}

/** Rules-based briefing — every sentence maps to dossier / flow facts. */
export function buildWalletNarrative(
  dossier: WalletDossier,
  clusters: FlowCluster[] = [],
): WalletNarrative {
  const assets = uniqueAssets(dossier);
  const networks = uniqueNetworks(dossier);
  const tops = topAssets(dossier);
  const bias = biasLabel(dossier.buysCount, dossier.sellsCount);
  const related = clustersForWallet(clusters, dossier.address, dossier.label);
  const sources = [
    dossier.live ? "Alchemy transfers" : "Demo pulse",
    ...(dossier.holdings.length > 0 ? ["Holdings snapshot"] : []),
  ];
  if (related.length > 0) sources.push("Wallet overlap (Flows)");

  const paragraphs: string[] = [];

  if (dossier.activity.length === 0) {
    paragraphs.push(
      dossier.holdings.length > 0
        ? `${dossier.label} has no recent transfers in this window. Holdings shown: ${dossier.holdings.length}.`
        : `${dossier.label} has no recent transfers in this window.`,
    );
  } else {
    paragraphs.push(
      `${dossier.label} looks ${bias} in the latest window: ${dossier.buysCount} buy${dossier.buysCount === 1 ? "" : "s"} and ${dossier.sellsCount} sell${dossier.sellsCount === 1 ? "" : "s"} across ${assets.length} asset${assets.length === 1 ? "" : "s"}${networks.length > 1 ? ` on ${networks.join(", ")}` : ""}.`,
    );

    if (tops[0]) {
      const lead = tops[0];
      paragraphs.push(
        `Most activity concentrated in ${lead.asset} (${lead.buys} buy${lead.buys === 1 ? "" : "s"}, ${lead.sells} sell${lead.sells === 1 ? "" : "s"})${tops.length > 1 ? `, then ${tops.slice(1).map((t) => t.asset).join(" and ")}` : ""}.`,
      );
    }
  }

  if (dossier.holdings.length > 0) {
    const names = dossier.holdings.slice(0, 4).map((h) => h.symbol).join(", ");
    paragraphs.push(
      `Current holdings snapshot includes ${names}${dossier.holdings.length > 4 ? ` +${dossier.holdings.length - 4} more` : ""}.`,
    );
  }

  let highlight: WalletNarrative["highlight"] = null;
  if (related[0]) {
    const cluster = related[0];
    const others = cluster.moves
      .filter((m) => m.walletLabel !== dossier.label)
      .map((m) => m.walletLabel);
    highlight = {
      title: `Overlap on ${cluster.symbol}`,
      body: cluster.leader?.walletLabel === dossier.label
        ? `${dossier.label} moved first on ${cluster.symbol}. ${others.slice(0, 3).join(", ") || "Related desks"} followed${cluster.windowMinutes != null ? ` within ${cluster.windowMinutes}m` : ""}.`
        : `${dossier.label} is in a ${cluster.walletCount}-wallet cluster on ${cluster.symbol}${cluster.leader ? ` — ${cluster.leader.walletLabel} entered first` : ""}.`,
    };
    sources.push("Flows clusters");
  }

  const headline =
    dossier.activity.length === 0
      ? `${dossier.label}: quiet in this window`
      : bias === "accumulating"
        ? `${dossier.label} is accumulating`
        : bias === "distributing"
          ? `${dossier.label} is distributing`
          : `${dossier.label}: mixed tape`;

  const facts: NarrativeFact[] = [
    {
      label: "Buys / sells",
      value: `${dossier.buysCount} / ${dossier.sellsCount}`,
      tone: dossier.buysCount >= dossier.sellsCount ? "up" : "down",
    },
    {
      label: "Assets touched",
      value: String(assets.length || "—"),
      tone: "neutral",
    },
    {
      label: "Networks",
      value: networks.length ? String(networks.length) : "—",
      tone: "neutral",
    },
    {
      label: "Wallet overlap",
      value: related.length ? `${related.length} cluster${related.length === 1 ? "" : "s"}` : "None in window",
      tone: related.length ? "up" : "neutral",
    },
  ];

  return {
    headline,
    paragraphs: paragraphs.slice(0, 4),
    highlight,
    facts,
    sources: Array.from(new Set(sources)),
    generatedAt: new Date().toISOString(),
  };
}

/** Build a thin dossier from pulse rows when the full wallet page isn't open. */
export function dossierFromPulse(
  items: PulseItem[],
  wallet: { id?: string; label: string; address: string; chain?: string },
): WalletDossier | null {
  if (!wallet.label && !wallet.address) return null;
  const addr = (wallet.address || "").toLowerCase();
  const usableAddress = addr.length >= 8 && !addr.includes("…");
  const rows = items.filter((item) => {
    if (usableAddress) {
      return Boolean(item.walletAddress) && item.walletAddress.toLowerCase() === addr;
    }
    return item.walletLabel === wallet.label;
  });

  const activity = rows.map((item) => ({
    id: item.id,
    side: (item.type === "sell" ? "sell" : "buy") as "buy" | "sell",
    action: item.action,
    asset: item.asset,
    amount: item.amount,
    usd: item.usd,
    time: item.time,
    date: item.date,
    timeSec: null,
    hash: item.hash,
    tokenAddress: item.tokenAddress ?? null,
    network: item.network || "eth",
    screenerHref: null,
  }));

  const buysCount = activity.filter((r) => r.side === "buy").length;
  const sellsCount = activity.filter((r) => r.side === "sell").length;

  return {
    id: wallet.id || wallet.address || wallet.label,
    label: wallet.label,
    address: wallet.address || rows[0]?.walletAddress || "",
    shortAddress: wallet.address ? `${wallet.address.slice(0, 6)}…` : wallet.label,
    chain: wallet.chain || "ETH",
    live: rows.some((item) => item.source !== "demo"),
    activity,
    holdings: [],
    buysCount,
    sellsCount,
    note: null,
  };
}
