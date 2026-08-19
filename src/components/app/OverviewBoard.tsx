"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  Bell,
  Plus,
  Radio,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Layers,
} from "lucide-react";
import { TokenMark } from "@/components/app/TokenMark";
import { FlowsPanel } from "@/components/app/FlowsPanel";
import { WalletNarrativeCard } from "@/components/app/WalletNarrativeCard";
import { Button } from "@/components/ui/Button";
import { useAddWallet } from "@/components/app/WalletModalProvider";
import { cn } from "@/lib/cn";
import { useDesk } from "@/lib/app-store";
import type { PulseItem } from "@/lib/alchemy-pulse";
import type { FlowCluster } from "@/lib/flows";
import { buildWalletNarrative, dossierFromPulse } from "@/lib/wallet-narrative";

const moveIcons = {
  buy: TrendingUp,
  sell: TrendingDown,
  flow: ArrowRightLeft,
  alert: Bell,
  stake: Layers,
};

const statusClass = {
  Confirmed: "text-teal-400",
  Live: "text-amber-400",
  Watching: "text-zinc-400",
};

const alertIcons = {
  signal: Target,
  flow: ArrowRightLeft,
  social: Radio,
  score: Bell,
};

type PulseResponse = {
  mode: "market" | "personal";
  personalReady: boolean;
  trackedCount: number;
  threshold: number;
  live: boolean;
  items: PulseItem[];
};

