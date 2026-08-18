import { SYMBOL_TO_CG } from "@/lib/token-routes";

export type IntelHeadline = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  timeSec: number;
};

export type IntelSocial = {
  twitterFollowers: number | null;
  redditSubscribers: number | null;
  redditPosts48h: number | null;
  telegramUsers: number | null;
  sentimentUpPct: number | null;
  heat: number | null;
  heatLabel: "unknown" | "quiet" | "warming" | "hot";
};

export type CoinIntel = {
  symbol: string;
  coingeckoId: string | null;
  social: IntelSocial;
  headlines: IntelHeadline[];
  notice: string | null;
  pulse: string[];
  sources: string[];
  generatedAt: string;
};

const NEWS_TICKER: Record<string, string> = {
  WETH: "ETH",
  WBTC: "BTC",
  WBNB: "BNB",
  WSOL: "SOL",
};

function cgHeaders() {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : undefined;
}

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function resolveCgId(input: { coingeckoId?: string | null; symbol?: string | null; network?: string; address?: string }) {
  if (input.network === "coingecko" && input.address) return input.address;
  if (input.coingeckoId) return input.coingeckoId;
  const symbol = input.symbol?.toUpperCase();
  if (symbol && SYMBOL_TO_CG[symbol]) return SYMBOL_TO_CG[symbol];
  return null;
}

function newsTicker(symbol: string | null | undefined) {
  const raw = (symbol || "").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (NEWS_TICKER[upper]) return NEWS_TICKER[upper];
  if (SYMBOL_TO_CG[upper]) return upper;
  const asId = raw.toLowerCase();
  const fromCgId = Object.entries(SYMBOL_TO_CG).find(([, id]) => id === asId);
  if (fromCgId) return fromCgId[0];
  if (upper.length <= 6 && /^[A-Z0-9]+$/.test(upper)) return upper;
  return null;
}

type CgCommunity = {
  id: string;
  symbol: string;
  twitterFollowers: number | null;
  redditSubscribers: number | null;
  redditPosts48h: number | null;
  telegramUsers: number | null;
  sentimentUpPct: number | null;
  notice: string | null;
};

