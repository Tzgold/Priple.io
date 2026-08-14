"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/DashboardShell";
import { Button } from "@/components/ui/Button";
import { useDesk } from "@/lib/app-store";
import { signOut } from "@/lib/auth-client";

export default function SettingsPage() {
  const router = useRouter();
  const { emailAlerts, setEmailAlerts, wallets, alerts } = useDesk();

  return (
    <div>
      <PageHeader title="Settings" description="Desk preferences for this browser." />

      <div className="space-y-3">
        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Research desk</h3>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">
            {wallets.length} wallets tracked · {alerts.length} alerts live
          </p>
        </section>

        <section className="flex items-center justify-between rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <div>
            <h3 className="font-sans text-[15px] font-semibold text-white">Email alerts</h3>
            <p className="mt-1 font-mono text-[12px] text-zinc-500">
              Send alert copies when Resend is connected.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailAlerts(!emailAlerts)}
            className={`relative h-7 w-12 rounded-full border transition-colors ${
              emailAlerts ? "border-teal-400/40 bg-teal-400/20" : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                emailAlerts ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </section>

        <section className="rounded-[18px] border border-white/[0.08] bg-black/30 p-5">
          <h3 className="font-sans text-[15px] font-semibold text-white">Session</h3>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">
            Sign out of this device. Tracked wallets stay in this browser until APIs land.
          </p>
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
