"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/DashboardShell";
import { Button } from "@/components/ui/Button";
import { useDesk, type ChartPref } from "@/lib/app-store";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative h-7 w-12 rounded-full border transition-colors disabled:opacity-50",
        on ? "border-teal-400/40 bg-teal-400/20" : "border-white/10 bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          on ? "left-6" : "left-0.5",
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    emailAlerts,
    setEmailAlerts,
    defaultChart,
    setDefaultChart,
    wallets,
    alerts,
    savedAlerts,
  } = useDesk();

  const [telegramHandle, setTelegramHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const user = session?.user;
  const onVercelApp = origin.endsWith(".vercel.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          settings?: { telegramHandle?: string | null };
        };
        if (data.settings?.telegramHandle) setTelegramHandle(data.settings.telegramHandle);
      } catch {
        // keep local
      }
    })();
  }, []);

  async function save(partial: {
    emailAlerts?: boolean;
    defaultChart?: ChartPref;
    telegramHandle?: string | null;
  }) {
    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setNote(data.error || "Could not save");
        return;
      }
      if (partial.emailAlerts != null) setEmailAlerts(partial.emailAlerts);
      if (partial.defaultChart) setDefaultChart(partial.defaultChart);
      setNote("Saved");
    } catch {
      setNote("Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Profile, alert channels, chart default, and the host this desk is signed into."
      />

      <div className="space-y-3">
        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Profile</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Name</dt>
              <dd className="mt-1 font-mono text-[13px] text-white">{user?.name || "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Email</dt>
              <dd className="mt-1 font-mono text-[13px] text-white">{user?.email || "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Verified</dt>
              <dd className="mt-1 font-mono text-[13px] text-zinc-300">
                {user?.emailVerified ? "Yes" : "Pending — check inbox"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">Desk</dt>
              <dd className="mt-1 font-mono text-[13px] text-zinc-300">
                {wallets.length} wallets · {savedAlerts.length || alerts.length} inbox alerts
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Alert channels</h3>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">
            Rules still live on{" "}
            <Link href="/app/alerts" className="text-zinc-300 underline underline-offset-2">
              Alerts
            </Link>
            . Channels decide where a hit is copied.
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-white">In-app inbox</p>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-500">Always on — pulse hits the desk.</p>
              </div>
              <Toggle on onClick={() => undefined} disabled />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-white">Email</p>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                  Copy new rule/pulse alerts via Resend when configured.
                </p>
              </div>
              <Toggle
                on={emailAlerts}
                disabled={saving}
                onClick={() => void save({ emailAlerts: !emailAlerts })}
              />
            </div>

            <div className="rounded-2xl border border-white/[0.06] px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-white">Telegram</p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                    Handle is saved. Bot delivery is not live yet.
                  </p>
                </div>
              </div>
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save({ telegramHandle: telegramHandle.trim() || null });
                }}
              >
                <input
                  value={telegramHandle}
                  onChange={(event) => setTelegramHandle(event.target.value)}
                  placeholder="@handle"
                  className="h-9 min-w-[180px] flex-1 rounded-full border border-white/10 bg-black/40 px-3 font-mono text-[12px] text-white outline-none placeholder:text-zinc-600"
                />
                <Button type="submit" size="sm" variant="secondary" disabled={saving}>
                  Save handle
                </Button>
              </form>
            </div>
          </div>
          {note ? <p className="mt-3 font-mono text-[11px] text-zinc-500">{note}</p> : null}
        </section>

        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Meme / DEX chart default</h3>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">
            Majors still open TradingView. Everything else uses this lane unless you are tracking a wallet on the candles.
          </p>
          <div className="mt-4 flex gap-1 rounded-full border border-white/10 p-0.5">
            {(["dexscreener", "priple"] as const).map((pref) => (
              <button
                key={pref}
                type="button"
                disabled={saving}
                onClick={() => void save({ defaultChart: pref })}
                className={cn(
                  "rounded-full px-3 py-1.5 font-mono text-[11px]",
                  defaultChart === pref ? "bg-white text-[#09090b]" : "text-zinc-500 hover:text-white",
                )}
              >
                {pref === "dexscreener" ? "DexScreener" : "Priple"}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Host / custom domain</h3>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">
            This session is on <span className="text-zinc-300">{origin || "…"}</span>
            {onVercelApp ? " · public-suffix host (OAuth state cookie workaround on)." : " · custom host (cookie check can stay strict)."}
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 font-mono text-[11px] leading-5 text-zinc-400">
            <li>Add the domain in Vercel → Project → Domains.</li>
            <li>
              Set <span className="text-zinc-200">BETTER_AUTH_URL</span> and{" "}
              <span className="text-zinc-200">NEXT_PUBLIC_APP_URL</span> to https://your.domain
            </li>
            <li>
              Optional: <span className="text-zinc-200">AUTH_TRUSTED_ORIGINS</span> as a comma list if preview URLs should stay allowed.
            </li>
            <li>Google Cloud: authorized redirect {origin || "https://your.domain"}/api/auth/callback/google</li>
            <li>Cloudflare Turnstile: allow the same hostname on the widget.</li>
          </ol>
        </section>

        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Session</h3>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">Sign out of this device. Wallets and rules stay on the account.</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={async () => {
              await signOut({
                fetchOptions: {
                  onSuccess: () => router.push("/login"),
                },
              });
            }}
          >
            Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}
