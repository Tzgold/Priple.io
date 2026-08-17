import type { PulseItem } from "@/lib/alchemy-pulse";

export type FlowWalletMove = {
  id: string;
  walletLabel: string;
  walletAddress: string;
  action: string;
  type: PulseItem["type"];
  amount: string;
  usd: string;
  time: string;
  date: string;
  network: string;
  tokenAddress: string | null;
  asset: string;
  timestamp: number;
};

export type FlowCluster = {
  id: string;
  asset: string;
  symbol: string;
  networks: string[];
  walletCount: number;
  moves: FlowWalletMove[];
  leader: FlowWalletMove | null;
  followers: FlowWalletMove[];
  windowMinutes: number | null;
  confidence: number;
  kind: "overlap" | "cross-chain";
  summary: string;
};

export type FlowsSnapshot = {
  clusters: FlowCluster[];
  crossChain: FlowCluster[];
  generatedAt: string;
};

function pulseTimestamp(item: PulseItem): number {
  let dateStr = item.date;
  const now = new Date();
  if (dateStr === "Today") {
    dateStr = now.toISOString().slice(0, 10);
  } else if (dateStr === "Yesterday") {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - 1);
    dateStr = d.toISOString().slice(0, 10);
  }

  const match = item.time.match(/(\d{2}):(\d{2})/);
  if (!match) return Date.parse(`${dateStr}T12:00:00Z`) || 0;
  return Date.parse(`${dateStr}T${match[1]}:${match[2]}:00Z`) || 0;
}

function toMove(item: PulseItem): FlowWalletMove {
  return {
    id: item.id,
    walletLabel: item.walletLabel,
    walletAddress: item.walletAddress,
    action: item.action,
    type: item.type,
    amount: item.amount,
    usd: item.usd,
    time: item.time,
    date: item.date,
    network: item.network || "eth",
    tokenAddress: item.tokenAddress ?? null,
    asset: item.asset,
    timestamp: pulseTimestamp(item),
  };
}

function clusterKey(item: PulseItem) {
  const network = item.network || "eth";
  if (item.tokenAddress) {
    return `token:${network}:${item.tokenAddress.toLowerCase()}`;
  }
  return `sym:${item.asset.toUpperCase()}`;
}

function clusterConfidence(input: {
  walletCount: number;
  windowMinutes: number | null;
  crossChain: boolean;
}) {
  let score = 42;
  if (input.walletCount >= 2) score += 18;
  if (input.walletCount >= 3) score += 14;
  if (input.windowMinutes != null && input.windowMinutes <= 45) score += 16;
  else if (input.windowMinutes != null && input.windowMinutes <= 120) score += 8;
  if (input.crossChain) score += 10;
  return Math.min(96, score);
}

function buildCluster(id: string, symbol: string, moves: FlowWalletMove[]): FlowCluster {
  const sorted = [...moves].sort((a, b) => a.timestamp - b.timestamp);
  const leader = sorted[0] ?? null;
  const followers = leader ? sorted.slice(1) : [];
  const networks = Array.from(new Set(sorted.map((m) => m.network)));
  const crossChain = networks.length > 1;
  const walletCount = new Set(sorted.map((m) => m.walletAddress || m.walletLabel)).size;

  let windowMinutes: number | null = null;
  if (leader && followers.length > 0) {
    const last = followers[followers.length - 1];
    const deltaMs = last.timestamp - leader.timestamp;
    if (deltaMs >= 0) windowMinutes = Math.max(1, Math.round(deltaMs / 60_000));
  }

  const confidence = clusterConfidence({ walletCount, windowMinutes, crossChain });

  let summary: string;
  if (crossChain && leader) {
    summary = `${walletCount} wallets converged on ${symbol} across ${networks.join(", ")} — ${leader.walletLabel} moved first.`;
  } else if (leader && followers.length > 0) {
    summary = `${leader.walletLabel} entered first; ${followers.length} related wallet${followers.length === 1 ? "" : "s"} followed within ${windowMinutes ?? "?"}m on ${symbol}.`;
  } else {
    summary = `${walletCount} wallets touched ${symbol} in the same window.`;
  }

  return {
    id,
    asset: symbol,
    symbol,
    networks,
    walletCount,
    moves: sorted,
    leader,
    followers,
    windowMinutes,
    confidence,
    kind: crossChain ? "cross-chain" : "overlap",
    summary,
  };
}

/** Detect wallet overlap / cross-chain convergence from pulse rows. */
export function buildFlowsFromPulse(items: PulseItem[]): FlowsSnapshot {
  const buys = items.filter((item) => item.type === "buy" || item.action === "Received");
  const groups = new Map<string, FlowWalletMove[]>();

  for (const item of buys) {
    const key = clusterKey(item);
    const bucket = groups.get(key) ?? [];
    bucket.push(toMove(item));
    groups.set(key, bucket);
  }

  const clusters: FlowCluster[] = [];

  for (const [key, moves] of groups) {
    const wallets = new Set(moves.map((m) => m.walletAddress || m.walletLabel));
    if (wallets.size < 2) continue;

    const symbol = moves[0]?.asset.toUpperCase() || "???";
    clusters.push(buildCluster(key, symbol, moves));
  }

  clusters.sort((a, b) => b.confidence - a.confidence || b.walletCount - a.walletCount);

  return {
    clusters,
    crossChain: clusters.filter((c) => c.kind === "cross-chain"),
    generatedAt: new Date().toISOString(),
  };
}

export type FlowFilter = {
  symbol?: string | null;
  network?: string | null;
  address?: string | null;
};

export function filterFlows(snapshot: FlowsSnapshot, filter?: FlowFilter): FlowsSnapshot {
  if (!filter?.symbol && !filter?.address) return snapshot;

  const sym = filter.symbol?.toUpperCase();
  const addr = filter.address?.toLowerCase();
  const network = filter.network?.toLowerCase();

  const matchCluster = (cluster: FlowCluster) => {
    if (sym && cluster.symbol.toUpperCase() === sym) return true;
    if (!addr) return false;
    return cluster.moves.some(
      (m) =>
        m.tokenAddress?.toLowerCase() === addr &&
        (!network || m.network.toLowerCase() === network),
    );
  };

  const clusters = snapshot.clusters.filter(matchCluster);
  return {
    ...snapshot,
    clusters,
    crossChain: clusters.filter((c) => c.kind === "cross-chain"),
  };
}
