"use client";

import { useState } from "react";
import { Bell, Radio, Shuffle, Target, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/DashboardShell";
import { useDesk } from "@/lib/app-store";
import { cn } from "@/lib/cn";
import type { AlertItem } from "@/lib/mock/data";

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

export default function AlertsPage() {
  const { alerts, wallets, addAlert, dismissAlert } = useDesk();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Buy, sell, flow, and score triggers on wallets you track."
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            New alert
          </Button>
        }
      />

      {open ? (
        <form
          className="mb-4 space-y-3 rounded-[18px] border border-white/10 bg-black/40 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const type = (form.elements.namedItem("type") as HTMLSelectElement)
              .value as AlertItem["type"];
            const wallet = (form.elements.namedItem("wallet") as HTMLSelectElement).value;
            const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
            void (async () => {
              try {
                await addAlert({
                  type,
                  title: title || `${type} alert`,
                  detail: `Watching ${wallet} for ${type} activity.`,
                });
                setOpen(false);
              } catch {
                // Keep form open so the user can retry.
              }
            })();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="type" className="auth-input" defaultValue="signal">
              <option value="signal">Buy / sell signal</option>
              <option value="flow">Cross-chain flow</option>
              <option value="social">Social spike</option>
              <option value="score">Opportunity score</option>
            </select>
            <select name="wallet" className="auth-input">
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.label}>
                  {wallet.label}
                </option>
              ))}
            </select>
            <input name="title" placeholder="Alert name" className="auth-input" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create alert
            </Button>
          </div>
        </form>
      ) : null}

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
          <li className="py-10 text-center font-mono text-[12px] text-zinc-600">
            No alerts. Create one to watch a wallet or score.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
