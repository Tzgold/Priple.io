import { MAJOR_TOKEN_ROUTES, SYMBOL_TO_CG } from "@/lib/token-routes";
import { walletAvatarUrl } from "@/lib/wallet-avatar";

export type WalletActivityItem = {
  id: string;
  side: "buy" | "sell";
  action: string;
  asset: string;
  amount: string;
  usd: string;
  time: string;
  date: string;
  /** Unix seconds for chart markers. */
  timeSec: number | null;
  hash?: string;
  tokenAddress: string | null;
  network: string;
  screenerHref: string | null;
};

export type WalletHolding = {
  id: string;
  symbol: string;
  name: string;
  balanceLabel: string;
  tokenAddress: string | null;
  network: string;
  screenerHref: string | null;
  native?: boolean;
};

export type WalletDossier = {
  id: string;
  label: string;
  address: string;
  shortAddress: string;
  chain: string;
  live: boolean;
  activity: WalletActivityItem[];
  holdings: WalletHolding[];
  buysCount: number;
  sellsCount: number;
  note: string | null;
};

type AlchemyTransfer = {
  uniqueId?: string;
  hash?: string;
  from?: string;
  to?: string;
  value?: number | null;
  asset?: string | null;
  category?: string;
  rawContract?: { address?: string | null; decimal?: string | null };
  metadata?: { blockTimestamp?: string };
};

function alchemyUrl() {
  const explicit = process.env.ALCHEMY_RPC_URL;
  if (explicit) return explicit;
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return null;
  return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
}

async function alchemyRpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const url = alchemyUrl();
  if (!url) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { result?: T; error?: { message?: string } };
  if (payload.error) return null;
  return payload.result ?? null;
}

function formatUsdGuess(value: number | null | undefined, asset: string) {
  if (value == null || Number.isNaN(value)) return "—";
  const approx =
    asset.toUpperCase() === "ETH"
      ? value * 3400
      : asset.toUpperCase() === "USDC" || asset.toUpperCase() === "USDT"
        ? value
        : value;
  if (approx >= 1_000_000) return `$${(approx / 1_000_000).toFixed(2)}M`;
  if (approx >= 1_000) return `$${Math.round(approx).toLocaleString("en-US")}`;
  return `$${approx.toFixed(2)}`;
}

function formatAmount(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  if (value >= 10) return value.toFixed(2);
  if (value >= 0.0001) return value.toFixed(4);
  return value.toPrecision(3);
}

function splitWhen(iso?: string) {
  if (!iso) return { time: "—", date: "—" };
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return {
    time: `${time} UTC`,
    date: date.toISOString().slice(0, 10),
  };
}

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function screenerHrefForAsset(input: {
  asset: string;
  tokenAddress?: string | null;
  network?: string;
}): string | null {
  if (input.tokenAddress) {
    const net = input.network || "eth";
    if (net === "coingecko") {
      return `/app/screener?network=coingecko&address=${encodeURIComponent(input.tokenAddress)}`;
    }
    return `/app/screener?network=${encodeURIComponent(net)}&address=${encodeURIComponent(input.tokenAddress)}`;
  }

  const cg = SYMBOL_TO_CG[input.asset.toUpperCase()];
  if (!cg) return null;
  const route = MAJOR_TOKEN_ROUTES[cg];
  if (!route) return null;
  if ("cg" in route) {
    return `/app/screener?network=coingecko&address=${encodeURIComponent(route.cg)}`;
  }
  return `/app/screener?network=${encodeURIComponent(route.network)}&address=${encodeURIComponent(route.address)}`;
}

async function fetchTransfers(address: string, direction: "from" | "to", maxCount = "0x28") {
  const params: Record<string, unknown> = {
    fromBlock: "0x0",
    toBlock: "latest",
    category: ["external", "erc20"],
    excludeZeroValue: true,
    withMetadata: true,
    maxCount,
    order: "desc",
  };
  if (direction === "from") params.fromAddress = address;
  else params.toAddress = address;

  const result = await alchemyRpc<{ transfers?: AlchemyTransfer[] }>(
    "alchemy_getAssetTransfers",
    [params],
  );
  return result?.transfers ?? [];
}

