"use client";

import { Newspaper, Radio, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { IntelHeadline } from "@/lib/coin-intel";
import type { WalletChartMark } from "@/lib/wallet-dossier";

export type TapeItem = {
  id: string;
  kind: "buy" | "sell" | "news";
  timeSec: number;
  label: string;
  href?: string | null;
};

function relative(timeSec: number) {
  const mins = Math.max(0, Math.floor((Date.now() / 1000 - timeSec) / 60));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function buildIntelTape(input: {
  headlines?: IntelHeadline[];
  marks?: WalletChartMark[];
}): TapeItem[] {
  const items: TapeItem[] = [];

  for (const mark of input.marks ?? []) {
    items.push({
      id: `w-${mark.walletAddress || "w"}-${mark.time}-${mark.side}-${mark.hash || mark.text}`,
      kind: mark.side,
      timeSec: mark.time,
      label: `${mark.walletLabel || "Wallet"} ${mark.side} ${mark.asset}`,
    });
  }

  for (const row of input.headlines ?? []) {
    items.push({
      id: `n-${row.id}`,
      kind: "news",
      timeSec: row.timeSec,
      label: row.title,
      href: row.url,
    });
  }

  return items.sort((a, b) => b.timeSec - a.timeSec).slice(0, 12);
}

export function CoinIntelTape({
  items,
  loading = false,
}: {
  items: TapeItem[];
  loading?: boolean;
}) {
  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-black/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
          Timeline overlay
        </p>
        <div className="flex flex-wrap gap-3 font-mono text-[9px] text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" /> Wallet buy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Wallet sell
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> News
          </span>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <p className="mt-3 font-mono text-[11px] text-zinc-600">Reading social + news feeds…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 font-mono text-[11px] leading-5 text-zinc-500">
          No dated wallet marks or headlines in this window. The research brief below still lists social links when they exist.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.map((item) => {
            const inner = (
              <span className="flex min-w-0 items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    item.kind === "buy"
                      ? "bg-teal-400"
                      : item.kind === "sell"
                        ? "bg-rose-400"
                        : "bg-white",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[11px] text-zinc-200">{item.label}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                    {item.kind === "news" ? (
                      <Newspaper className="h-2.5 w-2.5" />
                    ) : item.kind === "buy" ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <Radio className="h-2.5 w-2.5" />
                    )}
                    {item.kind} · {relative(item.timeSec)}
                  </span>
                </span>
              </span>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl px-1 py-1 hover:bg-white/[0.03]"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="px-1 py-1">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
