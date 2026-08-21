/** Resolve meme/DEX token logos + symbols the same way explorers do — by contract. */

import { fetchBirdeyeMetaBatch, birdeyeEnabled } from "@/lib/birdeye";
import { toDexScreenerChain } from "@/lib/dexscreener";
import { normalizeNetwork } from "@/lib/geckoterminal";

type LogoKey = { network: string; address: string };

export type TokenVisualMeta = {
  imageUrl: string | null;
  symbol: string | null;
  name: string | null;
};

/** Stable DexScreener CDN mark (redirects to cms image when known). */
export function dexScreenerTokenImageUrl(network: string, address: string): string | null {
  const chain = toDexScreenerChain(network);
  const addr = address.trim();
  if (!chain || !addr || addr.length < 8) return null;
  return `https://dd.dexscreener.com/ds-data/tokens/${chain}/${addr}.png`;
}

function logoKey(network: string, address: string) {
  return `${normalizeNetwork(network)}:${address.trim().toLowerCase()}`;
}

type DsPairLite = {
  chainId?: string;
  liquidity?: { usd?: number };
  baseToken?: { address?: string; symbol?: string; name?: string };
  quoteToken?: { address?: string; symbol?: string; name?: string };
  info?: { imageUrl?: string };
};

/** Batch meta from DexScreener pairs (image + symbol + name). */
export async function fetchDexScreenerMetaMap(
  addresses: string[],
  preferredNetwork?: string,
): Promise<Map<string, TokenVisualMeta>> {
  const out = new Map<string, TokenVisualMeta>();
  const unique = [...new Set(addresses.map((a) => a.trim()).filter((a) => a.length >= 8))];
  if (unique.length === 0) return out;

  const preferred = preferredNetwork ? toDexScreenerChain(preferredNetwork) : null;

  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${chunk.map(encodeURIComponent).join(",")}`,
        { cache: "no-store" },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as { pairs?: DsPairLite[] | null };
      const pairs = (json.pairs || []).filter(Boolean);

      const bestByAddr = new Map<string, { meta: TokenVisualMeta; score: number }>();
      for (const pair of pairs) {
        const chainBoost = preferred && pair.chainId === preferred ? 1_000_000_000 : 0;
        const liq = pair.liquidity?.usd ?? 0;
        const score = chainBoost + liq;
        const imageUrl = pair.info?.imageUrl || null;

        for (const token of [pair.baseToken, pair.quoteToken]) {
          const addr = (token?.address || "").trim().toLowerCase();
          if (!addr) continue;
          const symbol = token?.symbol ? String(token.symbol).toUpperCase() : null;
          const name = token?.name ? String(token.name) : null;
          const prev = bestByAddr.get(addr);
          if (!prev || score > prev.score) {
            bestByAddr.set(addr, {
              score,
              meta: { imageUrl, symbol, name },
            });
          } else if (prev && !prev.meta.imageUrl && imageUrl) {
            prev.meta.imageUrl = imageUrl;
          }
        }
      }

      for (const [addr, hit] of bestByAddr) {
        out.set(addr, hit.meta);
      }
    } catch {
      // keep partial map
    }
  }

  return out;
}

/** @deprecated Prefer fetchDexScreenerMetaMap */
export async function fetchDexScreenerLogoMap(
  addresses: string[],
  preferredNetwork?: string,
): Promise<Map<string, string>> {
  const meta = await fetchDexScreenerMetaMap(addresses, preferredNetwork);
  const out = new Map<string, string>();
  for (const [addr, row] of meta) {
    if (row.imageUrl) out.set(addr, row.imageUrl);
  }
  return out;
}

async function fetchJupiterMeta(mint: string): Promise<TokenVisualMeta | null> {
  const addr = mint.trim();
  if (!addr) return null;
  try {
    const res = await fetch(
      `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(addr)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      id?: string;
      icon?: string | null;
      symbol?: string;
      name?: string;
    }>;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const exact = rows.find((r) => (r.id || "").toLowerCase() === addr.toLowerCase()) || rows[0];
    const icon = exact?.icon;
    return {
      imageUrl: typeof icon === "string" && icon.length > 0 ? icon : null,
      symbol: exact?.symbol ? String(exact.symbol).toUpperCase() : null,
      name: exact?.name ? String(exact.name) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve logos + tickers for wallet tape / holdings.
 * Order: DexScreener → Jupiter (Solana) → Birdeye (optional key) → Dex CDN.
 */
export async function resolveTokenVisualMeta(
  keys: LogoKey[],
): Promise<Map<string, TokenVisualMeta>> {
  const out = new Map<string, TokenVisualMeta>();
  const clean = keys.filter((k) => k.address && k.address.trim().length >= 8);
  if (clean.length === 0) return out;

  const byNetwork = new Map<string, string[]>();
  for (const k of clean) {
    const net = normalizeNetwork(k.network);
    const list = byNetwork.get(net) || [];
    list.push(k.address.trim());
    byNetwork.set(net, list);
  }

  const dsByKey = new Map<string, TokenVisualMeta>();
  await Promise.all(
    [...byNetwork.entries()].map(async ([net, addrs]) => {
      const map = await fetchDexScreenerMetaMap(addrs, net);
      for (const [addr, meta] of map) dsByKey.set(`${net}:${addr}`, meta);
    }),
  );

  const solMints = [...new Set((byNetwork.get("solana") || []).map((a) => a.trim()))];
  const jupMissing = solMints.filter((mint) => {
    const hit = dsByKey.get(`solana:${mint.toLowerCase()}`);
    return !hit?.imageUrl || !hit?.symbol;
  });
  const jupHits = await Promise.all(
    jupMissing.slice(0, 20).map(async (mint) => {
      const meta = await fetchJupiterMeta(mint);
      return meta ? ([mint, meta] as const) : null;
    }),
  );
  for (const hit of jupHits) {
    if (!hit) continue;
    const key = `solana:${hit[0].toLowerCase()}`;
    const prev = dsByKey.get(key);
    dsByKey.set(key, {
      imageUrl: prev?.imageUrl || hit[1].imageUrl,
      symbol: prev?.symbol || hit[1].symbol,
      name: prev?.name || hit[1].name,
    });
  }

  const stillMissing = clean.filter((k) => {
    const net = normalizeNetwork(k.network);
    const hit = dsByKey.get(`${net}:${k.address.trim().toLowerCase()}`);
    return !hit?.imageUrl || !hit?.symbol;
  });

  if (birdeyeEnabled() && stillMissing.length > 0) {
    const bird = await fetchBirdeyeMetaBatch(stillMissing, 10);
    for (const [key, meta] of bird) {
      const prev = dsByKey.get(key);
      dsByKey.set(key, {
        imageUrl: prev?.imageUrl || meta.imageUrl,
        symbol: prev?.symbol || meta.symbol,
        name: prev?.name || meta.name,
      });
    }
  }

  for (const k of clean) {
    const net = normalizeNetwork(k.network);
    const addr = k.address.trim();
    const key = logoKey(net, addr);
    const fromApi = dsByKey.get(`${net}:${addr.toLowerCase()}`);
    const cdn = dexScreenerTokenImageUrl(net, addr);
    out.set(key, {
      imageUrl: fromApi?.imageUrl || cdn,
      symbol: fromApi?.symbol || null,
      name: fromApi?.name || null,
    });
  }

  return out;
}

/** Logo-only helper kept for callers that only need URLs. */
export async function resolveTokenLogoUrls(keys: LogoKey[]): Promise<Map<string, string>> {
  const meta = await resolveTokenVisualMeta(keys);
  const out = new Map<string, string>();
  for (const [key, row] of meta) {
    if (row.imageUrl) out.set(key, row.imageUrl);
  }
  return out;
}

export function pickResolvedLogo(
  map: Map<string, string>,
  network: string,
  address: string | null | undefined,
): string | null {
  if (!address) return null;
  return map.get(logoKey(network, address)) ?? dexScreenerTokenImageUrl(network, address);
}

export function pickResolvedMeta(
  map: Map<string, TokenVisualMeta>,
  network: string,
  address: string | null | undefined,
): TokenVisualMeta | null {
  if (!address) return null;
  return (
    map.get(logoKey(network, address)) || {
      imageUrl: dexScreenerTokenImageUrl(network, address),
      symbol: null,
      name: null,
    }
  );
}
