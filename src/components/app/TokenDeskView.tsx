"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Globe, MessageCircle, Radio } from "lucide-react";
import { TokenCandleChart } from "@/components/app/TokenCandleChart";
import { TradingViewAdvancedChart } from "@/components/app/TradingViewAdvancedChart";
import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";
import { aggregateCandles, estimateMarketCap, toMarketCapCandles } from "@/lib/candle-math";
import type { Candle, TokenDesk, TokenTrade } from "@/lib/geckoterminal";
import { TV_SYMBOL_BY_CG } from "@/lib/token-routes";

type IntervalKey = "1m" | "15m" | "1H" | "4H" | "1D";
type ChartScale = "price" | "mcap";

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
}: {
  network: string;
  address: string;
  compact?: boolean;
}) {
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
  const [chartMode, setChartMode] = useState<"dex" | "tradingview">("dex");
  const [chartScale, setChartScale] = useState<ChartScale>("price");

  const cfg = intervals[interval];
  const tvSymbol =
    (token?.coingeckoId && TV_SYMBOL_BY_CG[token.coingeckoId]) ||
    (network === "coingecko" ? TV_SYMBOL_BY_CG[address] : null) ||
    null;

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

  const canMcapChart =
    (token?.supply != null && token.supply > 0) ||
    (mcap.value != null && token?.priceUsd != null && token.priceUsd > 0);

  const chartSupply = useMemo(() => {
    if (token?.supply != null && token.supply > 0) return token.supply;
    if (mcap.value != null && token?.priceUsd != null && token.priceUsd > 0) {
      return mcap.value / token.priceUsd;
    }
    return null;
  }, [token?.supply, token?.priceUsd, mcap.value]);

  const candles = useMemo(() => {
    if (network === "coingecko") {
      const series = aggregateCandles(cgCandles, interval, 300);
      return chartScale === "mcap" ? toMarketCapCandles(series, chartSupply) : series;
    }
    const shortTf = interval === "1m" || interval === "15m";
    const base = shortTf ? base1m : base1h.length > 0 ? base1h : base1m;
    const sourceSeconds = shortTf || base1h.length === 0 ? 60 : 3600;
    const series = aggregateCandles(base, interval, sourceSeconds);
    return chartScale === "mcap" ? toMarketCapCandles(series, chartSupply) : series;
  }, [network, cgCandles, base1m, base1h, interval, chartScale, chartSupply]);

  useEffect(() => {
    if (tvSymbol) setChartMode("tradingview");
    else setChartMode("dex");
  }, [tvSymbol, network, address]);

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
        const res = await fetch(`/api/token?${qs.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          token?: TokenDesk;
          candles?: Candle[];
          trades?: TokenTrade[];
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Failed to load");
          return;
        }
        if (cancelled) return;
        setToken(data.token ?? null);
        setTrades(data.trades ?? []);
        setBase1m(data.candles ?? []);
        setIntervalKey("15m");

        const pool = data.token?.poolAddress;
        if (pool) {
          const hourQs = new URLSearchParams({
            network: data.token!.network,
            pool,
            timeframe: "hour",
            aggregate: "1",
          });
          try {
            const hourRes = await fetch(`/api/token/ohlcv?${hourQs.toString()}`, {
              credentials: "include",
            });
            const hourData = (await hourRes.json()) as {
              candles?: Candle[];
              error?: string;
            };
            if (!cancelled) {
              if (hourRes.ok) setBase1h(hourData.candles ?? []);
              else if (hourData.error) setCandleNote(hourData.error);
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

  const changeClass = useMemo(() => {
    const value = token?.priceChange24h ?? 0;
    if (value > 0) return "text-teal-400";
    if (value < 0) return "text-rose-400";
    return "text-zinc-400";
  }, [token?.priceChange24h]);

  const socials = token?.info?.socials || token?.socials || null;

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

      <section className="rounded-[20px] border border-white/[0.08] bg-black/30 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <TokenMark symbol={token?.symbol || "ETH"} imageUrl={token?.imageUrl} size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-sans text-xl font-semibold text-white">
                  {token?.name || "…"}
                </h2>
                <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase text-zinc-400">
                  {token?.symbol || "—"}
                </span>
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
              <div className="mt-2 flex flex-wrap gap-2">
                {socials?.websites?.[0] ? (
                  <SocialChip href={socials.websites[0]} label="Website" icon={<Globe className="h-3 w-3" />} />
                ) : null}
                {socials?.twitter ? (
                  <SocialChip
                    href={`https://x.com/${socials.twitter}`}
                    label={`@${socials.twitter}`}
                    icon={<Radio className="h-3 w-3" />}
                  />
                ) : null}
                {socials?.telegram ? (
                  <SocialChip
                    href={`https://t.me/${socials.telegram}`}
                    label="Telegram"
                    icon={<MessageCircle className="h-3 w-3" />}
                  />
                ) : null}
                {socials?.discord ? (
                  <SocialChip href={socials.discord} label="Discord" icon={<MessageCircle className="h-3 w-3" />} />
                ) : null}
                <SocialChip
                  href={explorerTokenUrl(network, address)}
                  label="Explorer"
                  icon={<ExternalLink className="h-3 w-3" />}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:min-w-[560px]">
            <Metric label={mcap.label} value={money(mcap.value)} />
            <Metric label="Price" value={money(token?.priceUsd)} />
            <Metric
              label="24h"
              value={
                token?.priceChange24h == null
                  ? "—"
                  : `${token.priceChange24h > 0 ? "+" : ""}${token.priceChange24h.toFixed(2)}%`
              }
              className={changeClass}
            />
            <Metric label="24h vol" value={money(token?.volume24hUsd)} />
            <Metric label="Liquidity" value={money(token?.liquidityUsd)} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#050506]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Chart · {chartMode === "tradingview" ? "TradingView" : "DEX"}
            </p>
            {tvSymbol ? (
              <div className="flex gap-1 rounded-full border border-white/10 p-0.5">
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
                <button
                  type="button"
                  onClick={() => setChartMode("dex")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px]",
                    chartMode === "dex" ? "bg-white text-[#09090b]" : "text-zinc-500 hover:text-white",
                  )}
                >
                  DEX
                </button>
              </div>
            ) : null}
            {chartMode === "dex" && canMcapChart ? (
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
        </div>
        {candleNote ? (
          <p className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 font-mono text-[11px] text-amber-200">
            {candleNote}
          </p>
        ) : null}
        {chartMode === "tradingview" && tvSymbol ? (
          <TradingViewAdvancedChart
            key={`${tvSymbol}-${interval}`}
            symbol={tvSymbol}
            interval={cfg.tv}
          />
        ) : loadingCandles && candles.length === 0 ? (
          <p className="px-4 py-20 text-center font-mono text-[12px] text-zinc-600">
            Loading {interval} candles…
          </p>
        ) : candles.length === 0 ? (
          <p className="px-4 py-20 text-center font-mono text-[12px] text-zinc-600">
            No candles yet for this token / interval.
          </p>
        ) : (
          <TokenCandleChart
            key={`${network}-${address}-${interval}-${candles[0]?.time ?? 0}-${candles.length}`}
            candles={candles}
            heightClass={compact ? "h-[320px] w-full sm:h-[380px]" : "h-[380px] w-full sm:h-[460px]"}
          />
        )}
      </section>

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
          </div>
        ) : tab === "overview" ? (
          <div className="space-y-2 px-4 py-4 font-mono text-[12px] text-zinc-400">
            <p>
              Full research desk for anything a tracked wallet can buy — majors and tiny memecoins.
            </p>
            {token?.info?.description ? (
              <p className="leading-5 text-zinc-500">{token.info.description.slice(0, 420)}</p>
            ) : null}
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

function SocialChip({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:border-white/20 hover:text-white"
    >
      {icon}
      {label}
    </a>
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