function transferToActivity(
  transfer: AlchemyTransfer,
  walletAddress: string,
): WalletActivityItem | null {
  const asset = (transfer.asset || "ETH").toUpperCase();
  const value = transfer.value ?? null;
  const isOut = (transfer.from || "").toLowerCase() === walletAddress.toLowerCase();
  const side: "buy" | "sell" = isOut ? "sell" : "buy";
  const when = splitWhen(transfer.metadata?.blockTimestamp);
  const tokenAddress = transfer.rawContract?.address || null;
  const network = "eth";
  const timeSec = transfer.metadata?.blockTimestamp
    ? Math.floor(new Date(transfer.metadata.blockTimestamp).getTime() / 1000)
    : null;

  return {
    id: transfer.uniqueId || transfer.hash || `${walletAddress}-${when.time}-${asset}-${side}`,
    side,
    action: isOut ? "Sold / sent" : "Bought / received",
    asset,
    amount: formatAmount(value),
    usd: formatUsdGuess(value, asset),
    time: when.time,
    date: when.date,
    timeSec,
    hash: transfer.hash,
    tokenAddress,
    network,
    screenerHref: screenerHrefForAsset({ asset, tokenAddress, network }),
  };
}

async function fetchHoldings(address: string): Promise<WalletHolding[]> {
  const holdings: WalletHolding[] = [];

  const ethHex = await alchemyRpc<string>("eth_getBalance", [address, "latest"]);
  if (ethHex) {
    const wei = Number.parseInt(ethHex, 16);
    const eth = wei / 1e18;
    if (Number.isFinite(eth) && eth > 0.0001) {
      holdings.push({
        id: "native-eth",
        symbol: "ETH",
        name: "Ether",
        balanceLabel: formatAmount(eth),
        tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        network: "eth",
        screenerHref: screenerHrefForAsset({
          asset: "ETH",
          tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          network: "eth",
        }),
        native: true,
      });
    }
  }

  const balances = await alchemyRpc<{
    tokenBalances?: Array<{ contractAddress?: string; tokenBalance?: string | null }>;
  }>("alchemy_getTokenBalances", [address]);

  const nonZero = (balances?.tokenBalances || [])
    .filter((row) => row.contractAddress && row.tokenBalance && row.tokenBalance !== "0x0")
    .slice(0, 18);

  const metas = await Promise.all(
    nonZero.map(async (row) => {
      const meta = await alchemyRpc<{
        symbol?: string;
        name?: string;
        decimals?: number;
      }>("alchemy_getTokenMetadata", [row.contractAddress]);
      const decimals = meta?.decimals ?? 18;
      const raw = Number.parseInt(row.tokenBalance || "0x0", 16);
      const balance = raw / 10 ** decimals;
      if (!Number.isFinite(balance) || balance <= 0) return null;
      const symbol = (meta?.symbol || "???").toUpperCase();
      const tokenAddress = row.contractAddress || null;
      return {
        id: tokenAddress || symbol,
        symbol,
        name: meta?.name || symbol,
        balanceLabel: formatAmount(balance),
        tokenAddress,
        network: "eth",
        screenerHref: screenerHrefForAsset({ asset: symbol, tokenAddress, network: "eth" }),
      } satisfies WalletHolding;
    }),
  );

  for (const row of metas) {
    if (row) holdings.push(row);
  }

  return holdings;
}

