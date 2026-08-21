"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Globe, MessageCircle, Star } from "lucide-react";
import { TokenCandleChart } from "@/components/app/TokenCandleChart";
import { CoinIntelTape, buildIntelTape } from "@/components/app/CoinIntelTape";
import { DexScreenerChart } from "@/components/app/DexScreenerChart";
import { TradingViewAdvancedChart } from "@/components/app/TradingViewAdvancedChart";
import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";
import { useDesk } from "@/lib/app-store";
import { aggregateCandles, canScaleCandlesToMcap, estimateMarketCap, sanitizeCandles, toMarketCapCandles } from "@/lib/candle-math";
import { dexScreenerTokenImageUrl } from "@/lib/token-logo";
import {
  dexScreenerPairPageUrl,
  fetchDexScreenerEnrichment,
  toDexScreenerChain,
  type DexPoolOption,
} from "@/lib/dexscreener";
import type { CoinIntel } from "@/lib/coin-intel";
import type { Candle, TokenDesk, TokenTrade } from "@/lib/geckoterminal";
import { TV_SYMBOL_BY_CG } from "@/lib/token-routes";
import type { WalletChartMark } from "@/lib/wallet-dossier";
import { walletAvatarUrl } from "@/lib/wallet-avatar";

type IntervalKey = "1m" | "15m" | "1H" | "4H" | "1D";
type ChartScale = "price" | "mcap";
type ChartMode = "tradingview" | "dexscreener" | "lightweight";

const intervals: Record<IntervalKey, { tv: string }> = {
  "1m": { tv: "1" },
  "15m": { tv: "15" },
  "1H": { tv: "60" },
  "4H": { tv: "240" },
  "1D": { tv: "D" },
};

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (Math.abs(value) >= 1) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(3)}`;
}

function shortAddr(value: string) {
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function explorerTokenUrl(network: string, address: string) {
  switch (network) {
    case "solana":
      return `https://solscan.io/token/${address}`;
    case "base":
      return `https://basescan.org/token/${address}`;
    case "arbitrum":
      return `https://arbiscan.io/token/${address}`;
    case "bsc":
      return `https://bscscan.com/token/${address}`;
    case "optimism":
      return `https://optimistic.etherscan.io/token/${address}`;
    case "polygon":
      return `https://polygonscan.com/token/${address}`;
    case "coingecko":
      return `https://www.coingecko.com/en/coins/${address}`;
    default:
      return `https://etherscan.io/token/${address}`;
  }
}