async function fetchCgCommunity(id: string): Promise<CgCommunity | null> {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`;
  try {
    const response = await fetch(url, {
      headers: cgHeaders(),
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const coin = (await response.json()) as {
      id?: string;
      symbol?: string;
      sentiment_votes_up_percentage?: number;
      public_notice?: string | null;
      additional_notices?: string[];
      community_data?: {
        twitter_followers?: number | null;
        reddit_subscribers?: number | null;
        reddit_average_posts_48h?: number | null;
        telegram_channel_user_count?: number | null;
      };
    };
    if (!coin.id) return null;
    const notice =
      (typeof coin.public_notice === "string" && coin.public_notice.trim()) ||
      (Array.isArray(coin.additional_notices) ? coin.additional_notices.find((n) => n?.trim()) : null) ||
      null;
    return {
      id: coin.id,
      symbol: (coin.symbol || "").toUpperCase(),
      twitterFollowers: num(coin.community_data?.twitter_followers),
      redditSubscribers: num(coin.community_data?.reddit_subscribers),
      redditPosts48h: num(coin.community_data?.reddit_average_posts_48h),
      telegramUsers: num(coin.community_data?.telegram_channel_user_count),
      sentimentUpPct: num(coin.sentiment_votes_up_percentage),
      notice: typeof notice === "string" ? notice.slice(0, 280) : null,
    };
  } catch {
    return null;
  }
}

type CryptoCompareNewsItem = {
  id?: string | number;
  guid?: string;
  title?: string;
  url?: string;
  source?: string;
  source_info?: { name?: string };
  published_on?: number;
  categories?: string;
  body?: string;
};

async function fetchHeadlines(ticker: string): Promise<{ items: IntelHeadline[]; sourceOk: boolean }> {
  const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${encodeURIComponent(ticker)}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 180 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { items: [], sourceOk: false };
    const json = (await response.json()) as { Data?: CryptoCompareNewsItem[] };
    const rows = Array.isArray(json.Data) ? json.Data : [];
    const seen = new Set<string>();
    const items: IntelHeadline[] = [];

    for (const row of rows) {
      const title = (row.title || "").trim();
      const href = safeHttpsUrl(row.url);
      const timeSec = typeof row.published_on === "number" ? row.published_on : 0;
      if (!title || !href || timeSec <= 0) continue;

      const categories = (row.categories || "").toUpperCase();
      const blob = `${title} ${row.body || ""}`.toUpperCase();
      const mentioned =
        categories.split("|").includes(ticker) ||
        new RegExp(`\\b${ticker}\\b`).test(blob);
      if (!mentioned) continue;

      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      items.push({
        id: String(row.id || row.guid || href),
        title: title.slice(0, 180),
        source: (row.source_info?.name || row.source || "News").trim() || "News",
        url: href,
        publishedAt: new Date(timeSec * 1000).toISOString(),
        timeSec,
      });
      if (items.length >= 6) break;
    }

    return { items, sourceOk: true };
  } catch {
    return { items: [], sourceOk: false };
  }
}

function heatFromSocial(input: {
  twitterFollowers: number | null;
  redditSubscribers: number | null;
  redditPosts48h: number | null;
  telegramUsers: number | null;
  sentimentUpPct: number | null;
  headlineCount: number;
}): IntelSocial {
  const hasSignal =
    (input.twitterFollowers != null && input.twitterFollowers > 0) ||
    (input.redditSubscribers != null && input.redditSubscribers > 0) ||
    (input.redditPosts48h != null && input.redditPosts48h > 0) ||
    (input.telegramUsers != null && input.telegramUsers > 0) ||
    input.sentimentUpPct != null ||
    input.headlineCount > 0;

  if (!hasSignal) {
    return {
      twitterFollowers: input.twitterFollowers,
      redditSubscribers: input.redditSubscribers,
      redditPosts48h: input.redditPosts48h,
      telegramUsers: input.telegramUsers,
      sentimentUpPct: input.sentimentUpPct,
      heat: null,
      heatLabel: "unknown",
    };
  }

  let heat = 18;
  if (input.twitterFollowers && input.twitterFollowers > 0) {
    heat += Math.min(24, Math.log10(input.twitterFollowers) * 7);
  }
  if (input.redditSubscribers && input.redditSubscribers > 0) {
    heat += Math.min(16, Math.log10(input.redditSubscribers) * 5);
  }
  if (input.redditPosts48h && input.redditPosts48h > 0) {
    heat += Math.min(14, input.redditPosts48h * 2.5);
  }
  if (input.telegramUsers && input.telegramUsers > 0) {
    heat += Math.min(8, Math.log10(input.telegramUsers) * 2);
  }
  if (input.sentimentUpPct != null) {
    heat += (input.sentimentUpPct - 50) * 0.35;
  }
  if (input.headlineCount > 0) {
    heat += Math.min(12, input.headlineCount * 2);
  }

  const value = clamp(heat);
  return {
    twitterFollowers: input.twitterFollowers,
    redditSubscribers: input.redditSubscribers,
    redditPosts48h: input.redditPosts48h,
    telegramUsers: input.telegramUsers,
    sentimentUpPct: input.sentimentUpPct,
    heat: value,
    heatLabel: value >= 70 ? "hot" : value >= 45 ? "warming" : "quiet",
  };
}

function buildPulse(input: {
  social: IntelSocial;
  headlines: IntelHeadline[];
  notice: string | null;
  hasSocialLinks: boolean;
}): string[] {
  const lines: string[] = [];
  const { social } = input;

  const crowd: string[] = [];
  if (social.twitterFollowers != null && social.twitterFollowers > 0) {
    crowd.push(`${formatCount(social.twitterFollowers)} X followers`);
  }
  if (social.redditSubscribers != null && social.redditSubscribers > 0) {
    crowd.push(`${formatCount(social.redditSubscribers)} Reddit subscribers`);
  }
  if (social.telegramUsers != null && social.telegramUsers > 0) {
    crowd.push(`${formatCount(social.telegramUsers)} Telegram members`);
  }
  if (crowd.length > 0) {
    lines.push(`Crowd stats on CoinGecko: ${crowd.join(", ")}.`);
  } else if (input.hasSocialLinks) {
    lines.push("Public social links exist, but CoinGecko has no crowd counts for this ticker.");
  } else {
    lines.push("No verified social crowd stats in CoinGecko for this ticker.");
  }

  if (social.sentimentUpPct != null && social.heatLabel !== "unknown") {
    lines.push(
      `CoinGecko sentiment sample is ${social.sentimentUpPct.toFixed(0)}% up-votes (${social.heatLabel} heat).`,
    );
  } else if (social.redditPosts48h != null && social.redditPosts48h > 0) {
    lines.push(`Reddit averaged ${social.redditPosts48h.toFixed(1)} posts over 48h.`);
  }

  if (input.headlines[0]) {
    const lead = input.headlines[0];
    lines.push(
      `Latest headline in feeds: “${lead.title}” (${lead.source}${input.headlines.length > 1 ? `, +${input.headlines.length - 1} more` : ""}).`,
    );
  } else {
    lines.push("No dated headlines matched this ticker in the news feed.");
  }

  if (input.notice) {
    lines.push(`Official notice: ${input.notice}`);
  }

  return lines.slice(0, 5);
}

/** Social heat + dated headlines. Template copy only — no invented narrative. */
export async function fetchCoinIntel(input: {
  network?: string;
  address?: string;
  coingeckoId?: string | null;
  symbol?: string | null;
  hasSocialLinks?: boolean;
}): Promise<CoinIntel> {
  const cgId = resolveCgId(input);
  const tickerGuess = newsTicker(input.symbol);
  const sources: string[] = [];

  const [community, newsGuess] = await Promise.all([
    cgId ? fetchCgCommunity(cgId) : Promise.resolve(null),
    tickerGuess ? fetchHeadlines(tickerGuess) : Promise.resolve({ items: [] as IntelHeadline[], sourceOk: false }),
  ]);

  const ticker = newsTicker(community?.symbol || input.symbol) || tickerGuess || (input.symbol || "TOKEN").toUpperCase();
  let headlines = newsGuess.items;
  let newsOk = newsGuess.sourceOk;
  const resolved = newsTicker(community?.symbol || input.symbol);
  if (resolved && resolved !== tickerGuess) {
    const extra = await fetchHeadlines(resolved);
    headlines = extra.items;
    newsOk = extra.sourceOk || newsOk;
  }

  if (community) sources.push("CoinGecko community");
  if (newsOk || headlines.length > 0) sources.push("CryptoCompare news");

  const social = heatFromSocial({
    twitterFollowers: community?.twitterFollowers ?? null,
    redditSubscribers: community?.redditSubscribers ?? null,
    redditPosts48h: community?.redditPosts48h ?? null,
    telegramUsers: community?.telegramUsers ?? null,
    sentimentUpPct: community?.sentimentUpPct ?? null,
    headlineCount: headlines.length,
  });

  const notice = community?.notice ?? null;
  const pulse = buildPulse({
    social,
    headlines,
    notice,
    hasSocialLinks: Boolean(input.hasSocialLinks),
  });

  return {
    symbol: ticker,
    coingeckoId: community?.id ?? cgId,
    social,
    headlines,
    notice,
    pulse,
    sources,
    generatedAt: new Date().toISOString(),
  };
}

