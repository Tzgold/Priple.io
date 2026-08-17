"use client";

import { ArrowDownToLine, MessageSquareText, ShieldCheck, Waves } from "lucide-react";
import { cn } from "@/lib/cn";
import type { OpportunityDimension, OpportunityResult } from "@/lib/opportunity-score";

const icons = {
  flows: ArrowDownToLine,
  market: Waves,
  risk: ShieldCheck,
  social: MessageSquareText,
} as const;

function ScoreDial({ total }: { total: number }) {
  const circumference = 2 * Math.PI * 38;
  const filled = circumference * (total / 100);

  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
      <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth="6"
        />
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke="rgba(255,255,255,.9)"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="6"
        />
      </svg>
      <div className="relative text-center">
        <p className="font-sans text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          {total}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">Score</p>
      </div>
    </div>
  );
}

function DimensionRow({ dimension }: { dimension: OpportunityDimension }) {
  const Icon = icons[dimension.key];
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
          <Icon className="h-3 w-3" />
          {dimension.label}
        </span>
        <span className="font-mono text-[12px] text-white">{dimension.value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-white/85 transition-all"
          style={{ width: `${dimension.value}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] leading-4 text-zinc-500">{dimension.detail}</p>
    </div>
  );
}

export function OpportunityScoreCard({
  score,
  compact = false,
  className,
}: {
  score: OpportunityResult;
  compact?: boolean;
  className?: string;
}) {
  const tone =
    score.total >= 75
      ? "border-teal-500/25 bg-teal-500/[0.06]"
      : score.total >= 55
        ? "border-white/10 bg-white/[0.03]"
        : "border-amber-500/20 bg-amber-500/[0.05]";

  return (
    <section
      className={cn(
        "rounded-[20px] border p-4 sm:p-5",
        tone,
        className,
      )}
    >
      <div className={cn("grid gap-4", compact ? "sm:grid-cols-[auto_1fr]" : "lg:grid-cols-[auto_1fr]")}>
        <div className="flex flex-col items-center justify-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Opportunity Score
          </p>
          <ScoreDial total={score.total} />
          <p className="mt-2 max-w-[220px] text-center font-mono text-[11px] leading-5 text-zinc-400">
            {score.headline}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {score.dimensions.map((dimension) => (
            <DimensionRow key={dimension.key} dimension={dimension} />
          ))}
        </div>
      </div>
      <p className="mt-3 font-mono text-[10px] text-zinc-600">
        Ranks attention from flows, market, risk, and social feeds — not a buy signal.
      </p>
    </section>
  );
}

export function OpportunityScoreBadge({ total }: { total: number }) {
  const tone =
    total >= 75
      ? "border-teal-400/40 bg-teal-400/10 text-teal-200"
      : total >= 55
        ? "border-white/15 bg-white/[0.04] text-zinc-200"
        : "border-amber-400/30 bg-amber-400/10 text-amber-100";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tabular-nums",
        tone,
      )}
      title="Opportunity Score"
    >
      {total}
    </span>
  );
}
