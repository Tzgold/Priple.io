"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitBranch, Radar } from "lucide-react";
import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";
import type { FlowCluster } from "@/lib/flows";
import { tokenDeskHrefFromSymbol } from "@/lib/token-routes";
import { walletAvatarUrl } from "@/lib/wallet-avatar";

type FlowsResponse = {
  mode: "market" | "personal";
  live: boolean;
  clusters: FlowCluster[];
  crossChain: FlowCluster[];
  generatedAt: string;
};

function shortAddr(value: string) {
  if (!value || value.length < 12) return value || "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function ClusterGraph({ cluster }: { cluster: FlowCluster }) {
  const wallets = cluster.moves.slice(0, 3);
  const positions = [
    "left-3 top-4 sm:left-6",
    "bottom-4 left-3 sm:left-6",
    "right-3 top-4 sm:right-6",
  ];

  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09090b] p-3">
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.12)_0.6px,transparent_0.6px)] [background-size:14px_14px]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 220"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`flow-${cluster.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,.1)" />
            <stop offset=".5" stopColor="rgba(255,255,255,.55)" />
            <stop offset="1" stopColor="rgba(255,255,255,.1)" />
          </linearGradient>
        </defs>
        {wallets.map((_, i) => (
          <path
            key={i}
            d={`M${i === 0 ? 70 : i === 1 ? 70 : 330} ${i === 0 ? 50 : i === 1 ? 170 : 50} C200 ${i === 1 ? 170 : 60} 200 110 200 110`}
            fill="none"
            stroke={`url(#flow-${cluster.id})`}
            strokeDasharray="4 6"
          />
        ))}
      </svg>

      {wallets.map((move, index) => (
        <div
          key={move.id}
          className={cn(
            "absolute z-10 w-[118px] rounded-xl border border-white/[0.12] bg-[#151517] p-2.5",
            positions[index],
          )}
        >
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={walletAvatarUrl(move.walletAddress || move.walletLabel, move.walletLabel)}
              alt=""
              className="h-6 w-6 rounded-full border border-white/10 object-cover"
              referrerPolicy="no-referrer"
            />
            <p className="truncate text-[10px] font-medium text-white">{move.walletLabel}</p>
          </div>
          <p className="mt-1 font-mono text-[8px] text-zinc-600">{shortAddr(move.walletAddress)}</p>
          <p className="mt-1 text-[9px] text-teal-400">{move.action}</p>
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/[0.16] bg-[#151517]">
        <TokenMark symbol={cluster.symbol} size={28} />
        <p className="mt-0.5 text-[9px] font-medium text-white">{cluster.symbol}</p>
      </div>

      {cluster.windowMinutes != null ? (
        <div className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-black/50 px-2 py-1 font-mono text-[8px] text-zinc-500">
          Window · {cluster.windowMinutes}m
        </div>
      ) : null}
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: FlowCluster }) {
  const href = tokenDeskHrefFromSymbol(cluster.symbol);

  return (
    <article className="rounded-[18px] border border-white/[0.08] bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            {cluster.kind === "cross-chain" ? "Cross-chain cluster" : "Wallet overlap"}
          </p>
          <h4 className="mt-1 font-sans text-[15px] font-semibold text-white">
            {cluster.walletCount} wallets · {cluster.symbol}
          </h4>
          <p className="mt-2 max-w-xl font-mono text-[11px] leading-5 text-zinc-400">
            {cluster.summary}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
            Confidence
          </p>
          <p className="font-mono text-[18px] text-white">{cluster.confidence}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <ClusterGraph cluster={cluster} />
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <div className="flex items-center gap-2">
              <Radar className="h-3.5 w-3.5 text-zinc-500" />
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                Networks
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cluster.networks.map((net) => (
                <span
                  key={net}
                  className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase text-zinc-400"
                >
                  {net}
                </span>
              ))}
            </div>
          </div>

          {cluster.leader ? (
            <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-black/25 p-3">
              <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                  Leader / follower
                </p>
                <p className="mt-1 font-mono text-[11px] leading-5 text-zinc-300">
                  <span className="text-white">{cluster.leader.walletLabel}</span> first
                  {cluster.followers.length > 0
                    ? ` · ${cluster.followers.map((f) => f.walletLabel).join(", ")} followed`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}

          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-white/20 hover:text-white"
          >
            Open {cluster.symbol} desk
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FlowsPanel({
  title = "Flows",
  description = "Wallets moving together on the same asset — overlap and cross-chain convergence.",
  filter,
  compact = false,
}: {
  title?: string;
  description?: string;
  filter?: { symbol?: string | null; network?: string | null; address?: string | null };
  compact?: boolean;
}) {
  const [data, setData] = useState<FlowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    if (filter?.symbol) qs.set("symbol", filter.symbol);
    if (filter?.network) qs.set("network", filter.network);
    if (filter?.address) qs.set("address", filter.address);

    void (async () => {
      try {
        const res = await fetch(`/api/flows?${qs.toString()}`, { credentials: "include" });
        const json = (await res.json()) as FlowsResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error || "Flows unavailable");
          return;
        }
        setData(json);
      } catch {
        if (!cancelled) setError("Flows failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filter?.symbol, filter?.network, filter?.address]);

  const clusters = data?.clusters ?? [];

  return (
    <section className={cn("rounded-[20px] border border-white/[0.08] bg-black/30 p-4 sm:p-5", compact && "p-4")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
            {data?.mode === "personal" ? "Your desks" : "Market pulse"}
          </p>
          <h3 className="mt-1 font-sans text-[16px] font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-2xl font-mono text-[11px] leading-5 text-zinc-500">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-500">
          {loading ? "Syncing…" : data?.live ? "Live" : "Demo"}
        </span>
      </div>

      {error ? <p className="font-mono text-[12px] text-rose-300">{error}</p> : null}

      {loading && clusters.length === 0 ? (
        <p className="py-8 text-center font-mono text-[12px] text-zinc-600">Mapping wallet overlap…</p>
      ) : clusters.length === 0 ? (
        <p className="py-8 text-center font-mono text-[12px] text-zinc-600">
          {filter?.symbol
            ? `No overlapping tracked-wallet buys on ${filter.symbol} yet.`
            : "No wallet clusters yet — need 2+ desks buying the same asset in the pulse window."}
        </p>
      ) : (
        <div className="space-y-4">
          {clusters.slice(0, compact ? 1 : 3).map((cluster) => (
            <ClusterCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
      )}
    </section>
  );
}
