/** Client-safe token routing helpers (no server-only fetch). */

export type BoardToken = {
  id: string;
  network: string;
  address: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number | null;
  change24h: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  kind: "major" | "trending" | "new";
  poolName: string | null;
};

export const MAJOR_TOKEN_ROUTES: Record<
  string,
  { network: string; address: string } | { cg: string }
> = {
  ethereum: { network: "eth", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
  tether: { network: "eth", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
  "usd-coin": { network: "eth", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  chainlink: { network: "eth", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA" },
  arbitrum: { network: "arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548" },
  optimism: { network: "optimism", address: "0x4200000000000000000000000000000000000042" },
  binancecoin: { network: "bsc", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
  solana: { network: "solana", address: "So11111111111111111111111111111111111111112" },
  bitcoin: { cg: "bitcoin" },
  ripple: { cg: "ripple" },
};

export const SYMBOL_TO_CG: Record<string, string> = {
  ETH: "ethereum",
  BTC: "bitcoin",
  SOL: "solana",
  LINK: "chainlink",
  USDT: "tether",
  USDC: "usd-coin",
  XRP: "ripple",
  ARB: "arbitrum",
  OP: "optimism",
  BNB: "binancecoin",
};

/** TradingView symbols for majors when we embed the Advanced Chart widget. */
export const TV_SYMBOL_BY_CG: Record<string, string> = {
  bitcoin: "BINANCE:BTCUSDT",
  ethereum: "BINANCE:ETHUSDT",
  solana: "BINANCE:SOLUSDT",
  chainlink: "BINANCE:LINKUSDT",
  tether: "BINANCE:USDTUSD",
  "usd-coin": "BINANCE:USDCUSDT",
  ripple: "BINANCE:XRPUSDT",
  arbitrum: "BINANCE:ARBUSDT",
  optimism: "BINANCE:OPUSDT",
  binancecoin: "BINANCE:BNBUSDT",
};

export function looksLikeAddress(value: string) {
  const v = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v)) return true;
  return false;
}

export function tokenDeskHrefFromSymbol(symbol: string) {
  const id = SYMBOL_TO_CG[symbol.toUpperCase()] || symbol.toLowerCase();
  const route = MAJOR_TOKEN_ROUTES[id];
  if (!route) return `/app/screener?network=coingecko&address=${encodeURIComponent(id)}`;
  if ("cg" in route) {
    return `/app/screener?network=coingecko&address=${encodeURIComponent(route.cg)}`;
  }
  return `/app/screener?network=${encodeURIComponent(route.network)}&address=${encodeURIComponent(route.address)}`;
}
