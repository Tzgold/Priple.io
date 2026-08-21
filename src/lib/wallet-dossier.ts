import { MAJOR_TOKEN_ROUTES, SYMBOL_TO_CG } from "@/lib/token-routes";
import { pickResolvedMeta, resolveTokenVisualMeta } from "@/lib/token-logo";
import { walletAvatarUrl } from "@/lib/wallet-avatar";
import {
  alchemyRpcUrlFor,
  deskChainToGtNetwork,
  isSolanaChain,
  nativeSymbolForChain,
  normalizeDeskChain,
  wrappedNativeAddress,
  type DeskChain,
} from "@/lib/alchemy-networks";

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
  /** Resolved via DexScreener / Jupiter when available. */
  imageUrl?: string | null;
};

export type WalletHolding = {
  id: string;
  symbol: string;
  name: string;
  balanceLabel: string;
  tokenAddress: string | null;
  network: string;
  screenerHref: string | null;
  imageUrl?: string | null;
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

async function alchemyRpc<T>(
  chainOrNetwork: string,
  method: string,
  params: unknown[],
): Promise<T | null> {
  const url = alchemyRpcUrlFor(chainOrNetwork);
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
  const upper = asset.toUpperCase();
  const approx =
    upper === "ETH" || upper === "WETH"
      ? value * 3400
      : upper === "SOL" || upper === "WSOL"
        ? value * 150
        : upper === "BNB"
          ? value * 600
          : upper === "USDC" || upper === "USDT" || upper === "DAI"
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

async function fetchEvmTransfers(
  chain: DeskChain,
  address: string,
  direction: "from" | "to",
  maxCount = "0x28",
) {
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
    chain,
    "alchemy_getAssetTransfers",
    [params],
  );
  return result?.transfers ?? [];
}

function transferToActivity(
  transfer: AlchemyTransfer,
  walletAddress: string,
  network: string,
  nativeSymbol: string,
): WalletActivityItem | null {
  const asset = (transfer.asset || nativeSymbol).toUpperCase();
  const value = transfer.value ?? null;
  const isOut = (transfer.from || "").toLowerCase() === walletAddress.toLowerCase();
  const side: "buy" | "sell" = isOut ? "sell" : "buy";
  const when = splitWhen(transfer.metadata?.blockTimestamp);
  const tokenAddress = transfer.rawContract?.address || null;
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
    imageUrl: null,
  };
}

async function fetchEvmHoldings(chain: DeskChain, address: string): Promise<WalletHolding[]> {
  const network = deskChainToGtNetwork(chain);
  const nativeSymbol = nativeSymbolForChain(chain);
  const wrapped = wrappedNativeAddress(network);
  const holdings: WalletHolding[] = [];

  const ethHex = await alchemyRpc<string>(chain, "eth_getBalance", [address, "latest"]);
  if (ethHex) {
    const wei = Number.parseInt(ethHex, 16);
    const eth = wei / 1e18;
    if (Number.isFinite(eth) && eth > 0.0001) {
      holdings.push({
        id: `native-${nativeSymbol}`,
        symbol: nativeSymbol,
        name: nativeSymbol,
        balanceLabel: formatAmount(eth),
        tokenAddress: wrapped,
        network,
        screenerHref: screenerHrefForAsset({
          asset: nativeSymbol,
          tokenAddress: wrapped,
          network,
        }),
        imageUrl: null,
        native: true,
      });
    }
  }

  const balances = await alchemyRpc<{
    tokenBalances?: Array<{ contractAddress?: string; tokenBalance?: string | null }>;
  }>(chain, "alchemy_getTokenBalances", [address]);

  const nonZero = (balances?.tokenBalances || [])
    .filter((row) => row.contractAddress && row.tokenBalance && row.tokenBalance !== "0x0")
    .slice(0, 18);

  const metas = await Promise.all(
    nonZero.map(async (row) => {
      const meta = await alchemyRpc<{
        symbol?: string;
        name?: string;
        decimals?: number;
      }>(chain, "alchemy_getTokenMetadata", [row.contractAddress]);
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
        network,
        screenerHref: screenerHrefForAsset({ asset: symbol, tokenAddress, network }),
        imageUrl: null,
      } satisfies WalletHolding;
    }),
  );

  for (const row of metas) {
    if (row) holdings.push(row);
  }

  return holdings;
}

type SolSig = { signature?: string; blockTime?: number | null; err?: unknown };
type SolTx = {
  blockTime?: number | null;
  transaction?: {
    signatures?: string[];
    message?: {
      accountKeys?: Array<string | { pubkey?: string }>;
    };
  };
  meta?: {
    err?: unknown;
    preBalances?: number[];
    postBalances?: number[];
    preTokenBalances?: Array<{
      accountIndex: number;
      mint: string;
      owner?: string;
      uiTokenAmount?: { uiAmount?: number | null; decimals?: number };
    }>;
    postTokenBalances?: Array<{
      accountIndex: number;
      mint: string;
      owner?: string;
      uiTokenAmount?: { uiAmount?: number | null; decimals?: number };
    }>;
  };
};

