/** Resolve meme/DEX token logos the same way explorers do — not from ticker alone. */

import { toDexScreenerChain } from "@/lib/dexscreener";
import { normalizeNetwork } from "@/lib/geckoterminal";

type LogoKey = { network: string; address: string };

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
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  info?: { imageUrl?: string };
};

/** Batch logos from DexScreener pair `info.imageUrl` (best when uploaded). */
export async function fetchDexScreenerLogoMap(
  addresses: string[],
  preferredNetwork?: string,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
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

      const bestByAddr = new Map<string, { imageUrl: string; score: number }>();
      for (const pair of pairs) {
        const imageUrl = pair.info?.imageUrl;
        if (!imageUrl) continue;
        const chainBoost = preferred && pair.chainId === preferred ? 1_000_000_000 : 0;
        const liq = pair.liquidity?.usd ?? 0;
        const score = chainBoost + liq;
        for (const raw of [pair.baseToken?.address, pair.quoteToken?.address]) {
          const addr = (raw || "").trim().toLowerCase();
          if (!addr) continue;
          const prev = bestByAddr.get(addr);
          if (!prev || score > prev.score) bestByAddr.set(addr, { imageUrl, score });
        }
      }

      for (const [addr, hit] of bestByAddr) {
        out.set(addr, hit.imageUrl);
      }
    } catch {
      // keep partial map
    }
  }

  return out;
}

async function fetchJupiterIcon(mint: string): Promise<string | null> {
  const addr = mint.trim();
  if (!addr) return null;
  try {
    const res = await fetch(
      `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(addr)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ id?: string; icon?: string | null }>;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const exact = rows.find((r) => (r.id || "").toLowerCase() === addr.toLowerCase());
    const icon = exact?.icon || rows[0]?.icon;
    return typeof icon === "string" && icon.length > 0 ? icon : null;
  } catch {
    return null;
  }
}

/**
 * Resolve logos for wallet tape / holdings.
 * Order: DexScreener pair image → Jupiter (Solana) → DexScreener CDN URL.
 */
export async function resolveTokenLogoUrls(keys: LogoKey[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const clean = keys.filter((k) => k.address && k.address.trim().length >= 8);
  if (clean.length === 0) return out;

  const byNetwork = new Map<string, string[]>();
  for (const k of clean) {
    const net = normalizeNetwork(k.network);
    const list = byNetwork.get(net) || [];
    list.push(k.address.trim());
    byNetwork.set(net, list);
  }

  const dsByAddr = new Map<string, string>();
  await Promise.all(
    [...byNetwork.entries()].map(async ([net, addrs]) => {
      const map = await fetchDexScreenerLogoMap(addrs, net);
      for (const [addr, url] of map) dsByAddr.set(`${net}:${addr}`, url);
    }),
  );

  const solMints = [...new Set((byNetwork.get("solana") || []).map((a) => a.trim()))];
  const jupMissing = solMints.filter((mint) => !dsByAddr.has(`solana:${mint.toLowerCase()}`));
  const jupHits = await Promise.all(
    jupMissing.slice(0, 20).map(async (mint) => {
      const icon = await fetchJupiterIcon(mint);
      return icon ? ([mint, icon] as const) : null;
    }),
  );
  for (const hit of jupHits) {
    if (!hit) continue;
    dsByAddr.set(`solana:${hit[0].toLowerCase()}`, hit[1]);
  }

  for (const k of clean) {
    const net = normalizeNetwork(k.network);
    const addr = k.address.trim();
    const key = logoKey(net, addr);
    const fromApi = dsByAddr.get(`${net}:${addr.toLowerCase()}`);
    if (fromApi) {
      out.set(key, fromApi);
      continue;
    }
    const cdn = dexScreenerTokenImageUrl(net, addr);
    if (cdn) out.set(key, cdn);
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
