"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, Radio, Shuffle, Target, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/DashboardShell";
import { useAddWallet } from "@/components/app/WalletModalProvider";
import { useDesk } from "@/lib/app-store";
import { cn } from "@/lib/cn";

const typeIcon = {
  signal: Target,
  flow: Shuffle,
  social: Radio,
  score: Bell,
};

const statusClass = {
  Live: "text-amber-400",
  Confirmed: "text-teal-400",
  Watching: "text-zinc-400",
};

type AlertRule = {
  id: string;
  title: string;
  walletId: string | null;
  walletLabel: string;
  side: string;
  minUsd: number;
  enabled: boolean;
  createdAt: string;
};

export default function AlertsPage() {
  const { alerts, trackedWallets, dismissAlert, refreshAlerts } = useDesk();
  const { openAddWallet } = useAddWallet();
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts/rules", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { rules?: AlertRule[] };
      setRules(data.rules ?? []);
    } catch {
      // keep
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Rules fire from live pulse on wallets you track — buy/sell size thresholds, not marketing stubs."
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            New rule
          </Button>
        }
      />

      {open ? (
        <form
          className="mb-4 space-y-3 rounded-[18px] border border-white/10 bg-black/40 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            const form = event.currentTarget;
            const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
            const walletId = (form.elements.namedItem("walletId") as HTMLSelectElement).value;
            const side = (form.elements.namedItem("side") as HTMLSelectElement).value;
            const minUsd = Number(
              (form.elements.namedItem("minUsd") as HTMLInputElement).value || "25000",
            );

            void (async () => {
              setPending(true);
              try {
                const res = await fetch("/api/alerts/rules", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: title || undefined,
                    walletId: walletId || null,
                    side,
                    minUsd,
                  }),
                });
                const data = (await res.json()) as { error?: string };
                if (!res.ok) throw new Error(data.error || "Failed to create rule");
                setOpen(false);
                await loadRules();
                await refreshAlerts();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to create rule");
              } finally {
                setPending(false);
              }
            })();
          }}
        >
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-300">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input name="title" placeholder="Rule name" className="auth-input" />
            <select name="walletId" className="auth-input" defaultValue="">
              <option value="">Any tracked wallet</option>
              {trackedWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.label} · {wallet.chain}
                </option>
              ))}
            </select>
            <select name="side" className="auth-input" defaultValue="any">
              <option value="any">Buy or sell</option>
              <option value="buy">Buys / receives</option>
              <option value="sell">Sells / sends</option>
            </select>
            <input
              name="minUsd"
              type="number"
              min={0}
              step={1000}
              defaultValue={25000}
              placeholder="Min USD"
              className="auth-input"
            />
          </div>
          <p className="font-mono text-[11px] text-zinc-600">
            Rules evaluate when pulse refreshes. Default inbox still logs large transfers (≥ $25k)
            even without a rule.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save rule"}
            </Button>
          </div>
        </form>
      ) : null}

      <section className="mb-6">
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
          Active rules
        </h2>
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-start justify-between gap-3 rounded-[18px] border border-white/[0.08] bg-black/30 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-white">{rule.title}</p>
                <p className="mt-1 font-mono text-[12px] text-zinc-500">
                  {rule.walletLabel} · {rule.side} · ≥ $
                  {Math.round(rule.minUsd).toLocaleString("en-US")}
                </p>
              </div>
              <button
                type="button"
                className="text-zinc-600 hover:text-rose-300"
                title="Delete rule"
                onClick={() => {
                  void (async () => {
                    const res = await fetch(`/api/alerts/rules/${encodeURIComponent(rule.id)}`, {
                      method: "DELETE",
                      credentials: "include",
                    });
                    if (res.ok) await loadRules();
                  })();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {rules.length === 0 ? (
            <li className="rounded-[18px] border border-dashed border-white/10 px-4 py-6 text-center">
              <p className="font-mono text-[12px] text-zinc-400">
                No custom rules yet. Track a wallet, then set a size threshold.
              </p>
              <p className="mt-2 font-mono text-[11px] text-zinc-600">
                Default inbox still logs transfers ≥ $25k without a rule when pulse refreshes.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={openAddWallet}>
                  Track wallet
                </Button>
                <Button size="sm" onClick={() => setOpen(true)}>
                  New rule
                </Button>
                <Link
                  href="/app/wallets"
                  className="font-mono text-[11px] text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
                >
                  Open wallets
                </Link>
              </div>
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600">
          Inbox
        </h2>
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const Icon = typeIcon[alert.type];
            return (
              <li
                key={alert.id}
                className="flex items-start gap-3 rounded-[18px] border border-white/[0.08] bg-black/30 px-4 py-4"
              >
                <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-zinc-300">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-medium text-white">{alert.title}</p>
                    <span className={cn("font-mono text-[11px]", statusClass[alert.status])}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[12px] leading-5 text-zinc-500">{alert.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-mono text-[11px] text-zinc-600">{alert.time}</span>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="text-zinc-600 hover:text-white"
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
          {alerts.length === 0 ? (
            <li className="rounded-[18px] border border-dashed border-white/10 px-4 py-8 text-center">
              <p className="font-mono text-[12px] text-zinc-400">
                Inbox is empty — waiting on live pulse from desks you track.
              </p>
              <p className="mt-2 font-mono text-[11px] leading-5 text-zinc-600">
                Track a wallet → optional size rule → refresh Overview/pulse → events land here.
                Large transfers (≥ $25k) still alert without a custom rule.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => setOpen(true)}>
                  New rule
                </Button>
                <Button size="sm" variant="secondary" onClick={openAddWallet}>
                  Track wallet
                </Button>
                <Link
                  href="/app/settings"
                  className="font-mono text-[11px] text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
                >
                  Email delivery
                </Link>
              </div>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
