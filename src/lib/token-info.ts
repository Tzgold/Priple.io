export type TokenSocials = {
  websites: string[];
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
};

export type TokenHoldersInfo = {
  count: number | null;
  top10Pct: number | null;
  next20Pct: number | null;
  next20bPct: number | null;
  restPct: number | null;
  lastUpdated: string | null;
};

export type TokenSecurity = {
  gtScore: number | null;
  verified: boolean | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isHoneypot: boolean | string | null;
  developerHoldingPct: number | null;
};

export type TokenDepth = {
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  /** Rough depth proxy: liquidity / FDV when both exist. */
  depthRatio: number | null;
};

export type OnchainTokenInfo = {
  imageUrl: string | null;
  description: string | null;
  socials: TokenSocials;
  holders: TokenHoldersInfo;
  security: TokenSecurity;
  coingeckoId: string | null;
};

type Json = Record<string, unknown>;

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function cgHeaders() {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : undefined;
}

/** CoinGecko onchain token info — socials, holders summary, GT score (demo plan). */
export async function fetchOnchainTokenInfo(
  network: string,
  address: string,
): Promise<OnchainTokenInfo | null> {
  const net = network === "ethereum" ? "eth" : network;
  const url = `https://api.coingecko.com/api/v3/onchain/networks/${encodeURIComponent(net)}/tokens/${encodeURIComponent(address)}/info`;

  try {
    const response = await fetch(url, {
      headers: cgHeaders(),
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: { attributes?: Json } };
    const attrs = json.data?.attributes;
    if (!attrs) return null;

    const holders = (attrs.holders || {}) as Json;
    const distribution = (holders.distribution_percentage || {}) as Json;
    const websites = Array.isArray(attrs.websites)
      ? attrs.websites.filter((w): w is string => typeof w === "string")
      : [];

    const image =
      typeof attrs.image_url === "string"
        ? attrs.image_url
        : typeof (attrs.image as Json | undefined)?.large === "string"
          ? String((attrs.image as Json).large)
          : typeof (attrs.image as Json | undefined)?.small === "string"
            ? String((attrs.image as Json).small)
            : null;

    return {
      imageUrl: image,
      description: typeof attrs.description === "string" ? attrs.description : null,
      socials: {
        websites,
        twitter: typeof attrs.twitter_handle === "string" ? attrs.twitter_handle : null,
        telegram: typeof attrs.telegram_handle === "string" ? attrs.telegram_handle : null,
        discord: typeof attrs.discord_url === "string" ? attrs.discord_url : null,
      },
      holders: {
        count: num(holders.count),
        top10Pct: num(distribution.top_10),
        next20Pct: num(distribution["11_30"]),
        next20bPct: num(distribution["31_50"]),
        restPct: num(distribution.rest),
        lastUpdated: typeof holders.last_updated === "string" ? holders.last_updated : null,
      },
      security: {
        gtScore: num(attrs.gt_score),
        verified: typeof attrs.gt_verified === "boolean" ? attrs.gt_verified : null,
        mintAuthority: typeof attrs.mint_authority === "string" ? attrs.mint_authority : null,
        freezeAuthority: typeof attrs.freeze_authority === "string" ? attrs.freeze_authority : null,
        isHoneypot: (attrs.is_honeypot as boolean | string | null) ?? null,
        developerHoldingPct: num(attrs.developer_holding_percentage),
      },
      coingeckoId:
        typeof attrs.coingecko_coin_id === "string" ? attrs.coingecko_coin_id : null,
    };
  } catch {
    return null;
  }
}

export function buildDepth(input: {
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
}): TokenDepth {
  const basis = input.fdvUsd ?? input.marketCapUsd;
  const depthRatio =
    input.liquidityUsd != null && basis != null && basis > 0
      ? input.liquidityUsd / basis
      : null;

  return {
    liquidityUsd: input.liquidityUsd,
    volume24hUsd: input.volume24hUsd,
    fdvUsd: input.fdvUsd,
    marketCapUsd: input.marketCapUsd,
    depthRatio,
  };
}
