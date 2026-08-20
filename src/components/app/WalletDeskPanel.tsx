"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Layers3, Radio, WalletCards } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WalletDeskBrief } from "@/lib/wallet-desk";

export function WalletDeskPanel({ desk }: { desk: WalletDeskBrief }) {
  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-black/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
            Wallet desk
          </p>
          <h3 className="mt-1 font-sans text-[16px] font-semibold text-white">
            Flow · holdings · overlap
          </h3>
          <p className="mt-1 font-mono text-[11px] text-zinc-500">{desk.feedNote}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase",
              desk.live
                ? "border-teal-500/30 text-teal-300"
                : "border-white/10 text-zinc-500",
            )}
          >
            {desk.feedLabel}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase",
              desk.bias === "accumulating"
                ? "border-teal-500/30 text-teal-300"
                : desk.bias === "distributing"
                  ? "border-rose-500/30 text-rose-300"
                  : desk.bias === "mixed"
                    ? "border-amber-500/30 text-amber-200"
                    : "border-white/10 text-zinc-500",
            )}
          >
            {desk.biasLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Buys (count)" value={String(desk.buysCount)} tone="up" />
        <Mini label="Sells (count)" value={String(desk.sellsCount)} tone="down" />
        <Mini label="Buy USD" value={desk.trade.buysUsd} tone="up" />
        <Mini label="Sell USD" value={desk.trade.sellsUsd} tone="down" />
        <Mini label="Net flow" value={desk.trade.netFlowUsd} />
        <Mini label="Assets touched" value={String(desk.assetsTouched)} />
        <Mini label="Networks" value={String(desk.networksTouched)} />
        <Mini label="Holdings shown" value={String(desk.holdings.count)} />
      </div>
      <p className="mt-2 font-mono text-[10px] text-zinc-600">{desk.trade.note}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TapeList
          title="Top buys"
          icon={<ArrowUpRight className="h-3 w-3 text-teal-300" />}
          empty="No buys in this live window."
          rows={desk.trade.topBuys.map((row) => ({
            key: `buy-${row.asset}-${row.time}-${row.usd}`,
            title: row.asset,
            meta: `${row.amount} · ${row.usd} · ${row.date} ${row.time}`,
            side: "buy" as const,
          }))}
        />
        <TapeList
          title="Top sells"
          icon={<ArrowDownRight className="h-3 w-3 text-rose-300" />}
          empty="No sells in this live window."
          rows={desk.trade.topSells.map((row) => ({
            key: `sell-${row.asset}-${row.time}-${row.usd}`,
            title: row.asset,
            meta: `${row.amount} · ${row.usd} · ${row.date} ${row.time}`,
            side: "sell" as const,
          }))}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            <WalletCards className="h-3 w-3" /> Holdings snapshot
          </p>
          <p className="mb-3 font-mono text-[11px] text-zinc-500">{desk.holdings.note}</p>
          {desk.holdings.top.length === 0 ? (
            <p className="font-mono text-[11px] text-zinc-600">No holdings rows to show.</p>
          ) : (
            <ul className="space-y-1.5">
              {desk.holdings.top.map((row) => (
                <li
                  key={`${row.symbol}-${row.network}-${row.balance}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.04] bg-black/25 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-zinc-200">{row.symbol}</p>
                    <p className="font-mono text-[10px] text-zinc-600">{row.network}</p>
                  </div>
                  <p className="font-mono text-[11px] text-zinc-300">{row.balance}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            <Layers3 className="h-3 w-3" /> Overlap clusters
          </p>
          <p className="mb-3 font-mono text-[11px] text-zinc-500">{desk.overlap.note}</p>
          {desk.overlap.rows.length === 0 ? (
            <p className="font-mono text-[11px] text-zinc-600">No overlap in this pulse window.</p>
          ) : (
            <ul className="space-y-1.5">
              {desk.overlap.rows.map((row) => (
                <li
                  key={`${row.symbol}-${row.walletCount}-${row.leaderLabel ?? "none"}`}
                  className="rounded-xl border border-white/[0.04] bg-black/25 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] text-zinc-200">{row.symbol}</p>
                    <p className="font-mono text-[10px] text-zinc-500">{row.walletCount} desks</p>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                    {row.led
                      ? "This desk led the cluster"
                      : row.leaderLabel
                        ? `Leader · ${row.leaderLabel}`
                        : "No clear leader"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
        <Radio className="h-3 w-3" />
        Research only · window flow is not realized PnL
      </p>
    </section>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-[12px]",
          tone === "up" ? "text-teal-300" : tone === "down" ? "text-rose-300" : "text-zinc-200",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TapeList({
  title,
  icon,
  empty,
  rows,
}: {
  title: string;
  icon: ReactNode;
  empty: string;
  rows: Array<{ key: string; title: string; meta: string; side: "buy" | "sell" }>;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
      <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
        {icon}
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="font-mono text-[11px] text-zinc-600">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-start justify-between gap-2 rounded-xl border border-white/[0.04] bg-black/25 px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-zinc-200">{row.title}</p>
                <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{row.meta}</p>
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase",
                  row.side === "buy" ? "text-teal-300" : "text-rose-300",
                )}
              >
                {row.side}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