export function OverviewBoard() {
  const {
    trackedWallets,
    trackedCount,
    pulseThreshold,
    personalMode,
    alerts,
    savedAlerts,
    ready,
    refreshAlerts,
  } = useDesk();
  const { openAddWallet } = useAddWallet();
  const [pulse, setPulse] = useState<PulseResponse | null>(null);
  const [clusters, setClusters] = useState<FlowCluster[]>([]);
  const [loadingPulse, setLoadingPulse] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      setLoadingPulse(true);
      try {
        const [res, flowsRes] = await Promise.all([
          fetch("/api/pulse", { credentials: "include" }),
          fetch("/api/flows", { credentials: "include" }),
        ]);
        if (!res.ok) return;
        const data = (await res.json()) as PulseResponse;
        if (!cancelled) setPulse(data);
        if (flowsRes.ok) {
          const flows = (await flowsRes.json()) as { clusters?: FlowCluster[] };
          if (!cancelled) setClusters(flows.clusters ?? []);
        }
        await refreshAlerts();
      } catch {
        // Keep previous / empty; board still shows watchlist + alerts.
      } finally {
        if (!cancelled) setLoadingPulse(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ready, trackedCount, personalMode, refreshAlerts]);

  const mode = pulse?.mode ?? (personalMode ? "personal" : "market");
  const items = pulse?.items ?? [];
  const live = pulse?.live ?? false;
  const remaining = Math.max(pulseThreshold - trackedCount, 0);

  const inbox = useMemo(() => {
    if (savedAlerts.length > 0) return savedAlerts.slice(0, 4);
    return alerts.slice(0, 3);
  }, [savedAlerts, alerts]);

  const dates = [...new Set(items.map((item) => item.date))];

  const overviewNarrative = useMemo(() => {
    const focusWallet = (() => {
      if (trackedWallets.length === 0) {
        return items[0]
          ? {
              id: undefined as string | undefined,
              label: items[0].walletLabel,
              address: items[0].walletAddress,
              chain: "ETH",
            }
          : null;
      }
      let best = trackedWallets[0];
      let bestCount = -1;
      for (const wallet of trackedWallets) {
        const addr = (wallet.fullAddress || wallet.address).toLowerCase();
        const usableAddress = addr.length >= 8 && !addr.includes("…");
        const count = items.filter((item) => {
          if (usableAddress) {
            return item.walletAddress.toLowerCase() === addr;
          }
          return item.walletLabel === wallet.label;
        }).length;
        if (count > bestCount) {
          best = wallet;
          bestCount = count;
        }
      }
      return {
        id: best.id,
        label: best.label,
        address: best.fullAddress || best.address,
        chain: best.chain,
      };
    })();
    if (!focusWallet) return null;
    const dossier = dossierFromPulse(items, focusWallet);
    if (!dossier) return null;
    return {
      narrative: buildWalletNarrative(dossier, clusters),
      walletId: focusWallet.id,
    };
  }, [trackedWallets, items, clusters]);

  return (
    <div className="space-y-5">
      <section className="dash-hero relative overflow-hidden rounded-[22px] border border-white/[0.08] px-5 py-6 sm:px-7 sm:py-7">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {mode === "personal" ? "Your pulse" : "Market pulse"}
            </p>
            <h2 className="mt-2 max-w-xl font-sans text-[1.85rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[2.15rem]">
              {mode === "personal"
                ? live
                  ? "What your desks did while you were away"
                  : "Your desks were quiet in this window"
                : "What smart money did while you were away"}
            </h2>
            <p className="mt-3 max-w-lg font-mono text-[12px] leading-5 text-zinc-400">
              {mode === "personal"
                ? live
                  ? "Live transfers across wallets you track."
                  : "No live transfers in this window for wallets you track."
                : live
                  ? "Curated desks until you own the board."
                  : `Demo tape until feeds return — track ${remaining || pulseThreshold} wallet${remaining === 1 ? "" : "s"} to flip this to your radar.`}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11px] text-zinc-300">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  live ? "bg-teal-400" : "bg-zinc-500",
                )}
              />
              {loadingPulse ? "Syncing…" : live ? "Live chain feed" : "Demo pulse"}
            </div>
            <Button size="sm" onClick={openAddWallet}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Track a wallet
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-sans text-[15px] font-semibold text-white">Pulse</h3>
          <p className="font-mono text-[11px] text-zinc-500">
            {mode === "personal" ? "Personal" : "Market"} · last 24h bias
          </p>
        </div>

        {loadingPulse && items.length === 0 ? (
          <p className="py-10 text-center font-mono text-[12px] text-zinc-600">
            Pulling chain activity…
          </p>
        ) : dates.length === 0 ? (
          <p className="py-10 text-center font-mono text-[12px] text-zinc-600">
            {mode === "personal"
              ? "No live transfers in the last window for wallets you track."
              : "No pulse yet. Add an ETH wallet to seed your desk."}
          </p>
        ) : (
          dates.map((date) => (
            <div key={date} className="mb-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                {date}
              </p>
              <ul className="space-y-1.5">
                {items
                  .filter((item) => item.date === date)
                  .map((item) => {
                    const Icon = moveIcons[item.type] ?? ArrowDownLeft;
                    return (
                      <li key={item.id}>
                        <div className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.025]">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-zinc-300">
                            <Icon className="h-4 w-4" strokeWidth={1.6} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-medium text-white">
                                {item.action}
                              </p>
                              <span
                                className={cn(
                                  "font-mono text-[11px]",
                                  statusClass[item.status],
                                )}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="truncate font-mono text-[11px] text-zinc-500">
                              {item.walletLabel}
                            </p>
                          </div>
                          <div className="hidden items-center gap-2 sm:flex">
                            <TokenMark symbol={item.asset} size={22} />
                            <span className="font-mono text-[12px] text-zinc-300">
                              {item.asset}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-[12px] text-white">
                              {item.amount} {item.asset}
                            </p>
                            <p className="font-mono text-[11px] text-zinc-500">
                              {item.usd} · {item.time}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))
        )}
      </section>

      {overviewNarrative ? (
        <WalletNarrativeCard
          narrative={overviewNarrative.narrative}
          walletId={overviewNarrative.walletId}
          compact
        />
      ) : null}

      <FlowsPanel
        title="When wallets move together"
        description="Overlap clusters from your pulse — who entered first, who followed, and whether the pattern spans chains."
      />

      <section className="rounded-[20px] border border-white/[0.08] bg-black/30 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-sans text-[15px] font-semibold text-white">Your watchlist</h3>
            <p className="mt-1 font-mono text-[11px] text-zinc-500">
              {trackedCount === 0
                ? "Paste an address — this becomes your radar."
                : personalMode
                  ? `${trackedCount} wallets powering your pulse.`
                  : `${trackedCount} of ${pulseThreshold} wallets tracked — ${remaining} more to unlock personal pulse.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/wallets"
              className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-300 hover:text-white"
            >
              Open wallets
            </Link>
            <Button size="sm" variant="secondary" onClick={openAddWallet}>
              Add wallet
            </Button>
          </div>
        </div>

        {trackedWallets.length === 0 ? (
          <button
            type="button"
            onClick={openAddWallet}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-5 text-left transition-colors hover:border-white/25"
          >
            <div>
              <p className="text-[14px] font-medium text-white">Track your first desk</p>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                Alerts and personal pulse start here.
              </p>
            </div>
            <Plus className="h-5 w-5 text-zinc-400" />
          </button>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {trackedWallets.slice(0, 6).map((wallet) => (
              <li key={wallet.id}>
                <Link
                  href={`/app/wallets?id=${wallet.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/25 px-3 py-3 hover:border-white/12"
                >
                  <TokenMark symbol={wallet.asset} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-white">{wallet.label}</p>
                    <p className="truncate font-mono text-[11px] text-zinc-500">
                      {wallet.address} · {wallet.chain}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!personalMode ? (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-teal-400/80 transition-all"
              style={{
                width: `${Math.min((trackedCount / pulseThreshold) * 100, 100)}%`,
              }}
            />
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-sans text-[15px] font-semibold text-white">Alerts inbox</h3>
            {savedAlerts.length === 0 ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                Waiting on pulse
              </span>
            ) : (
              <span className="rounded-full border border-teal-400/20 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                From pulse
              </span>
            )}
          </div>
          <Link
            href="/app/alerts"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 hover:text-white"
          >
            <Shield className="h-3.5 w-3.5" />
            Manage
          </Link>
        </div>

        <ul className="space-y-2">
          {inbox.map((alert) => {
            const Icon = alertIcons[alert.type] ?? Bell;
            return (
              <li
                key={alert.id}
                className="flex items-start gap-3 rounded-[18px] border border-white/[0.08] bg-black/30 px-4 py-3.5"
              >
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-zinc-300">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium text-white">{alert.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                      {alert.time}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] leading-5 text-zinc-500">
                    {alert.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