function solAccountKey(key: string | { pubkey?: string } | undefined) {
  if (!key) return "";
  if (typeof key === "string") return key;
  return key.pubkey || "";
}

async function fetchSolanaActivity(address: string): Promise<WalletActivityItem[]> {
  const network = "solana";
  const sigs = await alchemyRpc<SolSig[]>("SOL", "getSignaturesForAddress", [
    address,
    { limit: 12 },
  ]);
  if (!sigs?.length) return [];

  const activity: WalletActivityItem[] = [];
  // Cap RPC fan-out — production Alchemy budget guard.
  const maxTx = 8;

  for (const row of sigs.slice(0, maxTx)) {
    if (!row.signature || row.err) continue;
    const tx = await alchemyRpc<SolTx>("SOL", "getTransaction", [
      row.signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
    ]);
    if (!tx?.meta || tx.meta.err) continue;

    const keys = (tx.transaction?.message?.accountKeys || []).map(solAccountKey);
    const walletIndex = keys.findIndex((k) => k === address);
    const blockTime = tx.blockTime ?? row.blockTime ?? null;
    const iso = blockTime ? new Date(blockTime * 1000).toISOString() : undefined;
    const when = splitWhen(iso);

    const tokenDeltas = new Map<string, { amount: number; mint: string }>();
    const pre = tx.meta.preTokenBalances || [];
    const post = tx.meta.postTokenBalances || [];

    for (const bal of post) {
      if (bal.owner && bal.owner !== address) continue;
      const preRow = pre.find((p) => p.accountIndex === bal.accountIndex && p.mint === bal.mint);
      const before = preRow?.uiTokenAmount?.uiAmount ?? 0;
      const after = bal.uiTokenAmount?.uiAmount ?? 0;
      const delta = after - before;
      if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) continue;
      tokenDeltas.set(bal.mint, { amount: delta, mint: bal.mint });
    }

    for (const [mint, delta] of tokenDeltas) {
      const side: "buy" | "sell" = delta.amount > 0 ? "buy" : "sell";
      const amount = Math.abs(delta.amount);
      activity.push({
        id: `${row.signature}-${mint}-${side}`,
        side,
        action: side === "buy" ? "Bought / received" : "Sold / sent",
        asset: mint.slice(0, 4).toUpperCase(),
        amount: formatAmount(amount),
        usd: "—",
        time: when.time,
        date: when.date,
        timeSec: blockTime,
        hash: row.signature,
        tokenAddress: mint,
        network,
        screenerHref: screenerHrefForAsset({
          asset: mint.slice(0, 4).toUpperCase(),
          tokenAddress: mint,
          network,
        }),
        imageUrl: null,
      });
    }

    if (tokenDeltas.size === 0 && walletIndex >= 0) {
      const preBal = tx.meta.preBalances?.[walletIndex] ?? 0;
      const postBal = tx.meta.postBalances?.[walletIndex] ?? 0;
      const lamports = postBal - preBal;
      if (Math.abs(lamports) > 5000) {
        const side: "buy" | "sell" = lamports > 0 ? "buy" : "sell";
        const sol = Math.abs(lamports) / 1e9;
        const wsol = wrappedNativeAddress("solana");
        activity.push({
          id: `${row.signature}-sol-${side}`,
          side,
          action: side === "buy" ? "Bought / received" : "Sold / sent",
          asset: "SOL",
          amount: formatAmount(sol),
          usd: formatUsdGuess(sol, "SOL"),
          time: when.time,
          date: when.date,
          timeSec: blockTime,
          hash: row.signature,
          tokenAddress: wsol,
          network,
          screenerHref: screenerHrefForAsset({
            asset: "SOL",
            tokenAddress: wsol,
            network,
          }),
          imageUrl: null,
        });
      }
    }
  }

  return activity;
}

