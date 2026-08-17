"use client";

import { useMemo, useState } from "react";
import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";

export type ScreenerListCoin = {
  id: string;
  network: string;
  address: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  meta?: string | null;
  change24h?: number | null;
  score?: number | null;
  priceUsd?: number | null;
  marketCapUsd?: number | null;
  whyHere?: string | null;
  walletAddress?: string | null;
  walletLabel?: string | null;
};

export type ScreenerFilterId =
  | "trending"
  | "watchlist"
  | "wallet-buys"
  | "majors"
  | "top-score";

const FILTERS: { id: ScreenerFilterId; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "top-score", label: "Top score" },
  { id: "majors", label: "Majors" },
  { id: "watchlist", label: "Watchlist" },
  { id: "wallet-buys", label: "Wallet buys" },
];

function formatPrice(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(3)}`;
}

function formatMc(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B MC`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M MC`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K MC`;
  return `$${value.toFixed(0)} MC`;
}

function TokenRow({
  coin,
  active,
  onSelect,
}: {
  coin: ScreenerListCoin;
  active: boolean;
  onSelect: () => void;
}) {
  const change = coin.change24h;
  const positive = change != null && change >= 0;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
          active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]",
        )}
      >
        <TokenMark symbol={coin.symbol} imageUrl={coin.imageUrl} size={34} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-white">{coin.name}</span>
          <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">
            {formatPrice(coin.priceUsd)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-[11px] text-zinc-300">{formatMc(coin.marketCapUsd)}</span>
          {change != null ? (
            <span
              className={cn(
                "mt-0.5 block font-mono text-[11px]",
                positive ? "text-teal-400" : "text-amber-400",
              )}
            >
              {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
            </span>
          ) : coin.score != null ? (
            <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">Score {coin.score}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

export function ScreenerTokenColumn({
  trending,
  watchlist,
  walletBuys,
  majors,
  topScore,
  activeId,
  loading,
  onSelect,
  searchSlot,
}: {
  trending: ScreenerListCoin[];
  watchlist: ScreenerListCoin[];
  walletBuys: ScreenerListCoin[];
  majors: ScreenerListCoin[];
  topScore: ScreenerListCoin[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (coin: ScreenerListCoin) => void;
  searchSlot?: React.ReactNode;
}) {
  const [filter, setFilter] = useState<ScreenerFilterId>("trending");

  const lists: Record<ScreenerFilterId, ScreenerListCoin[]> = useMemo(
    () => ({
      trending,
      watchlist,
      "wallet-buys": walletBuys,
      majors,
      "top-score": topScore,
    }),
    [trending, watchlist, walletBuys, majors, topScore],
  );

  const counts: Record<ScreenerFilterId, number> = {
    trending: trending.length,
    watchlist: watchlist.length,
    "wallet-buys": walletBuys.length,
    majors: majors.length,
    "top-score": topScore.length,
  };

  const coins = lists[filter];
  const emptyCopy: Record<ScreenerFilterId, string> = {
    trending: "Trending feed is syncing…",
    watchlist: "Pin coins from the desk (★) to build your watchlist.",
    "wallet-buys": "No tracked-wallet buys yet. Add wallets and wait for pulse.",
    majors: "Major coins are loading…",
    "top-score": "Scores will appear once the board syncs.",
  };

  return (
    <div className="flex min-h-0 flex-col">
      {searchSlot ? <div className="shrink-0 px-3 pb-2">{searchSlot}</div> : null}

      <div className="shrink-0 px-3 pb-2">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Tokens</p>
        <div className="screener-filter-scroll flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors",
                  active
                    ? "border-white/20 bg-white/[0.1] text-white"
                    : "border-white/[0.08] bg-transparent text-zinc-500 hover:border-white/15 hover:text-zinc-300",
                )}
              >
                {tab.label}
                {counts[tab.id] > 0 ? (
                  <span className="ml-1.5 text-[10px] text-zinc-500">{counts[tab.id]}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto py-1 [scrollbar-width:thin]">
        {loading && coins.length === 0 ? (
          <li className="px-3 py-8 text-center font-mono text-[11px] text-zinc-600">Syncing tokens…</li>
        ) : coins.length === 0 ? (
          <li className="px-3 py-8 font-mono text-[11px] leading-5 text-zinc-600">{emptyCopy[filter]}</li>
        ) : (
          coins.map((coin) => (
            <TokenRow
              key={coin.id}
              coin={coin}
              active={activeId === coin.id}
              onSelect={() => onSelect(coin)}
            />
          ))
        )}
      </ul>
    </div>
  );
}

/** @deprecated Use ScreenerListCoin */
export type RailCoin = ScreenerListCoin;
