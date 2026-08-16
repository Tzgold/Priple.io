"use client";

import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";

export type RailCoin = {
  id: string;
  network: string;
  address: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  meta?: string | null;
  change24h?: number | null;
  whyHere?: string | null;
  walletAddress?: string | null;
  walletLabel?: string | null;
};

function moneyChange(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function ScreenerRails({
  walletBuys,
  watchlist,
  trending,
  activeId,
  onSelect,
  railsCollapsed,
  onToggleCollapsed,
}: {
  walletBuys: RailCoin[];
  watchlist: RailCoin[];
  trending: RailCoin[];
  activeId: string | null;
  onSelect: (coin: RailCoin) => void;
  railsCollapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-sans text-[15px] font-semibold text-white">Coin rails</h3>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">
            Tracked-wallet buys · your watchlist · trending
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-400 hover:border-white/20 hover:text-white"
        >
          {railsCollapsed ? "Expand rails" : "Collapse rails"}
        </button>
      </div>

      {!railsCollapsed ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <RailColumn
            title="Wallet buys"
            empty="No tracked-wallet buys yet. Add wallets / wait for pulse."
            coins={walletBuys}
            activeId={activeId}
            onSelect={onSelect}
          />
          <RailColumn
            title="Watchlist"
            empty="Pin coins from the desk (★) to build your list."
            coins={watchlist}
            activeId={activeId}
            onSelect={onSelect}
          />
          <RailColumn
            title="Trending"
            empty="Trending feed is syncing…"
            coins={trending}
            activeId={activeId}
            onSelect={onSelect}
          />
        </div>
      ) : (
        <p className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 font-mono text-[11px] text-zinc-600">
          Rails collapsed — desk + analysis stay in focus. Expand anytime to pick another coin.
        </p>
      )}
    </section>
  );
}

function RailColumn({
  title,
  empty,
  coins,
  activeId,
  onSelect,
}: {
  title: string;
  empty: string;
  coins: RailCoin[];
  activeId: string | null;
  onSelect: (coin: RailCoin) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#0c0c0e]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{title}</p>
        <span className="font-mono text-[10px] text-zinc-600">{coins.length}</span>
      </div>
      <ul className="max-h-[320px] overflow-auto py-1">
        {coins.length === 0 ? (
          <li className="px-3 py-6 font-mono text-[11px] leading-5 text-zinc-600">{empty}</li>
        ) : (
          coins.map((coin) => {
            const active = activeId === coin.id;
            const ch = moneyChange(coin.change24h);
            return (
              <li key={coin.id}>
                <button
                  type="button"
                  onClick={() => onSelect(coin)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <TokenMark symbol={coin.symbol} imageUrl={coin.imageUrl} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-white">{coin.symbol}</span>
                      <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-500">
                        {coin.network === "coingecko" ? "cg" : coin.network}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                      {coin.meta || coin.name}
                    </span>
                  </span>
                  {ch ? (
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        (coin.change24h ?? 0) >= 0 ? "text-teal-400" : "text-rose-400",
                      )}
                    >
                      {ch}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