function relative(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

type DeskSocials = {
  websites?: string[];
  twitter?: string | null;
  telegram?: string | null;
  discord?: string | null;
};

type LoadedDesk = TokenDesk & {
  socials?: DeskSocials;
};

export function TokenDeskView({
  network,
  address,
  compact = false,
  trackWallet = null,
  trackWalletLabel = null,
  trackFocusTime = null,
  trackSide = null,
  trackWhy = null,
}: {
  network: string;
  address: string;
  compact?: boolean;
  /** Full wallet address to overlay buy/sell markers on the Priple chart. */
  trackWallet?: string | null;
  trackWalletLabel?: string | null;
  trackFocusTime?: number | null;
  trackSide?: "buy" | "sell" | null;
  trackWhy?: string | null;
}) {
  const { isTokenWatched, toggleWatchToken, trackedWallets, defaultChart } = useDesk();
  const [interval, setIntervalKey] = useState<IntervalKey>("15m");
  const [token, setToken] = useState<LoadedDesk | null>(null);
  const [base1m, setBase1m] = useState<Candle[]>([]);
  const [base1h, setBase1h] = useState<Candle[]>([]);
  const [cgCandles, setCgCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<TokenTrade[]>([]);
  const [tab, setTab] = useState<"swaps" | "holders" | "overview">("swaps");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingCandles, setLoadingCandles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candleNote, setCandleNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>("dexscreener");
  const [chartScale, setChartScale] = useState<ChartScale>("price");
  const [dsPairAddress, setDsPairAddress] = useState<string | null>(null);
  const [dsPairUrl, setDsPairUrl] = useState<string | null>(null);
  const [poolOptions, setPoolOptions] = useState<DexPoolOption[]>([]);
  const [walletMarks, setWalletMarks] = useState<WalletChartMark[]>([]);
  const [marksNote, setMarksNote] = useState<string | null>(null);
  const [intel, setIntel] = useState<CoinIntel | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  const cfg = intervals[interval];
  const tvSymbol =
    (token?.coingeckoId && TV_SYMBOL_BY_CG[token.coingeckoId]) ||
    (network === "coingecko" ? TV_SYMBOL_BY_CG[address] : null) ||
    null;

  const canDexScreener =
    network !== "coingecko" && Boolean(toDexScreenerChain(network));

  const dexChartAddress =
    dsPairAddress || token?.poolAddress || (network !== "coingecko" ? address : null);

  const mcap = useMemo(
    () =>
      estimateMarketCap({
        marketCapUsd: token?.marketCapUsd ?? null,
        fdvUsd: token?.fdvUsd ?? null,
        priceUsd: token?.priceUsd ?? null,
        supply: token?.supply ?? null,
      }),
    [token?.marketCapUsd, token?.fdvUsd, token?.priceUsd, token?.supply],
  );

  const chartSupply = useMemo(() => {
    if (token?.supply != null && token.supply > 0) return token.supply;
    if (mcap.value != null && token?.priceUsd != null && token.priceUsd > 0) {
      return mcap.value / token.priceUsd;
    }
    return null;
  }, [token?.supply, token?.priceUsd, mcap.value]);

  const canMcapChart = canScaleCandlesToMcap(chartSupply, token?.priceUsd ?? null);

  const candles = useMemo(() => {
    let series: Candle[];
    if (network === "coingecko") {
      series = aggregateCandles(cgCandles, interval, 300);
    } else {
      const shortTf = interval === "1m" || interval === "15m";
      const base = shortTf ? base1m : base1h.length > 0 ? base1h : base1m;
      const sourceSeconds = shortTf || base1h.length === 0 ? 60 : 3600;
      series = aggregateCandles(base, interval, sourceSeconds);
    }
    series = sanitizeCandles(series);
    if (chartScale === "mcap" && canScaleCandlesToMcap(chartSupply, token?.priceUsd ?? null)) {
      return toMarketCapCandles(series, chartSupply);
    }
    return series;
  }, [network, cgCandles, base1m, base1h, interval, chartScale, chartSupply, token?.priceUsd]);

  const hasUsableCandles = candles.length >= 2;
  const deskImageUrl =
    token?.imageUrl ||
    (network !== "coingecko" ? dexScreenerTokenImageUrl(network, address) : null);

  const trackingActive = Boolean(trackWallet);

  const tapeItems = useMemo(
    () => buildIntelTape({ headlines: intel?.headlines, marks: walletMarks }),
    [intel?.headlines, walletMarks],
  );

  const chartEvents = useMemo(
    () => (intel?.headlines ?? []).map((row) => ({ time: row.timeSec, title: row.title })),
    [intel],
  );

  useEffect(() => {
    if (trackingActive) {
      // Prefer Priple for wallet markers; if candles are unusable, fall back to Dex embed.
      if (!loadingCandles && !hasUsableCandles && canDexScreener && dexChartAddress) {
        setChartMode("dexscreener");
      } else {
        setChartMode("lightweight");
      }
      return;
    }
    if (tvSymbol) setChartMode("tradingview");
    else if (defaultChart === "priple") setChartMode("lightweight");
    else if (canDexScreener) setChartMode("dexscreener");
    else setChartMode("lightweight");
  }, [
    tvSymbol,
    canDexScreener,
    network,
    address,
    trackingActive,
    defaultChart,
    hasUsableCandles,
    loadingCandles,
    dexChartAddress,
  ]);

  useEffect(() => {
    if (chartScale === "mcap" && !canMcapChart) setChartScale("price");
  }, [chartScale, canMcapChart]);

  // Soft refresh of Dex stats while the desk is open (keeps header live without hammering GT).
  useEffect(() => {
    if (network === "coingecko" || !address) return;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const enrich = await fetchDexScreenerEnrichment(address, network);
          if (!enrich) return;
          setPoolOptions(enrich.pools || []);
          setToken((prev) => {
            if (!prev) return prev;
            const selected =
              enrich.pools.find((p) => p.pairAddress === dsPairAddress) || enrich.pools[0];
            return {
              ...prev,
              priceUsd: selected?.priceUsd ?? enrich.priceUsd ?? prev.priceUsd,
              marketCapUsd: selected?.marketCapUsd ?? enrich.marketCapUsd ?? prev.marketCapUsd,
              fdvUsd: selected?.fdvUsd ?? enrich.fdvUsd ?? prev.fdvUsd,
              volume24hUsd: selected?.volume24hUsd ?? enrich.volume24hUsd ?? prev.volume24hUsd,
              liquidityUsd: selected?.liquidityUsd ?? enrich.liquidityUsd ?? prev.liquidityUsd,
              priceChange24h:
                selected?.priceChange24h ?? enrich.priceChange24h ?? prev.priceChange24h,
            };
          });
        } catch {
          // keep last good values
        }
      })();
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [network, address, dsPairAddress]);

  useEffect(() => {
    if (!trackWallet || network === "coingecko") {
      setWalletMarks([]);
      setMarksNote(null);
      return;
    }

    let cancelled = false;
    const tokenAddr = address;
    void (async () => {
      try {
        const walletList = trackedWallets
          .map((w) => ({
            address: (w.fullAddress || w.address || "").trim(),
            label: w.label,
            chain: w.chain,
          }))
          .filter((w) => w.address.length >= 8)
          .filter((w) => {
            // Prefer same-chain desks for this token; always keep the focus wallet.
            if (!trackWallet) return true;
            const focus = trackWallet.toLowerCase();
            if (w.address.toLowerCase() === focus) return true;
            const want = network.toLowerCase();
            const have = (w.chain || "").toLowerCase();
            if (want === "eth" || want === "ethereum") return have === "eth" || have === "ethereum" || !have;
            if (want === "solana") return have === "sol" || have === "solana";
            if (want === "bsc") return have === "bnb" || have === "bsc";
            if (want === "arbitrum") return have === "arb" || have === "arbitrum";
            if (want === "optimism") return have === "op" || have === "optimism";
            if (want === "avalanche") return have === "avax" || have === "avalanche";
            return have === want || have.includes(want) || want.includes(have);
          });

        if (trackWallet && !walletList.some((w) => w.address.toLowerCase() === trackWallet.toLowerCase())) {
          walletList.unshift({
            address: trackWallet,
            label: trackWalletLabel || "Wallet",
            chain: network,
          });
        }

        const labels: Record<string, string> = {};
        for (const w of walletList) {
          if (w.label) labels[w.address.toLowerCase()] = w.label;
        }
        if (trackWalletLabel && trackWallet) {
          labels[trackWallet.toLowerCase()] = trackWalletLabel;
        }

        const qs = new URLSearchParams({
          token: tokenAddr,
          network,
          wallets: walletList.map((w) => w.address).join(","),
          labels: JSON.stringify(labels),
        });
        if (trackWallet) qs.set("wallet", trackWallet);
        if (trackWalletLabel) qs.set("label", trackWalletLabel);
        if (trackFocusTime != null) qs.set("at", String(trackFocusTime));
        if (trackSide) qs.set("side", trackSide);
        if (token?.symbol) qs.set("asset", token.symbol);

        const res = await fetch(`/api/wallets/marks?${qs.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          marks?: WalletChartMark[];
          error?: string;
        };
        if (cancelled) return;
        const next = (data.marks ?? []).map((mark) => ({
          ...mark,
          walletLabel: mark.walletLabel || labels[(mark.walletAddress || "").toLowerCase()] || trackWalletLabel || null,
          avatarUrl:
            mark.avatarUrl ||
            walletAvatarUrl(mark.walletAddress || trackWallet || "wallet", mark.walletLabel),
        }));
        setWalletMarks(next);
        const walletCount = new Set(
          next.map((m) => (m.walletAddress || "").toLowerCase()).filter(Boolean),
        ).size;
        setMarksNote(
          next.length > 0
            ? `${next.length} chart mark${next.length === 1 ? "" : "s"} · ${walletCount} tracked wallet${walletCount === 1 ? "" : "s"}`
            : "No matching transfers yet — click a buy/sell row from the wallet dossier to seed a mark, or wait for Alchemy history.",
        );
      } catch {
        if (!cancelled) {
          setWalletMarks([]);
          setMarksNote("Could not load wallet markers");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    trackWallet,
    trackWalletLabel,
    trackFocusTime,
    trackSide,
    network,
    address,
    trackedWallets,
    token?.symbol,
  ]);

  useEffect(() => {
    if (network !== "coingecko" && !token?.symbol) return;

    let cancelled = false;
    setLoadingIntel(true);
    setIntel(null);

    const qs = new URLSearchParams({ network, address });
    const symbol = token?.symbol;
    if (symbol) qs.set("symbol", symbol);
    if (token?.coingeckoId) qs.set("cg", token.coingeckoId);
    else if (network === "coingecko") qs.set("cg", address);
    const socials = token?.info?.socials || token?.socials;
    if (socials?.twitter || socials?.telegram || (socials?.websites?.length ?? 0) > 0) {
      qs.set("social", "1");
    }

    void (async () => {
      try {
        const res = await fetch(`/api/token/intel?${qs.toString()}`, { credentials: "include" });
        const data = (await res.json()) as { intel?: CoinIntel };
        if (cancelled) return;
        setIntel(data.intel ?? null);
      } catch {
        if (!cancelled) setIntel(null);
      } finally {
        if (!cancelled) setLoadingIntel(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [network, address, token?.symbol, token?.coingeckoId, token?.info?.socials, token?.socials]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      setLoadingMeta(true);
      setLoadingCandles(true);
      setError(null);
      setCandleNote(null);
      setBase1m([]);
      setBase1h([]);
      setCgCandles([]);
      setDsPairAddress(null);
      setDsPairUrl(null);
      setPoolOptions([]);
      setChartScale("price");
      try {
        if (network === "coingecko") {
          const res = await fetch(`/api/token/cg?id=${encodeURIComponent(address)}`, {
            credentials: "include",
          });
          const data = (await res.json()) as {
            token?: LoadedDesk & { socials?: DeskSocials; supply?: number | null };
            candles?: Candle[];
            error?: string;
          };
          if (!res.ok) {
            if (!cancelled) setError(data.error || "Failed to load");
            return;
          }
          if (cancelled) return;
          setToken(
            data.token
              ? {
                  ...data.token,
                  supply: data.token.supply ?? null,
                  info: null,
                  depth: {
                    liquidityUsd: null,
                    volume24hUsd: data.token.volume24hUsd,
                    fdvUsd: null,
                    marketCapUsd: data.token.marketCapUsd,
                    depthRatio: null,
                  },
                }
              : null,
          );
          setCgCandles(data.candles ?? []);
          setTrades([]);
          return;
        }

        // One 1m series on desk load — interval switches aggregate locally (no 429 spam).
        const qs = new URLSearchParams({
          network,
          address,
          timeframe: "minute",
          aggregate: "1",
        });
        const res = await fetchWithRetry(`/api/token?${qs.toString()}`);
        const data = (await res.json()) as {
          token?: TokenDesk;
          candles?: Candle[];
          trades?: TokenTrade[];
          error?: string;
          rateLimited?: boolean;
        };
        if (!res.ok) {
          if (!cancelled) {
            if (data.rateLimited || res.status === 429) {
              setError(null);
              setCandleNote("Market data is busy — retrying locally. Tap Retry if the chart stays empty.");
              // Still try Dex enrichment so header + Dex chart work without GT candles.
              try {
                const enrich = await fetchDexScreenerEnrichment(address, network);
                if (!cancelled && enrich) {
                  setDsPairAddress(enrich.pairAddress);
                  setDsPairUrl(enrich.pairUrl);
                  setPoolOptions(enrich.pools || []);
                  setToken({
                    network,
                    address,
                    name: address.slice(0, 8),
                    symbol: "TOKEN",
                    imageUrl: enrich.imageUrl,
                    priceUsd: enrich.priceUsd,
                    marketCapUsd: enrich.marketCapUsd,
                    fdvUsd: enrich.fdvUsd,
                    volume24hUsd: enrich.volume24hUsd,
                    liquidityUsd: enrich.liquidityUsd,
                    decimals: null,
                    supply: null,
                    coingeckoId: null,
                    poolAddress: enrich.pairAddress,
                    poolName: null,
                    priceChange24h: enrich.priceChange24h,
                    socials: enrich.socials,
                    info: null,
                    depth: {
                      liquidityUsd: enrich.liquidityUsd,
                      volume24hUsd: enrich.volume24hUsd,
                      fdvUsd: enrich.fdvUsd,
                      marketCapUsd: enrich.marketCapUsd,
                      depthRatio: null,
                    },
                  } as LoadedDesk);
                  if (!trackingActive) setChartMode("dexscreener");
                } else {
                  setError(data.error || "Market data is busy — wait a second and try again");
                }
              } catch {
                setError(data.error || "Market data is busy — wait a second and try again");
              }
            } else {
              setError(data.error || "Failed to load");
            }
          }
          return;
        }
        if (cancelled) return;

        let nextToken = data.token ?? null;

        // Fill missing mcap / liq / vol / socials from DexScreener so the header matches a real desk.
        try {
          const enrich = await fetchDexScreenerEnrichment(address, network);
          if (!cancelled && enrich && nextToken) {
            setDsPairAddress(enrich.pairAddress);
            setDsPairUrl(enrich.pairUrl);
            setPoolOptions(enrich.pools || []);
            const existingSocials =
              (nextToken as LoadedDesk).info?.socials ||
              (nextToken as LoadedDesk).socials ||
              {};
            const mergedSocials: DeskSocials = {
              websites:
                existingSocials.websites && existingSocials.websites.length > 0
                  ? existingSocials.websites
                  : enrich.socials.websites,
              twitter: existingSocials.twitter || enrich.socials.twitter,
              telegram: existingSocials.telegram || enrich.socials.telegram,
              discord: existingSocials.discord || enrich.socials.discord,
            };
            nextToken = {
              ...nextToken,
              priceUsd: nextToken.priceUsd ?? enrich.priceUsd,
              marketCapUsd: nextToken.marketCapUsd ?? enrich.marketCapUsd,
              fdvUsd: nextToken.fdvUsd ?? enrich.fdvUsd,
              volume24hUsd: nextToken.volume24hUsd ?? enrich.volume24hUsd,
              liquidityUsd: nextToken.liquidityUsd ?? enrich.liquidityUsd,
              priceChange24h: nextToken.priceChange24h ?? enrich.priceChange24h,
              poolAddress: nextToken.poolAddress || enrich.pairAddress,
              imageUrl: nextToken.imageUrl || enrich.imageUrl,
              socials: mergedSocials,
              info: nextToken.info
                ? {
                    ...nextToken.info,
                    socials: {
                      websites: mergedSocials.websites || [],
                      twitter: mergedSocials.twitter ?? null,
                      telegram: mergedSocials.telegram ?? null,
                      discord: mergedSocials.discord ?? null,
                    },
                  }
                : nextToken.info,
            } as LoadedDesk;
          } else if (!cancelled && enrich?.pairAddress) {
            setDsPairAddress(enrich.pairAddress);
            setDsPairUrl(enrich.pairUrl);
            setPoolOptions(enrich.pools || []);
          }
        } catch {
          // Keep GT-only desk.
        }

        if (cancelled) return;
        setToken(nextToken);
        setTrades(data.trades ?? []);
        setBase1m(data.candles ?? []);
        setIntervalKey("15m");

        const pool = nextToken?.poolAddress;
        if (pool) {
          // Stagger hour series so we don't stack 429s with the desk request.
          await new Promise((r) => window.setTimeout(r, 900));
          if (cancelled) return;
          const hourQs = new URLSearchParams({
            network: nextToken!.network,
            pool,
            timeframe: "hour",
            aggregate: "1",
          });
          try {
            const hourRes = await fetchWithRetry(`/api/token/ohlcv?${hourQs.toString()}`);
            const hourData = (await hourRes.json()) as {
              candles?: Candle[];
              error?: string;
              rateLimited?: boolean;
            };
            if (!cancelled) {
              if (hourRes.ok) setBase1h(hourData.candles ?? []);
              else if (hourData.rateLimited || hourRes.status === 429) {
                setCandleNote("Higher timeframes paused — market data busy. Tap Retry.");
              } else if (hourData.error) setCandleNote(hourData.error);
            }
          } catch {
            // Keep 1m base; higher TFs still work via aggregation.
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
          setLoadingCandles(false);
        }
      }
    }

    if (network && address) void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [network, address]);

  const loading = loadingMeta || loadingCandles;

  async function fetchWithRetry(url: string, attempts = 3) {
    let lastRes: Response | null = null;
    for (let i = 0; i < attempts; i += 1) {
      const res = await fetch(url, { credentials: "include" });
      lastRes = res;
      if (res.status !== 429) return res;
      await new Promise((r) => window.setTimeout(r, 700 * (i + 1)));
    }
    return lastRes!;
  }

  async function retryCandles() {
    if (!network || !address || network === "coingecko") return;
    setCandleNote(null);
    setLoadingCandles(true);
    try {
      const qs = new URLSearchParams({
        network,
        address,
        timeframe: "minute",
        aggregate: "1",
      });
      const res = await fetchWithRetry(`/api/token?${qs.toString()}`);
      const data = (await res.json()) as {
        candles?: Candle[];
        error?: string;
        rateLimited?: boolean;
      };
      if (!res.ok) {
        setCandleNote(
          data.rateLimited || res.status === 429
            ? "Market data is busy — tap Retry in a moment"
            : data.error || "Could not refresh candles",
        );
        return;
      }
      setBase1m(data.candles ?? []);
      if ((data.candles?.length || 0) === 0) {
        setCandleNote("No candles yet — Dex chart may still have live data.");
      }
    } catch {
      setCandleNote("Could not refresh candles");
    } finally {
      setLoadingCandles(false);
    }
  }

  const changeClass = useMemo(() => {
    const value = token?.priceChange24h ?? 0;
    if (value > 0) return "text-teal-400";
    if (value < 0) return "text-rose-400";
    return "text-zinc-400";
  }, [token?.priceChange24h]);

  const socials = token?.info?.socials || token?.socials || null;
  const watched = isTokenWatched(network, address);
  const liqMcapLabel =
    token?.liquidityUsd != null && mcap.value != null && mcap.value > 0
      ? `${((token.liquidityUsd / mcap.value) * 100).toFixed(1)}%`
      : "—";
  const security = token?.info?.security;
  const honeypot =
    security?.isHoneypot === true || security?.isHoneypot === "true";
  const dexPageUrl =
    dsPairUrl ||
    dexScreenerPairPageUrl(
      token?.network || network,
      dsPairAddress || token?.poolAddress || (network !== "coingecko" ? address : "") || "",
    );

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(token?.address || address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-mono text-[12px] text-rose-300">
          {error}
        </p>
      ) : null}

      <section className="rounded-[20px] border border-white/[0.08] bg-[#0a0a0c] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <TokenMark symbol={token?.symbol || "ETH"} imageUrl={deskImageUrl} size={48} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-sans text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {token?.name || "…"}
                </h2>
                <span className="font-mono text-[12px] text-zinc-500">{token?.symbol || "—"}</span>
              </div>
              <button
                type="button"
                onClick={copyAddress}
                className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                {shortAddr(token?.address || address)}
                <Copy className="h-3 w-3" />
                {copied ? <span className="text-teal-400">copied</span> : null}
              </button>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {socials?.websites?.[0] ? (
                  <IconLink href={socials.websites[0]} title="Website">
                    <Globe className="h-3.5 w-3.5" />
                  </IconLink>
                ) : null}
                {socials?.twitter ? (
                  <IconLink href={`https://x.com/${socials.twitter}`} title={`@${socials.twitter}`}>
                    <XGlyph />
                  </IconLink>
                ) : null}
                {socials?.telegram ? (
                  <IconLink href={`https://t.me/${socials.telegram}`} title="Telegram">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </IconLink>
                ) : null}
                {socials?.discord ? (
                  <IconLink href={socials.discord} title="Discord">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </IconLink>
                ) : null}
                <IconLink href={explorerTokenUrl(network, address)} title="Explorer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </IconLink>
                {dexPageUrl ? (
                  <IconLink href={dexPageUrl} title="DexScreener">
                    <DexGlyph />
                  </IconLink>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    toggleWatchToken({
                      network: token?.network || network,
                      address: token?.address || address,
                      symbol: token?.symbol || "???",
                      name: token?.name || "Token",
                      imageUrl: token?.imageUrl || null,
                    })
                  }
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                    watched
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                      : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-white",
                  )}
                  title={watched ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={cn("h-3.5 w-3.5", watched && "fill-current")} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-6">
            <HeaderStat label={mcap.label} value={money(mcap.value)} />
            <HeaderStat
              label="Price"
              value={money(token?.priceUsd)}
              emphasize
            />
            <HeaderStat
              label="24H change"
              value={
                token?.priceChange24h == null
                  ? "—"
                  : `${token.priceChange24h > 0 ? "▲ " : token.priceChange24h < 0 ? "▼ " : ""}${Math.abs(token.priceChange24h).toFixed(2)}%`
              }
              className={changeClass}
            />
            <HeaderStat label="24H Vol." value={money(token?.volume24hUsd)} />
            <HeaderStat label="Liquidity" value={money(token?.liquidityUsd)} />
            <HeaderStat label="Liq / MCap" value={liqMcapLabel} />
          </div>
          {security && (honeypot || security.gtScore != null || security.mintAuthority) ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {honeypot ? (
                <span className="rounded-full border border-rose-500/30 px-2.5 py-1 font-mono text-[10px] text-rose-300">
                  Honeypot flag
                </span>
              ) : null}
              {security.gtScore != null ? (
                <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-300">
                  GT {security.gtScore.toFixed(0)}/100
                </span>
              ) : null}
              {security.mintAuthority &&
              security.mintAuthority !== "false" &&
              security.mintAuthority !== "null" ? (
                <span className="rounded-full border border-amber-500/30 px-2.5 py-1 font-mono text-[10px] text-amber-200">
                  Mint authority
                </span>
              ) : null}
              {security.freezeAuthority &&
              security.freezeAuthority !== "false" &&
              security.freezeAuthority !== "null" ? (
                <span className="rounded-full border border-amber-500/30 px-2.5 py-1 font-mono text-[10px] text-amber-200">
                  Freeze authority
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {trackingActive ? (
        <div className="rounded-[18px] border border-teal-500/25 bg-teal-500/[0.08] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={walletAvatarUrl(trackWallet || "wallet", trackWalletLabel)}
              alt=""
              className="h-9 w-9 rounded-full border border-teal-400/40 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal-300/80">
                Wallet tracking
              </p>
              <p className="mt-0.5 font-sans text-[14px] font-medium text-white">
                {trackWalletLabel || shortAddr(trackWallet || "")}
                {trackedWallets.length > 1
                  ? ` · + overlays from ${Math.min(trackedWallets.length, 12)} tracked desks`
                  : " on this coin"}
              </p>
              <p className="mt-1 font-mono text-[11px] leading-5 text-teal-100/80">
                {trackWhy ||
                  "Profile avatars mark buys (teal) and sells (rose) on the Priple chart."}{" "}
                Chart uses Priple candles for wallet markers when available; falls back to Dex if candles are missing or invalid.
              </p>
              {marksNote ? (
                <p className="mt-2 font-mono text-[11px] text-zinc-400">{marksNote}</p>
              ) : null}
            </div>
          </div>
          {walletMarks.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {walletMarks.slice(-10).map((mark) => (
                <li
                  key={`${mark.walletAddress}-${mark.time}-${mark.side}-${mark.hash || mark.text}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px]",
                    mark.side === "buy"
                      ? "border-teal-500/30 text-teal-300"
                      : "border-rose-500/30 text-rose-300",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      mark.avatarUrl ||
                      walletAvatarUrl(mark.walletAddress || trackWallet || "w", mark.walletLabel)
                    }
                    alt=""
                    className="h-4 w-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {mark.walletLabel || shortAddr(mark.walletAddress || "")} · {mark.side}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#050506]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Chart ·{" "}
              {chartMode === "tradingview"
                ? "TradingView"
                : chartMode === "dexscreener"
                  ? "DexScreener"
                  : "Priple"}
            </p>
            <div className="flex gap-1 rounded-full border border-white/10 p-0.5">
              {!trackingActive && tvSymbol ? (
                <button
                  type="button"
                  onClick={() => setChartMode("tradingview")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px]",
                    chartMode === "tradingview"
                      ? "bg-white text-[#09090b]"
                      : "text-zinc-500 hover:text-white",
                  )}
                >
                  TradingView
                </button>
              ) : null}
              {!trackingActive && canDexScreener ? (
                <button
                  type="button"
                  onClick={() => setChartMode("dexscreener")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px]",
                    chartMode === "dexscreener"
                      ? "bg-white text-[#09090b]"
                      : "text-zinc-500 hover:text-white",
                  )}
                >
                  DexScreener
                </button>
              ) : null}
              {canDexScreener || trackingActive || !tvSymbol ? (
                <button
                  type="button"
                  onClick={() => setChartMode("lightweight")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px]",
                    chartMode === "lightweight"
                      ? "bg-white text-[#09090b]"
                      : "text-zinc-500 hover:text-white",
                  )}
                >
                  Priple{trackingActive ? " · tracking" : ""}
                </button>
              ) : null}
            </div>
            {!trackingActive && poolOptions.length > 1 ? (
              <label className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                Pool
                <select
                  value={dsPairAddress || poolOptions[0]?.pairAddress || ""}
                  onChange={(event) => {
                    const next = poolOptions.find((p) => p.pairAddress === event.target.value);
                    if (!next) return;
                    setDsPairAddress(next.pairAddress);
                    setDsPairUrl(next.pairUrl);
                    setChartMode("dexscreener");
                    setToken((prev) =>
                      prev
                        ? {
                            ...prev,
                            poolAddress: next.pairAddress,
                            priceUsd: next.priceUsd ?? prev.priceUsd,
                            marketCapUsd: next.marketCapUsd ?? prev.marketCapUsd,
                            fdvUsd: next.fdvUsd ?? prev.fdvUsd,
                            volume24hUsd: next.volume24hUsd ?? prev.volume24hUsd,
                            liquidityUsd: next.liquidityUsd ?? prev.liquidityUsd,
                            priceChange24h: next.priceChange24h ?? prev.priceChange24h,
                          }
                        : prev,
                    );
                  }}
                  className="max-w-[220px] truncate rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-300 outline-none hover:border-white/20"
                >
                  {poolOptions.map((pool) => (
                    <option key={pool.pairAddress} value={pool.pairAddress} className="bg-[#0c0c0e]">
                      {pool.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {chartMode === "lightweight" && canMcapChart ? (
              <div className="flex gap-1 rounded-full border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setChartScale("price")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px]",
                    chartScale === "price"
                      ? "bg-white text-[#09090b]"
                      : "text-zinc-500 hover:text-white",
                  )}
                >
                  Price
                </button>
                <button
                  type="button"
                  onClick={() => setChartScale("mcap")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px]",
                    chartScale === "mcap"
                      ? "bg-white text-[#09090b]"
                      : "text-zinc-500 hover:text-white",
                  )}
                >
                  MCap
                </button>
              </div>
            ) : null}
          </div>
          {chartMode === "tradingview" || chartMode === "lightweight" ? (
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(intervals) as IntervalKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIntervalKey(key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[11px]",
                    interval === key
                      ? "bg-white text-[#09090b]"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[10px] text-zinc-600">
              Use chart toolbar for intervals · Price / MCap
            </p>
          )}
        </div>
        {candleNote ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2">
            <p className="font-mono text-[11px] text-amber-200">{candleNote}</p>
            <button
              type="button"
              onClick={() => void retryCandles()}
              className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] text-amber-100 hover:bg-amber-400/20"
            >
              Retry
            </button>
          </div>
        ) : null}
        {chartMode === "tradingview" && tvSymbol ? (
          <TradingViewAdvancedChart
            key={`${tvSymbol}-${interval}`}
            symbol={tvSymbol}
            interval={cfg.tv}
          />
        ) : chartMode === "dexscreener" && dexChartAddress ? (
          <DexScreenerChart
            key={`${network}-${dexChartAddress}`}
            network={token?.network || network}
            pairOrTokenAddress={dexChartAddress}
            heightClass={compact ? "h-[460px] w-full sm:h-[560px]" : "h-[480px] w-full sm:h-[580px]"}
          />
        ) : loadingCandles && !hasUsableCandles ? (
          <p className="px-4 py-20 text-center font-mono text-[12px] text-zinc-600">
            Loading {interval} candles…
          </p>
        ) : !hasUsableCandles ? (
          <div className="space-y-3 px-4 py-16 text-center">
            <p className="font-mono text-[12px] text-zinc-500">
              No clean candles for this token / interval yet.
            </p>
            {canDexScreener && dexChartAddress ? (
              <button
                type="button"
                onClick={() => setChartMode("dexscreener")}
                className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 font-mono text-[11px] text-zinc-200 hover:bg-white/[0.1]"
              >
                Open DexScreener chart
              </button>
            ) : (
              <p className="font-mono text-[11px] text-zinc-600">
                If Dex / TradingView also miss this pair, wait for a pool to index.
              </p>
            )}
          </div>
        ) : (
          <TokenCandleChart
            key={`${network}-${address}-${interval}-${candles[0]?.time ?? 0}-${candles.length}-${walletMarks.length}`}
            candles={candles}
            marks={walletMarks}
            events={chartEvents}
            focusTime={trackFocusTime}
            heightClass={compact ? "h-[320px] w-full sm:h-[380px]" : "h-[380px] w-full sm:h-[460px]"}
          />
        )}
      </section>

      <CoinIntelTape items={tapeItems} loading={loadingIntel} />

      <section className="rounded-[20px] border border-white/[0.08] bg-black/30">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          {(
            [
              ["swaps", `Swaps (${trades.length})`],
              [
                "holders",
                `Holders${
                  token?.info?.holders.count != null
                    ? ` (${token.info.holders.count.toLocaleString("en-US")})`
                    : ""
                }`,
              ],
              ["overview", "Overview"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-3 py-1.5 font-mono text-[11px]",
                tab === key ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "holders" ? (
          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Total holders"
                value={
                  token?.info?.holders.count != null
                    ? token.info.holders.count.toLocaleString("en-US")
                    : "—"
                }
              />
              <Metric
                label="Top 10"
                value={
                  token?.info?.holders.top10Pct != null
                    ? `${token.info.holders.top10Pct.toFixed(1)}%`
                    : "—"
                }
              />
              <Metric
                label="11–30"
                value={
                  token?.info?.holders.next20Pct != null
                    ? `${token.info.holders.next20Pct.toFixed(1)}%`
                    : "—"
                }
              />
              <Metric
                label="Rest"
                value={
                  token?.info?.holders.restPct != null
                    ? `${token.info.holders.restPct.toFixed(1)}%`
                    : "—"
                }
              />
            </div>
            {token?.info?.holders.top10Pct != null ? (
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-rose-400/80" style={{ width: `${token.info.holders.top10Pct}%` }} />
                <div
                  className="bg-amber-400/70"
                  style={{ width: `${token.info.holders.next20Pct ?? 0}%` }}
                />
                <div
                  className="bg-teal-400/50"
                  style={{ width: `${token.info.holders.next20bPct ?? 0}%` }}
                />
                <div className="bg-zinc-600" style={{ width: `${token.info.holders.restPct ?? 0}%` }} />
              </div>
            ) : (
              <p className="font-mono text-[12px] text-zinc-600">
                Holder distribution unavailable for this selection.
              </p>
            )}

            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Security
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="GT score"
                  value={
                    token?.info?.security.gtScore != null
                      ? token.info.security.gtScore.toFixed(1)
                      : "—"
                  }
                />
                <Metric
                  label="Verified"
                  value={
                    token?.info?.security.verified == null
                      ? "—"
                      : token.info.security.verified
                        ? "Yes"
                        : "No"
                  }
                  className={
                    token?.info?.security.verified
                      ? "text-teal-300"
                      : token?.info?.security.verified === false
                        ? "text-amber-300"
                        : undefined
                  }
                />
                <Metric
                  label="Honeypot"
                  value={
                    token?.info?.security.isHoneypot == null
                      ? "—"
                      : String(token.info.security.isHoneypot)
                  }
                  className={
                    token?.info?.security.isHoneypot === true ||
                    token?.info?.security.isHoneypot === "true"
                      ? "text-rose-300"
                      : undefined
                  }
                />
                <Metric
                  label="Dev holding"
                  value={
                    token?.info?.security.developerHoldingPct != null
                      ? `${token.info.security.developerHoldingPct.toFixed(1)}%`
                      : "—"
                  }
                />
              </div>
              {(token?.info?.security.mintAuthority || token?.info?.security.freezeAuthority) && (
                <div className="mt-3 space-y-1 font-mono text-[11px] text-zinc-500">
                  {token.info.security.mintAuthority ? (
                    <p>Mint authority: {token.info.security.mintAuthority}</p>
                  ) : null}
                  {token.info.security.freezeAuthority ? (
                    <p>Freeze authority: {token.info.security.freezeAuthority}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : tab === "overview" ? (
          <div className="space-y-3 px-4 py-4 font-mono text-[12px] text-zinc-400">
            <p>
              Full research desk for anything a tracked wallet can buy — majors and tiny memecoins.
            </p>
            {token?.info?.description ? (
              <p className="leading-5 text-zinc-500">{token.info.description.slice(0, 420)}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Liquidity" value={money(token?.liquidityUsd)} />
              <Metric label="24H volume" value={money(token?.volume24hUsd)} />
              <Metric
                label="Depth ratio"
                value={
                  token?.depth?.depthRatio != null
                    ? `${(token.depth.depthRatio * 100).toFixed(2)}%`
                    : "—"
                }
              />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">USD</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Trader</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td
                      className={cn(
                        "px-4 py-3 font-mono text-[12px] uppercase",
                        trade.kind === "buy"
                          ? "text-teal-400"
                          : trade.kind === "sell"
                            ? "text-rose-400"
                            : "text-zinc-400",
                      )}
                    >
                      {trade.kind}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-200">{money(trade.amountUsd)}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{money(trade.priceUsd)}</td>
                    <td className="hidden px-4 py-3 font-mono text-[11px] text-zinc-500 sm:table-cell">
                      {trade.trader ? shortAddr(trade.trader) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                      {relative(trade.timestamp)}
                    </td>
                  </tr>
                ))}
                {!loading && trades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center font-mono text-[12px] text-zinc-600">
                      No recent swaps above $1.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function IconLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
    >
      {children}
    </a>
  );
}

function HeaderStat({
  label,
  value,
  className,
  emphasize,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-[88px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <div
        className={cn(
          "mt-1 truncate font-mono text-[13px] font-medium text-white sm:text-[14px]",
          emphasize && "rounded-md bg-white/[0.06] px-2 py-0.5",
          className,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function DexGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
    </svg>
  );
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <div className={cn("mt-1 truncate font-mono text-[12px] text-zinc-200", className)}>{value}</div>
    </div>
  );
}
