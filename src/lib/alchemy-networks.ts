/** Alchemy network hosts + desk chain ↔ GeckoTerminal network mapping. */

export const DESK_CHAINS = [
  "ETH",
  "SOL",
  "BNB",
  "ARB",
  "BASE",
  "OP",
  "POLYGON",
  "AVAX",
] as const;

export type DeskChain = (typeof DESK_CHAINS)[number];

/** Alchemy subdomain for JSON-RPC (same API key across apps). */
const ALCHEMY_HOST: Record<DeskChain, string> = {
  ETH: "eth-mainnet",
  BASE: "base-mainnet",
  ARB: "arb-mainnet",
  OP: "opt-mainnet",
  POLYGON: "polygon-mainnet",
  BNB: "bnb-mainnet",
  AVAX: "avax-mainnet",
  SOL: "solana-mainnet",
};

const GT_NETWORK_BY_CHAIN: Record<DeskChain, string> = {
  ETH: "eth",
  BASE: "base",
  ARB: "arbitrum",
  OP: "optimism",
  POLYGON: "polygon",
  BNB: "bsc",
  AVAX: "avalanche",
  SOL: "solana",
};

const CHAIN_BY_GT: Record<string, DeskChain> = {
  eth: "ETH",
  ethereum: "ETH",
  base: "BASE",
  arbitrum: "ARB",
  arb: "ARB",
  optimism: "OP",
  op: "OP",
  polygon: "POLYGON",
  matic: "POLYGON",
  bsc: "BNB",
  bnb: "BNB",
  avalanche: "AVAX",
  avax: "AVAX",
  solana: "SOL",
  sol: "SOL",
};

const NATIVE_SYMBOL: Record<DeskChain, string> = {
  ETH: "ETH",
  BASE: "ETH",
  ARB: "ETH",
  OP: "ETH",
  POLYGON: "MATIC",
  BNB: "BNB",
  AVAX: "AVAX",
  SOL: "SOL",
};

/** Wrapped native used when matching "ETH" style token desks. */
const WRAPPED_NATIVE: Partial<Record<string, string>> = {
  eth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  base: "0x4200000000000000000000000000000000000006",
  arbitrum: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  optimism: "0x4200000000000000000000000000000000000006",
  polygon: "0x0d500b1d8e8ef31e21c99d1df9b648c90d6b2c2e",
  bsc: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  avalanche: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
  solana: "So11111111111111111111111111111111111111112",
};

export function isDeskChain(value: string): value is DeskChain {
  return (DESK_CHAINS as readonly string[]).includes(value.trim().toUpperCase());
}

export function normalizeDeskChain(value: string): DeskChain | null {
  const upper = value.trim().toUpperCase();
  if (isDeskChain(upper)) return upper;
  return CHAIN_BY_GT[value.trim().toLowerCase()] ?? null;
}

export function deskChainToGtNetwork(chain: string): string {
  const normalized = normalizeDeskChain(chain);
  return normalized ? GT_NETWORK_BY_CHAIN[normalized] : chain.trim().toLowerCase();
}

export function gtNetworkToDeskChain(network: string): DeskChain | null {
  return CHAIN_BY_GT[network.trim().toLowerCase()] ?? null;
}

export function nativeSymbolForChain(chain: string): string {
  const normalized = normalizeDeskChain(chain);
  return normalized ? NATIVE_SYMBOL[normalized] : "ETH";
}

export function wrappedNativeAddress(network: string): string | null {
  const net = deskChainToGtNetwork(network);
  return WRAPPED_NATIVE[net] ?? null;
}

export function isSolanaChain(chainOrNetwork: string): boolean {
  const n = normalizeDeskChain(chainOrNetwork);
  if (n === "SOL") return true;
  return chainOrNetwork.trim().toLowerCase() === "solana";
}

export function isEvmChain(chainOrNetwork: string): boolean {
  const n = normalizeDeskChain(chainOrNetwork);
  return Boolean(n && n !== "SOL");
}

/**
 * Resolve Alchemy JSON-RPC URL for a desk chain or GT network.
 * Optional overrides: ALCHEMY_RPC_URL (ETH only), ALCHEMY_SOLANA_RPC_URL, ALCHEMY_{CHAIN}_RPC_URL.
 */
export function alchemyRpcUrlFor(chainOrNetwork: string): string | null {
  const chain = normalizeDeskChain(chainOrNetwork);
  if (!chain) return null;

  const envKey = `ALCHEMY_${chain}_RPC_URL`;
  const perChain = process.env[envKey];
  if (perChain) return perChain;

  if (chain === "ETH" && process.env.ALCHEMY_RPC_URL) {
    return process.env.ALCHEMY_RPC_URL;
  }
  if (chain === "SOL" && process.env.ALCHEMY_SOLANA_RPC_URL) {
    return process.env.ALCHEMY_SOLANA_RPC_URL;
  }

  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return null;
  return `https://${ALCHEMY_HOST[chain]}.g.alchemy.com/v2/${key}`;
}

export function chainAssetSymbol(chain: string): string {
  const normalized = normalizeDeskChain(chain);
  if (!normalized) return "ETH";
  if (normalized === "SOL") return "SOL";
  if (normalized === "BNB") return "BNB";
  if (normalized === "ARB") return "ARB";
  if (normalized === "BASE") return "ETH";
  if (normalized === "OP") return "OP";
  if (normalized === "POLYGON") return "MATIC";
  if (normalized === "AVAX") return "AVAX";
  return "ETH";
}
