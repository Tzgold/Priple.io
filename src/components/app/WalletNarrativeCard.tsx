"use client";

import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WalletNarrative } from "@/lib/wallet-narrative";

export function WalletNarrativeCard({
  narrative,
  compact = false,
}: {
  narrative: WalletNarrative;
  compact?: boolean;
}) {
  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-black/30">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#151517] text-zinc-300">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-white">Priple Narrative</p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              Grounded briefing · not a prediction
            </p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-zinc-500" />
      </div>

      <div className={cn("p-4", compact ? "sm:p-4" : "sm:p-5")}>
        <h3 className="font-sans text-[16px] font-semibold text-white">{narrative.headline}</h3>
        <div className="mt-3 space-y-3">
          {(compact ? narrative.paragraphs.slice(0, 2) : narrative.paragraphs).map((line) => (
            <p key={line} className="text-[13px] leading-6 text-zinc-300">
              {line}
            </p>
          ))}
        </div>

        {narrative.highlight ? (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              {narrative.highlight.title}
            </p>
            <p className="mt-1.5 font-mono text-[11px] leading-5 text-zinc-400">
              {narrative.highlight.body}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {narrative.facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-white/[0.08] bg-[#09090b] px-3 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                {fact.label}
              </p>
              <p
                className={cn(
                  "mt-1 font-mono text-[13px]",
                  fact.tone === "up"
                    ? "text-teal-300"
                    : fact.tone === "down"
                      ? "text-rose-300"
                      : "text-white",
                )}
              >
                {fact.value}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 font-mono text-[10px] text-zinc-600">
          Sources: {narrative.sources.join(" · ")} · research only
        </p>
      </div>
    </section>
  );
}