export async function buildLiveWalletDossier(input: {
  id: string;
  label: string;
  address: string;
  chain: string;
}): Promise<WalletDossier | null> {
  if (!alchemyUrl() || input.chain.toUpperCase() !== "ETH") {
    return null;
  }

  const [outgoing, incoming, holdings] = await Promise.all([
    fetchTransfers(input.address, "from"),
    fetchTransfers(input.address, "to"),
    fetchHoldings(input.address),
  ]);

  const activity = [...outgoing, ...incoming]
    .map((transfer) => transferToActivity(transfer, input.address))
    .filter((row): row is WalletActivityItem => Boolean(row));

  const seen = new Set<string>();
  const unique = activity.filter((item) => {
    const key = `${item.hash || item.id}-${item.side}-${item.asset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  const buysCount = unique.filter((a) => a.side === "buy").length;
  const sellsCount = unique.filter((a) => a.side === "sell").length;

  return {
    id: input.id,
    label: input.label,
    address: input.address,
    shortAddress: shortAddress(input.address),
    chain: input.chain,
    live: true,
    activity: unique.slice(0, 40),
    holdings,
    buysCount,
    sellsCount,
    note: null,
  };
}

export function buildDemoWalletDossier(input: {
  id: string;
  label: string;
  address: string;
  chain: string;
  moves: Array<{
    id: string;
    wallet: string;
    action: string;
    amount: string;
    asset: string;
    usd: string;
    time: string;
    date: string;
    type: string;
  }>;
}): WalletDossier {
  const related = input.moves.filter(
    (move) => move.wallet.toLowerCase() === input.label.toLowerCase() || move.wallet.includes(input.label.slice(0, 6)),
  );
  const pool = related.length > 0 ? related : input.moves.slice(0, 4);

  const activity: WalletActivityItem[] = pool.map((move) => {
    const side: "buy" | "sell" =
      move.type === "sell" || move.action.toLowerCase().includes("sold")
        ? "sell"
        : "buy";
    return {
      id: `demo-${move.id}`,
      side,
      action: move.action,
      asset: move.asset,
      amount: move.amount,
      usd: move.usd,
      time: move.time,
      date: move.date,
      timeSec: null,
      tokenAddress: null,
      network: input.chain.toLowerCase() === "sol" ? "solana" : "eth",
      screenerHref: screenerHrefForAsset({ asset: move.asset }),
    };
  });

  const holdingMap = new Map<string, WalletHolding>();
  for (const item of activity) {
    if (!holdingMap.has(item.asset)) {
      holdingMap.set(item.asset, {
        id: item.asset,
        symbol: item.asset,
        name: item.asset,
        balanceLabel: item.amount,
        tokenAddress: null,
        network: item.network,
        screenerHref: item.screenerHref,
      });
    }
  }

  return {
    id: input.id,
    label: input.label,
    address: input.address,
    shortAddress: shortAddress(input.address),
    chain: input.chain,
    live: false,
    activity,
    holdings: [...holdingMap.values()],
    buysCount: activity.filter((a) => a.side === "buy").length,
    sellsCount: activity.filter((a) => a.side === "sell").length,
    note: "Demo / partial dossier — connect Alchemy + ETH address for live buys, sells, and holdings.",
  };
}

export type WalletChartMark = {
  time: number;
  side: "buy" | "sell";
  asset: string;
  amount: string;
  usd: string;
  hash?: string;
  text: string;
  walletAddress?: string | null;
  walletLabel?: string | null;
  /** Profile image URL for chart avatar markers. */
  avatarUrl?: string | null;
};

export function seedWalletChartMark(input: {
  walletAddress: string;
  walletLabel?: string | null;
  timeSec: number;
  side: "buy" | "sell";
  asset?: string;
  amount?: string;
}): WalletChartMark {
  const wallet = input.walletAddress.trim();
  const asset = (input.asset || "TOKEN").toUpperCase();
  const amount = input.amount || "—";
  return {
    time: Math.floor(input.timeSec),
    side: input.side,
    asset,
    amount,
    usd: "—",
    text: `${input.side === "buy" ? "BUY" : "SELL"} ${amount} ${asset}`,
    walletAddress: wallet,
    walletLabel: input.walletLabel || null,
    avatarUrl: walletAvatarUrl(wallet, input.walletLabel),
  };
}

function markKey(mark: WalletChartMark) {
  return [
    mark.time,
    mark.side,
    (mark.walletAddress || "").toLowerCase(),
    mark.hash || mark.text,
  ].join("|");
}

/** Transfers for one wallet filtered to a token — used as chart markers. */
export async function fetchWalletChartMarks(input: {
  walletAddress: string;
  tokenAddress: string;
  walletLabel?: string;
}): Promise<WalletChartMark[]> {
  if (!alchemyUrl()) return [];

  const wallet = input.walletAddress.trim();
  const token = input.tokenAddress.trim().toLowerCase();
  const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const isNativeProxy = token === weth || token === "eth" || token === "ethereum";

  const [outgoing, incoming] = await Promise.all([
    fetchTransfers(wallet, "from", "0x64"),
    fetchTransfers(wallet, "to", "0x64"),
  ]);

  const marks: WalletChartMark[] = [];
  for (const transfer of [...outgoing, ...incoming]) {
    const contract = (transfer.rawContract?.address || "").toLowerCase();
    const asset = (transfer.asset || "ETH").toUpperCase();
    const isEthTransfer =
      !contract && (asset === "ETH" || transfer.category === "external");
    const matches = isNativeProxy
      ? isEthTransfer || contract === weth
      : contract === token;

    if (!matches) continue;
    const item = transferToActivity(transfer, wallet);
    if (!item?.timeSec) continue;

    marks.push({
      time: item.timeSec,
      side: item.side,
      asset: item.asset,
      amount: item.amount,
      usd: item.usd,
      hash: item.hash,
      text: `${item.side === "buy" ? "BUY" : "SELL"} ${item.amount} ${item.asset}`,
      walletAddress: wallet,
      walletLabel: input.walletLabel || null,
      avatarUrl: walletAvatarUrl(wallet, input.walletLabel),
    });
  }

  marks.sort((a, b) => a.time - b.time);
  const byKey = new Map<string, WalletChartMark>();
  for (const mark of marks) byKey.set(markKey(mark), mark);
  return [...byKey.values()].sort((a, b) => a.time - b.time);
}

/** Parallel marks for many wallets on one token (capped). */
export async function fetchMultiWalletChartMarks(input: {
  wallets: Array<{ address: string; label?: string }>;
  tokenAddress: string;
  seed?: {
    walletAddress: string;
    walletLabel?: string | null;
    timeSec: number;
    side: "buy" | "sell";
    asset?: string;
  } | null;
  limit?: number;
}): Promise<WalletChartMark[]> {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 12);
  const unique = new Map<string, { address: string; label?: string }>();
  for (const w of input.wallets) {
    const addr = w.address.trim();
    if (!addr || addr.length < 8) continue;
    const key = addr.toLowerCase();
    if (!unique.has(key)) unique.set(key, { address: addr, label: w.label });
  }
  if (input.seed?.walletAddress) {
    const key = input.seed.walletAddress.trim().toLowerCase();
    if (key && !unique.has(key)) {
      unique.set(key, {
        address: input.seed.walletAddress.trim(),
        label: input.seed.walletLabel || undefined,
      });
    }
  }

  const selected = [...unique.values()].slice(0, limit);
  const batches = await Promise.all(
    selected.map((w) =>
      fetchWalletChartMarks({
        walletAddress: w.address,
        tokenAddress: input.tokenAddress,
        walletLabel: w.label,
      }).catch(() => [] as WalletChartMark[]),
    ),
  );

  const merged = new Map<string, WalletChartMark>();
  for (const list of batches) {
    for (const mark of list) merged.set(markKey(mark), mark);
  }

  if (input.seed?.timeSec) {
    const seeded = seedWalletChartMark({
      walletAddress: input.seed.walletAddress,
      walletLabel: input.seed.walletLabel,
      timeSec: input.seed.timeSec,
      side: input.seed.side,
      asset: input.seed.asset,
    });
    const key = markKey(seeded);
    if (!merged.has(key)) merged.set(key, seeded);
  }

  return [...merged.values()].sort((a, b) => a.time - b.time);
}

