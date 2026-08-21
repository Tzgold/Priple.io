/** Optional Birdeye metadata (logo / symbol / name). Requires BIRDEYE_API_KEY. */

import { normalizeNetwork } from "@/lib/geckoterminal";

const CHAIN_HEADER: Record<string, string> = {
  eth: "ethereum",
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum",
  bsc: "bsc",
  optimism: "optimism",
  polygon: "polygon",
  solana: "solana",
  avalanche: "avalanche",
};

export type BirdeyeTokenMeta = {
  symbol: string | null;
  name: string | null;
  imageUrl: string | null;
};

function birdeyeKey() {
  return process.env.BIRDEYE_API_KEY?.trim() || null;
}

export function birdeyeEnabled() {
  return Boolean(birdeyeKey());
}

export async function fetchBirdeyeTokenMeta(
  network: string,
  address: string,
): Promise<BirdeyeTokenMeta | null> {
  const key = birdeyeKey();
  if (!key) return null;
  const chain = CHAIN_HEADER[normalizeNetwork(network)] || CHAIN_HEADER[network.toLowerCase()];
  if (!chain) return null;
  const addr = address.trim();
  if (addr.length < 8) return null;

  try {
    const res = await fetch(
      `https://public-api.birdeye.so/defi/v3/token/meta-data/single?address=${encodeURIComponent(addr)}`,
      {
        headers: {
          "X-API-KEY": key,
          "x-chain": chain,
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        symbol?: string;
        name?: string;
        logo_uri?: string;
        logoURI?: string;
      };
    };
    const data = json.data;
    if (!data) return null;
    const imageUrl = data.logo_uri || data.logoURI || null;
    return {
      symbol: data.symbol ? String(data.symbol).toUpperCase() : null,
      name: data.name ? String(data.name) : null,
      imageUrl: typeof imageUrl === "string" && imageUrl.length > 0 ? imageUrl : null,
    };
  } catch {
    return null;
  }
}

/** Fill missing meta for a small batch (free tier is ~1 rps — keep batches small). */
export async function fetchBirdeyeMetaBatch(
  keys: Array<{ network: string; address: string }>,
  limit = 8,
): Promise<Map<string, BirdeyeTokenMeta>> {
  const out = new Map<string, BirdeyeTokenMeta>();
  if (!birdeyeEnabled()) return out;

  const unique: Array<{ network: string; address: string; key: string }> = [];
  const seen = new Set<string>();
  for (const row of keys) {
    const net = normalizeNetwork(row.network);
    const addr = row.address.trim();
    const key = `${net}:${addr.toLowerCase()}`;
    if (!addr || addr.length < 8 || seen.has(key)) continue;
    seen.add(key);
    unique.push({ network: net, address: addr, key });
    if (unique.length >= limit) break;
  }

  // Sequential to respect free-tier rate limits without multi-second sleeps.
  for (const row of unique) {
    const meta = await fetchBirdeyeTokenMeta(row.network, row.address);
    if (meta && (meta.imageUrl || meta.symbol || meta.name)) {
      out.set(row.key, meta);
    }
  }

  return out;
}
