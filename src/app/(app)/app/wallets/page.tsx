"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/DashboardShell";
import { TokenMark } from "@/components/app/TokenMark";
import { CopyButton } from "@/components/app/CopyButton";
import { WalletDeskPanel } from "@/components/app/WalletDeskPanel";
import { WalletNarrativeCard } from "@/components/app/WalletNarrativeCard";
import { useAddWallet } from "@/components/app/WalletModalProvider";
import { useDesk } from "@/lib/app-store";
import { cn } from "@/lib/cn";
import type { FlowCluster } from "@/lib/flows";
import { buildWalletDeskBrief } from "@/lib/wallet-desk";
import { buildWalletNarrative } from "@/lib/wallet-narrative";
import type { WalletDossier } from "@/lib/wallet-dossier";

function WalletsBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focused = searchParams.get("id");
  const { wallets, removeWallet, trackedWallets } = useDesk();
  const { openAddWallet } = useAddWallet();

  const [dossier, setDossier] = useState<WalletDossier | null>(null);
  const [clusters, setClusters] = useState<FlowCluster[]>([]);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [tab, setTab] = useState<"activity" | "holdings">("activity");

  const selected = useMemo(
    () => wallets.find((wallet) => wallet.id === focused) || null,
    [wallets, focused],
  );

  useEffect(() => {
    if (!focused && wallets[0]) {
      router.replace(`/app/wallets?id=${encodeURIComponent(wallets[0].id)}`);
    }
  }, [focused, wallets, router]);

  useEffect(() => {
    if (!focused) {
      setDossier(null);
      return;
    }

    let cancelled = false;
    setLoadingDossier(true);
    setDossierError(null);
    setClusters([]);

    void (async () => {
      try {
        const [res, flowsRes] = await Promise.all([
          fetch(`/api/wallets/${encodeURIComponent(focused)}`, { credentials: "include" }),
          fetch("/api/flows", { credentials: "include" }),
        ]);
        const data = (await res.json()) as { dossier?: WalletDossier; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.dossier) {
          setDossier(null);
          setClusters([]);
          setDossierError(data.error || "Could not load dossier");
          return;
        }
        setDossier(data.dossier);
        setTab("activity");
        if (flowsRes.ok) {
          const flows = (await flowsRes.json()) as { clusters?: FlowCluster[] };
          setClusters(flows.clusters ?? []);
        }
      } catch {
        if (!cancelled) {
          setDossier(null);
          setDossierError("Could not load dossier");
        }
      } finally {
        if (!cancelled) setLoadingDossier(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focused]);

  function openCoin(
    href: string | null,
    meta?: {
      why?: string;
      side?: "buy" | "sell";
      timeSec?: number | null;
      tokenAddress?: string | null;
    },
  ) {
    if (!href || !dossier) return;
    const url = new URL(href, window.location.origin);
    if (meta?.why) url.searchParams.set("why", meta.why);
    url.searchParams.set("wallet", dossier.address);
    url.searchParams.set("wl", dossier.label);
    if (meta?.timeSec) url.searchParams.set("at", String(meta.timeSec));
    if (meta?.side) url.searchParams.set("side", meta.side);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  const walletNarrative = useMemo(
    () => (dossier ? buildWalletNarrative(dossier, clusters) : null),
    [dossier, clusters],
  );

  const walletDesk = useMemo(
    () => (dossier ? buildWalletDeskBrief(dossier, clusters) : null),
    [dossier, clusters],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Smart money"
        description="Pick a desk from the left rail → see buys, sells, and holdings → open any coin into research."
        action={
          <Button size="sm" onClick={openAddWallet}>
            Add wallet
          </Button>
        }
      />

      <section className="space-y-4">
        {!focused ? (
          <p className="rounded-[20px] border border-white/[0.08] bg-black/30 px-4 py-12 text-center font-mono text-[12px] text-zinc-600">
            Select a desk from the left rail to open its dossier.
          </p>
        ) : loadingDossier ? (
          <p className="rounded-[20px] border border-white/[0.08] bg-black/30 px-4 py-12 text-center font-mono text-[12px] text-zinc-600">
            Loading buys, sells, and holdings…
          </p>
        ) : dossierError ? (
          <p className="rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-8 text-center font-mono text-[12px] text-rose-300">
            {dossierError}
          </p>
        ) : dossier ? (
          <>
            <div className="rounded-[20px] border border-white/[0.08] bg-black/30 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <TokenMark symbol={selected?.asset || "ETH"} size={44} />
                  <div className="min-w-0">
                    <h2 className="font-sans text-xl font-semibold text-white">
                      {dossier.label}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500">
                      <span>{dossier.shortAddress}</span>
                      <CopyButton value={dossier.address} />
                      <span className="rounded-full border border-white/10 px-2 py-0.5 uppercase">
                        {dossier.chain}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5",
                          dossier.live
                            ? "border-teal-500/30 text-teal-300"
                            : "border-white/10 text-zinc-500",
                        )}
                      >
                        {dossier.live ? "Live chain" : "Demo / partial"}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[12px] text-zinc-400">
                      {dossier.buysCount} buys · {dossier.sellsCount} sells ·{" "}
                      {dossier.holdings.length} holdings shown
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://etherscan.io/address/${dossier.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-white/20 hover:text-white"
                  >
                    Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                  {selected?.custom ? (
                    <button
                      type="button"
                      onClick={() => removeWallet(selected.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-500 hover:border-rose-500/40 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  ) : null}
                </div>
              </div>
              {dossier.note ? (
                <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-amber-100">
                  {dossier.note}
                </p>
              ) : null}
            </div>

            {walletDesk ? <WalletDeskPanel desk={walletDesk} /> : null}

            {walletNarrative ? (
              <WalletNarrativeCard
                key={`wallet:${dossier.id}`}
                narrative={walletNarrative}
                walletId={
                  trackedWallets.some((wallet) => wallet.id === dossier.id)
                    ? dossier.id
                    : undefined
                }
              />
            ) : null}

            <div className="rounded-[20px] border border-white/[0.08] bg-black/30">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                {(
                  [
                    ["activity", `Activity (${dossier.activity.length})`],
                    ["holdings", `Holdings (${dossier.holdings.length})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 font-mono text-[11px]",
                      tab === key
                        ? "bg-white/[0.08] text-white"
                        : "text-zinc-500 hover:text-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "activity" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Side</th>
                        <th className="px-4 py-3 font-medium">Asset</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="hidden px-4 py-3 font-medium sm:table-cell">USD</th>
                        <th className="px-4 py-3 font-medium">When</th>
                        <th className="px-4 py-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {dossier.activity.map((row) => {
                        const clickable = Boolean(row.screenerHref);
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              "transition-colors",
                              clickable
                                ? "cursor-pointer hover:bg-white/[0.05]"
                                : "hover:bg-white/[0.02]",
                            )}
                            onClick={() => {
                              if (!row.screenerHref) return;
                              openCoin(row.screenerHref, {
                                why: `${dossier.label} ${row.side === "buy" ? "bought" : "sold"} ${row.amount} ${row.asset} (${row.usd}).`,
                                side: row.side,
                                timeSec: row.timeSec,
                                tokenAddress: row.tokenAddress,
                              });
                            }}
                          >
                            <td
                              className={cn(
                                "px-4 py-3 font-mono text-[12px] uppercase",
                                row.side === "buy" ? "text-teal-400" : "text-rose-400",
                              )}
                            >
                              {row.side}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <TokenMark symbol={row.asset} imageUrl={row.imageUrl} size={22} />
                                <span className="font-medium text-white">{row.asset}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-300">{row.amount}</td>
                            <td className="hidden px-4 py-3 font-mono text-zinc-500 sm:table-cell">
                              {row.usd}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                              {row.date} · {row.time}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[11px] text-teal-300/80">
                              {clickable ? "Open →" : "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {dossier.activity.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center font-mono text-[12px] text-zinc-600"
                          >
                            No recent transfers found for this desk.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Token</th>
                        <th className="px-4 py-3 font-medium">Balance</th>
                        <th className="hidden px-4 py-3 font-medium sm:table-cell">Network</th>
                        <th className="px-4 py-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {dossier.holdings.map((row) => {
                        const clickable = Boolean(row.screenerHref);
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              "transition-colors",
                              clickable
                                ? "cursor-pointer hover:bg-white/[0.05]"
                                : "hover:bg-white/[0.02]",
                            )}
                            onClick={() => {
                              if (!row.screenerHref) return;
                              openCoin(row.screenerHref, {
                                why: `${dossier.label} holds ${row.balanceLabel} ${row.symbol}.`,
                                tokenAddress: row.tokenAddress,
                              });
                            }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <TokenMark symbol={row.symbol} imageUrl={row.imageUrl} size={22} />
                                <div>
                                  <p className="font-medium text-white">{row.symbol}</p>
                                  <p className="font-mono text-[11px] text-zinc-500">{row.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-zinc-300">{row.balanceLabel}</td>
                            <td className="hidden px-4 py-3 font-mono text-[11px] uppercase text-zinc-500 sm:table-cell">
                              {row.network}
                              {row.native ? " · native" : ""}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[11px] text-teal-300/80">
                              {clickable ? "Open →" : "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {dossier.holdings.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-10 text-center font-mono text-[12px] text-zinc-600"
                          >
                            No holdings returned for this desk yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="font-mono text-[11px] text-zinc-600">
              Tip: Click any row to open that coin — this wallet’s profile shows on the chart at buy/sell points.
            </p>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default function WalletsPage() {
  return (
    <Suspense>
      <WalletsBoard />
    </Suspense>
  );
}
