export type PulseItem = {
  id: string;
  walletLabel: string;
  walletAddress: string;
  action: string;
  amount: string;
  asset: string;
  usd: string;
  time: string;
  date: string;
  status: "Confirmed" | "Live" | "Watching";
  type: "buy" | "sell" | "flow" | "alert" | "stake";
  source: "market" | "personal" | "demo";
  hash?: string;
  /** ERC-20 / token contract when Alchemy provides it. */
  tokenAddress?: string | null;
  network?: string;
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

type AlchemyTransfersResult = {
  transfers?: AlchemyTransfer[];
};

function alchemyUrl() {
  const explicit = process.env.ALCHEMY_RPC_URL;
  if (explicit) return explicit;
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return null;
  return `https://eth-mainnet.g.alchemy.com/v2/${key}`;
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
  return value.toFixed(4);
}

function splitWhen(iso?: string) {
  if (!iso) {
    return { time: "—", date: "Today" };
  }
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate();
  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  const isYesterday =
    date.getUTCFullYear() === yesterday.getUTCFullYear() &&
    date.getUTCMonth() === yesterday.getUTCMonth() &&
    date.getUTCDate() === yesterday.getUTCDate();

  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return {
    time: `${time} UTC`,
    date: sameDay ? "Today" : isYesterday ? "Yesterday" : date.toISOString().slice(0, 10),
  };
}

async function fetchTransfersForAddress(address: string, direction: "from" | "to") {
  const url = alchemyUrl();
  if (!url) return [] as AlchemyTransfer[];

  const params: Record<string, unknown> = {
    fromBlock: "0x0",
    toBlock: "latest",
    category: ["external", "erc20"],
    excludeZeroValue: true,
    withMetadata: true,
    maxCount: "0xa",
    order: "desc",
  };
  if (direction === "from") params.fromAddress = address;
  else params.toAddress = address;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [params],
    }),
    next: { revalidate: 45 },
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as {
    result?: AlchemyTransfersResult;
    error?: { message?: string };
  };
  if (payload.error) return [];
  return payload.result?.transfers ?? [];
}

function transferToPulse(
  transfer: AlchemyTransfer,
  wallet: { label: string; address: string },
  source: PulseItem["source"],
): PulseItem | null {
  const asset = (transfer.asset || "ETH").toUpperCase();
  const value = transfer.value ?? null;
  const walletLower = wallet.address.toLowerCase();
  const isOut = (transfer.from || "").toLowerCase() === walletLower;
  const action = isOut ? "Sent" : "Received";
  const type: PulseItem["type"] = isOut ? "sell" : "buy";
  const when = splitWhen(transfer.metadata?.blockTimestamp);

  return {
    id: transfer.uniqueId || transfer.hash || `${wallet.address}-${when.time}-${asset}`,
    walletLabel: wallet.label,
    walletAddress: wallet.address,
    action,
    amount: formatAmount(value),
    asset,
    usd: formatUsdGuess(value, asset),
    time: when.time,
    date: when.date,
    status: "Confirmed",
    type,
    source,
    hash: transfer.hash,
    tokenAddress: transfer.rawContract?.address || null,
    network: "eth",
  };
}

export async function buildPulseForWallets(
  wallets: Array<{ label: string; address: string }>,
  source: "market" | "personal",
): Promise<PulseItem[]> {
  if (!alchemyUrl()) return [];

  const batches = await Promise.all(
    wallets.slice(0, 6).map(async (wallet) => {
      const [outgoing, incoming] = await Promise.all([
        fetchTransfersForAddress(wallet.address, "from"),
        fetchTransfersForAddress(wallet.address, "to"),
      ]);
      return [...outgoing, ...incoming]
        .map((transfer) => transferToPulse(transfer, wallet, source))
        .filter((item): item is PulseItem => Boolean(item));
    }),
  );

  const merged = batches.flat();
  const seen = new Set<string>();
  const unique = merged.filter((item) => {
    const key = item.hash ? `${item.hash}-${item.walletAddress}-${item.action}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique
    .sort((a, b) => {
      const aKey = `${a.date}-${a.time}`;
      const bKey = `${b.date}-${b.time}`;
      return bKey.localeCompare(aKey);
    })
    .slice(0, 24);
}
