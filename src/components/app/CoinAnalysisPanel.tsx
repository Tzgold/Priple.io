"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Droplets, Globe, Newspaper, Radio, Shield, Users } from "lucide-react";
import { OpportunityScoreCard } from "@/components/app/OpportunityScoreCard";
import { cn } from "@/lib/cn";
import type { CoinAnalysis } from "@/lib/coin-analysis";

function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function formatCount(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

function relativeHeadline(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function CoinAnalysisPanel({
  network,
  address,
  whyHere,
  trackedWalletBuys,
}: {
  network: string;
  address: string;
  whyHere?: string | null;
  trackedWalletBuys?: number;
}) {
  const [analysis, setAnalysis] = useState<CoinAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const qs = new URLSearchParams({ network, address });
    if (whyHere) qs.set("why", whyHere);
    if (trackedWalletBuys != null && trackedWalletBuys > 0) {
      qs.set("walletBuys", String(trackedWalletBuys));
    }

    void (async () => {
      try {
        const res = await fetch(`/api/token/analyze?${qs.toString()}`, {
          credentials: "include",
        });
        const data = (await res.json()) as { analysis?: CoinAnalysis; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.analysis) {
          setError(data.error || "Analysis unavailable");
          return;
        }
        setAnalysis(data.analysis);
      } catch {
        if (!cancelled) setError("Analysis failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [network, address, whyHere, trackedWalletBuys]);

  const website = safeHttpUrl(analysis?.social.websites[0]);

  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-black/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
            Research brief
          </p>
          <h3 className="mt-1 font-sans text-[16px] font-semibold text-white">
            {loading ? "Reading market + on-chain feeds…" : analysis?.headline || "Analysis"}
          </h3>
        </div>
        {analysis ? (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase",
              analysis.risk.level === "high"
                ? "border-rose-500/30 text-rose-300"
                : analysis.risk.level === "medium"
                  ? "border-amber-500/30 text-amber-200"
                  : analysis.risk.level === "low"
                    ? "border-teal-500/30 text-teal-300"
                    : "border-white/10 text-zinc-500",
            )}
          >
            Risk · {analysis.risk.level}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 font-mono text-[12px] text-rose-300">{error}</p>
      ) : null}

      {analysis ? (
        <div className="mt-4 space-y-4">
          {analysis.opportunity ? (
            <OpportunityScoreCard score={analysis.opportunity} compact />
          ) : null}
          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-3">
            {analysis.whyHere ? (
              <p className="rounded-2xl border border-teal-500/20 bg-teal-500/10 px-3 py-2.5 font-mono text-[12px] text-teal-100">
                {analysis.whyHere}
              </p>
            ) : null}
            <ul className="space-y-2">
              {analysis.summary.map((line) => (
                <li key={line} className="flex gap-2 font-mono text-[12px] leading-5 text-zinc-300">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="grid gap-2 sm:grid-cols-3">
              <StructureCard
                icon={<Droplets className="h-3.5 w-3.5" />}
                label="Liquidity"
                value={analysis.structure.liquidityNote}
              />
              <StructureCard
                icon={<Radio className="h-3.5 w-3.5" />}
                label="Volume"
                value={analysis.structure.volumeNote}
              />
              <StructureCard
                icon={<Users className="h-3.5 w-3.5" />}
                label="Holders"
                value={analysis.structure.holderNote}
              />
            </div>

            {analysis.social.description ? (
              <p className="font-mono text-[11px] leading-5 text-zinc-500">
                {analysis.social.description.slice(0, 280)}
                {analysis.social.description.length > 280 ? "…" : ""}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
                >
                  <Globe className="h-3 w-3" /> Website
                </a>
              ) : null}
              {analysis.social.twitter ? (
                <a
                  href={`https://x.com/${encodeURIComponent(analysis.social.twitter.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
                >
                  <Radio className="h-3 w-3" /> @{analysis.social.twitter.replace(/^@/, "")}
                </a>
              ) : null}
              {analysis.social.telegram ? (
                <a
                  href={`https://t.me/${encodeURIComponent(analysis.social.telegram.replace(/^@/, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
                >
                  Telegram
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Mini label={analysis.market.mcapKind} value={analysis.market.mcapLabel} />
              <Mini label="Price" value={analysis.market.priceLabel} />
              <Mini label="24H" value={analysis.market.change24hLabel} />
              <Mini label="Liquidity" value={analysis.market.liquidityLabel} />
              <Mini label="24H Vol" value={analysis.market.volumeLabel} />
              <Mini label="Liq / MCap" value={analysis.market.depthLabel || "—"} />
              <Mini label="Holders" value={analysis.holders.countLabel} />
              <Mini label="Top 10" value={analysis.holders.top10Label} />
              <Mini label="Next 20" value={analysis.holders.next20Label} />
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-2.5">
              <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                <Shield className="h-3 w-3" /> Risk notes
              </p>
              <ul className="space-y-1.5">
                {analysis.risk.notes.map((note) => (
                  <li key={note} className="flex gap-2 font-mono text-[11px] text-zinc-400">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-zinc-600" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
            <p className="font-mono text-[10px] text-zinc-600">
              Sources: {analysis.sources.join(" · ")} · research only, not advice
            </p>
          </div>
          </div>

          {analysis.intel ? (
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  <Newspaper className="h-3 w-3" /> Social + news
                </p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase",
                    analysis.intel.social.heatLabel === "hot"
                      ? "border-teal-500/30 text-teal-300"
                      : analysis.intel.social.heatLabel === "warming"
                        ? "border-amber-500/30 text-amber-200"
                        : "border-white/10 text-zinc-500",
                  )}
                >
                  {analysis.intel.social.heatLabel === "unknown"
                    ? "Heat · no data"
                    : `Heat · ${analysis.intel.social.heatLabel}${analysis.intel.social.heat != null ? ` · ${analysis.intel.social.heat}` : ""}`}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Mini label="X followers" value={formatCount(analysis.intel.social.twitterFollowers)} />
                <Mini label="Reddit" value={formatCount(analysis.intel.social.redditSubscribers)} />
                <Mini
                  label="Sentiment"
                  value={
                    analysis.intel.social.sentimentUpPct != null
                      ? `${analysis.intel.social.sentimentUpPct.toFixed(0)}% up`
                      : "—"
                  }
                />
                <Mini
                  label="Headlines"
                  value={String(analysis.intel.headlines.length || "—")}
                />
              </div>

              <ul className="mt-3 space-y-2">
                {analysis.intel.pulse.map((line) => (
                  <li key={line} className="font-mono text-[12px] leading-5 text-zinc-300">
                    {line}
                  </li>
                ))}
              </ul>

              {analysis.intel.headlines.length > 0 ? (
                <ul className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                  {analysis.intel.headlines.slice(0, 4).map((row) => (
                    <li key={row.id}>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl px-1 py-1 hover:bg-white/[0.03]"
                      >
                        <p className="truncate font-mono text-[12px] text-zinc-200">{row.title}</p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                          {row.source} · {relativeHeadline(row.publishedAt)}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : loading ? (
        <p className="mt-6 font-mono text-[12px] text-zinc-600">Building brief…</p>
      ) : null}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <p className="mt-1 truncate font-mono text-[12px] text-zinc-200">{value}</p>
    </div>
  );
}

function StructureCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-2.5">
      <p className="mb-1 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
        {icon}
        {label}
      </p>
      <p className="font-mono text-[11px] leading-4 text-zinc-300">{value}</p>
    </div>
  );
}
