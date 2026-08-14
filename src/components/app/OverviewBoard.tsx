"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  Bell,
  ChevronDown,
  Layers,
  Search,
  Shield,
  TrendingUp,
} from "lucide-react";
import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";
import { useDesk } from "@/lib/app-store";

const moveIcons = {
  buy: TrendingUp,
  flow: ArrowRightLeft,
  alert: Bell,
  stake: Layers,
};

const statusClass = {
  Confirmed: "text-teal-400",
  Live: "text-amber-400",
  Watching: "text-zinc-400",
};

const types = ["all", "buy", "flow", "alert", "stake"] as const;
const periods = ["All", "Today", "Yesterday"] as const;

export function OverviewBoard() {
  const { wallets, alerts, tokens, moves } = useDesk();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("all");
  const [period, setPeriod] = useState<(typeof periods)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return moves.filter((move) => {
      if (type !== "all" && move.type !== type) return false;
      if (period !== "All" && move.date !== period) return false;
      if (!q) return true;
      return (
        move.wallet.toLowerCase().includes(q) ||
        move.asset.toLowerCase().includes(q) ||
        move.action.toLowerCase().includes(q)
      );
    });
  }, [moves, query, type, period]);

  const dates = [...new Set(filtered.map((move) => move.date))];
  const avgScore = Math.round(
    wallets.reduce((sum, wallet) => sum + wallet.score, 0) / Math.max(wallets.length, 1),
  );
  const lead = [...tokens].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="space-y-4">
      <section className="dash-hero relative overflow-hidden rounded-[22px] border border-white/[0.08] px-5 py-6 sm:px-7 sm:py-7">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Opportunity score
            </p>
            <p className="mt-2 font-sans text-[3.1rem] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[3.6rem]">
              {avgScore}
            </p>
            <p className="mt-3 font-mono text-[12px] text-zinc-400">
              Smart-money bias{" "}
              <span className="font-semibold text-teal-400">
                {avgScore >= 70 ? "Risk-on" : "Neutral"}
              </span>
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex -space-x-2">
                {tokens.slice(0, 5).map((token) => (
                  <Link
                    key={token.symbol}
                    href={`/app/screener?token=${token.symbol}`}
                    className="rounded-full ring-2 ring-[#0c0c0e]"
                  >
                    <TokenMark symbol={token.symbol} size={28} />
                  </Link>
                ))}
              </div>
              <Link
                href="/app/screener"
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[11px] text-zinc-300 hover:text-white"
              >
                {tokens.length} tokens
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link
              href="/app/alerts"
              className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 font-mono text-[11px] text-teal-300"
            >
              <Shield className="h-3.5 w-3.5" strokeWidth={1.7} />
              {alerts.length} alerts live
            </Link>
            <p className="max-w-[220px] font-mono text-[11px] leading-5 text-zinc-500 lg:text-right">
              {lead
                ? `${lead.symbol} leads the board at ${lead.score} with ${lead.change24h}.`
                : "Watchlist is empty."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/app/wallets"
          className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3.5 hover:border-white/16"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Active desks
            </p>
            <p className="mt-1 font-sans text-lg font-semibold text-white">
              {wallets.length} wallets tracked
            </p>
          </div>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] text-zinc-300">
            Open
          </span>
        </Link>
        <Link
          href="/app/screener"
          className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3.5 hover:border-white/16"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Scoreboard
            </p>
            <p className="mt-1 font-sans text-lg font-semibold text-teal-400">
              {lead ? `${lead.change24h} ${lead.symbol} lead` : "No tokens"}
            </p>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">24h</span>
        </Link>
      </div>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-sans text-[15px] font-semibold text-white">Latest intelligence</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 min-w-[180px] flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 sm:flex-none">
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activity"
                className="w-full bg-transparent font-mono text-[11px] text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            <label className="inline-flex h-9 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 font-mono text-[11px] text-zinc-400">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as (typeof types)[number])}
                className="bg-transparent outline-none"
              >
                {types.map((item) => (
                  <option key={item} value={item} className="bg-[#0c0c0e]">
                    {item === "all" ? "Signal type" : item}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3" />
            </label>
            <label className="inline-flex h-9 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 font-mono text-[11px] text-zinc-400">
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as (typeof periods)[number])}
                className="bg-transparent outline-none"
              >
                {periods.map((item) => (
                  <option key={item} value={item} className="bg-[#0c0c0e]">
                    {item === "All" ? "Period" : item}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3" />
            </label>
          </div>
        </div>

        {dates.length === 0 ? (
          <p className="py-8 text-center font-mono text-[12px] text-zinc-600">
            No activity matches those filters.
          </p>
        ) : (
          dates.map((date) => (
            <div key={date} className="mb-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                {date}
              </p>
              <ul className="space-y-1.5">
                {filtered
                  .filter((move) => move.date === date)
                  .map((move) => {
                    const Icon = moveIcons[move.type] ?? ArrowDownLeft;
                    const wallet = wallets.find((item) => item.label === move.wallet);
                    return (
                      <li key={move.id}>
                        <Link
                          href={
                            wallet
                              ? `/app/wallets?id=${wallet.id}`
                              : `/app/screener?token=${move.asset}`
                          }
                          className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.025]"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-zinc-300">
                            <Icon className="h-4 w-4" strokeWidth={1.6} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-medium text-white">
                                {move.action}
                              </p>
                              <span className={cn("font-mono text-[11px]", statusClass[move.status])}>
                                {move.status}
                              </span>
                            </div>
                            <p className="truncate font-mono text-[11px] text-zinc-500">
                              {move.wallet}
                            </p>
                          </div>
                          <div className="hidden items-center gap-2 sm:flex">
                            <TokenMark symbol={move.asset} size={22} />
                            <span className="font-mono text-[12px] text-zinc-300">{move.asset}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[12px] text-white">
                              {move.amount} {move.asset}
                            </p>
                            <p className="font-mono text-[11px] text-zinc-500">
                              {move.usd} · {move.time}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