async function fetchSolanaHoldings(address: string): Promise<WalletHolding[]> {
  const network = "solana";
  const holdings: WalletHolding[] = [];
  const wsol = wrappedNativeAddress("solana");

  const bal = await alchemyRpc<{ value?: number }>("SOL", "getBalance", [address]);
  const lamports = bal?.value ?? 0;
  const sol = lamports / 1e9;
  if (sol > 0.001) {
    holdings.push({
      id: "native-sol",
      symbol: "SOL",
      name: "Solana",
      balanceLabel: formatAmount(sol),
      tokenAddress: wsol,
      network,
      screenerHref: screenerHrefForAsset({ asset: "SOL", tokenAddress: wsol, network }),
      imageUrl: null,
      native: true,
    });
  }

  const tokenAccounts = await alchemyRpc<{
    value?: Array<{
      pubkey?: string;
      account?: {
        data?: {
          parsed?: {
            info?: {
              mint?: string;
              tokenAmount?: { uiAmount?: number | null; decimals?: number };
            };
          };
        };
      };
    }>;
  }>("SOL", "getTokenAccountsByOwner", [
    address,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed" },
  ]);

  for (const row of (tokenAccounts?.value || []).slice(0, 24)) {
    const info = row.account?.data?.parsed?.info;
    const mint = info?.mint;
    const amount = info?.tokenAmount?.uiAmount ?? 0;
    if (!mint || !amount || amount <= 0) continue;
    holdings.push({
      id: mint,
      symbol: mint.slice(0, 4).toUpperCase(),
      name: mint.slice(0, 8),
      balanceLabel: formatAmount(amount),
      tokenAddress: mint,
      network,
      screenerHref: screenerHrefForAsset({
        asset: mint.slice(0, 4).toUpperCase(),
        tokenAddress: mint,
        network,
      }),
      imageUrl: null,
    });
  }

  return holdings;
}

async function enrichDossierLogos(dossier: WalletDossier): Promise<WalletDossier> {
  const keys = [
    ...dossier.activity.map((row) => ({
      network: row.network,
      address: row.tokenAddress || "",
    })),
    ...dossier.holdings.map((row) => ({
      network: row.network,
      address: row.tokenAddress || "",
    })),
  ].filter((k) => k.address.length >= 8);

  if (keys.length === 0) return dossier;

  const metas = await resolveTokenVisualMeta(keys);
  return {
    ...dossier,
    activity: dossier.activity.map((row) => {
      const meta = pickResolvedMeta(metas, row.network, row.tokenAddress);
      const symbol = meta?.symbol || row.asset;
      return {
        ...row,
        asset: symbol,
        imageUrl: meta?.imageUrl || row.imageUrl || null,
      };
    }),
    holdings: dossier.holdings.map((row) => {
      const meta = pickResolvedMeta(metas, row.network, row.tokenAddress);
      return {
        ...row,
        symbol: meta?.symbol || row.symbol,
        name: meta?.name || row.name,
        imageUrl: meta?.imageUrl || row.imageUrl || null,
      };
    }),
  };
}

export async function buildLiveWalletDossier(input: {
  id: string;
  label: string;
  address: string;
  chain: string;
}): Promise<WalletDossier | null> {
  const chain = normalizeDeskChain(input.chain);
  if (!chain || !alchemyRpcUrlFor(chain)) return null;

  if (isSolanaChain(chain)) {
    const [activityRaw, holdings] = await Promise.all([
      fetchSolanaActivity(input.address),
      fetchSolanaHoldings(input.address),
    ]);
    const seen = new Set<string>();
    const unique = activityRaw.filter((item) => {
      const key = `${item.hash || item.id}-${item.side}-${item.tokenAddress || item.asset}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => (b.timeSec || 0) - (a.timeSec || 0));

    return enrichDossierLogos({
      id: input.id,
      label: input.label,
      address: input.address,
      shortAddress: shortAddress(input.address),
      chain: input.chain,
      live: true,
      activity: unique.slice(0, 40),
      holdings,
      buysCount: unique.filter((a) => a.side === "buy").length,
      sellsCount: unique.filter((a) => a.side === "sell").length,
      note: null,
    });
  }

  const network = deskChainToGtNetwork(chain);
  const nativeSymbol = nativeSymbolForChain(chain);
  const [outgoing, incoming, holdings] = await Promise.all([
    fetchEvmTransfers(chain, input.address, "from"),
    fetchEvmTransfers(chain, input.address, "to"),
    fetchEvmHoldings(chain, input.address),
  ]);

  const activity = [...outgoing, ...incoming]
    .map((transfer) => transferToActivity(transfer, input.address, network, nativeSymbol))
    .filter((row): row is WalletActivityItem => Boolean(row));

  const seen = new Set<string>();
  const unique = activity.filter((item) => {
    const key = `${item.hash || item.id}-${item.side}-${item.asset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => (b.timeSec || 0) - (a.timeSec || 0));

  return enrichDossierLogos({
    id: input.id,
    label: input.label,
    address: input.address,
    shortAddress: shortAddress(input.address),
    chain: input.chain,
    live: true,
    activity: unique.slice(0, 40),
    holdings,
    buysCount: unique.filter((a) => a.side === "buy").length,
    sellsCount: unique.filter((a) => a.side === "sell").length,
    note: null,
  });
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
    (move) =>
      move.wallet.toLowerCase() === input.label.toLowerCase() ||
      move.wallet.includes(input.label.slice(0, 6)),
  );
  const pool = related.length > 0 ? related : input.moves.slice(0, 4);
  const network = deskChainToGtNetwork(input.chain);

  const activity: WalletActivityItem[] = pool.map((move) => {
    const side: "buy" | "sell" =
      move.type === "sell" || move.action.toLowerCase().includes("sold") ? "sell" : "buy";
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
      network,
      screenerHref: screenerHrefForAsset({ asset: move.asset, network }),
      imageUrl: null,
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
        imageUrl: null,
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
    note: `Demo / partial dossier — Alchemy live for ${normalizeDeskChain(input.chain) || input.chain} when the key supports that network.`,
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

async function fetchEvmWalletChartMarks(input: {
  chain: DeskChain;
  walletAddress: string;
  tokenAddress: string;
  walletLabel?: string;
}): Promise<WalletChartMark[]> {
  const wallet = input.walletAddress.trim();
  const token = input.tokenAddress.trim().toLowerCase();
  const network = deskChainToGtNetwork(input.chain);
  const nativeSymbol = nativeSymbolForChain(input.chain);
  const wrapped = (wrappedNativeAddress(network) || "").toLowerCase();
  const isNativeProxy =
    Boolean(wrapped) &&
    (token === wrapped ||
      token === nativeSymbol.toLowerCase() ||
      token === network ||
      token === "native");

  const [outgoing, incoming] = await Promise.all([
    fetchEvmTransfers(input.chain, wallet, "from", "0x64"),
    fetchEvmTransfers(input.chain, wallet, "to", "0x64"),
  ]);

  const marks: WalletChartMark[] = [];
  for (const transfer of [...outgoing, ...incoming]) {
    const contract = (transfer.rawContract?.address || "").toLowerCase();
    const asset = (transfer.asset || nativeSymbol).toUpperCase();
    const isNativeTransfer =
      !contract &&
      (asset === nativeSymbol ||
        asset === "ETH" ||
        transfer.category === "external");
    const matches = isNativeProxy
      ? isNativeTransfer || (wrapped && contract === wrapped)
      : contract === token;

    if (!matches) continue;
    const item = transferToActivity(transfer, wallet, network, nativeSymbol);
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

async function fetchSolanaWalletChartMarks(input: {
  walletAddress: string;
  tokenAddress: string;
  walletLabel?: string;
}): Promise<WalletChartMark[]> {
  const wallet = input.walletAddress.trim();
  const mint = input.tokenAddress.trim();
  const wsol = wrappedNativeAddress("solana") || "";
  const wantNative =
    mint === wsol || mint.toLowerCase() === "sol" || mint.toLowerCase() === "solana";

  const activity = await fetchSolanaActivity(wallet);
  const marks: WalletChartMark[] = [];

  for (const item of activity) {
    if (!item.timeSec) continue;
    const matches = wantNative
      ? item.asset === "SOL" || item.tokenAddress === wsol
      : item.tokenAddress === mint;
    if (!matches) continue;
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

  const byKey = new Map<string, WalletChartMark>();
  for (const mark of marks) byKey.set(markKey(mark), mark);
  return [...byKey.values()].sort((a, b) => a.time - b.time);
}

/** Transfers for one wallet filtered to a token — used as chart markers. */
export async function fetchWalletChartMarks(input: {
  walletAddress: string;
  tokenAddress: string;
  walletLabel?: string;
  network?: string;
}): Promise<WalletChartMark[]> {
  const chain =
    normalizeDeskChain(input.network || "") ||
    (input.tokenAddress.startsWith("0x") ? ("ETH" as DeskChain) : ("SOL" as DeskChain));

  if (!alchemyRpcUrlFor(chain)) return [];

  if (isSolanaChain(chain)) {
    return fetchSolanaWalletChartMarks({
      walletAddress: input.walletAddress,
      tokenAddress: input.tokenAddress,
      walletLabel: input.walletLabel,
    });
  }

  return fetchEvmWalletChartMarks({
    chain,
    walletAddress: input.walletAddress,
    tokenAddress: input.tokenAddress,
    walletLabel: input.walletLabel,
  });
}

/** Parallel marks for many wallets on one token (capped). */
export async function fetchMultiWalletChartMarks(input: {
  wallets: Array<{ address: string; label?: string }>;
  tokenAddress: string;
  network?: string;
  seed?: {
    walletAddress: string;
    walletLabel?: string | null;
    timeSec: number;
    side: "buy" | "sell";
    asset?: string;
  } | null;
  limit?: number;
}): Promise<WalletChartMark[]> {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 6);
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
        network: input.network,
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
