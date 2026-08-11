import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/AppChrome";
import { mockAlerts, mockMoves } from "@/lib/mock/data";

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        description="Your intelligence snapshot — mock data for the shell."
        action={
          <Button href="/app/wallets" size="sm" variant="secondary">
            Track a wallet
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Opportunity bias", value: "Risk-on", hint: "Scoreboard lean" },
          { label: "Tracked wallets", value: "24", hint: "4 active today" },
          { label: "Open alerts", value: "7", hint: "2 high priority" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/[0.08] bg-[#141416] p-4"
          >
            <p className="text-xs text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-zinc-600">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <section className="rounded-2xl border border-white/[0.08] bg-[#141416] lg:col-span-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-medium text-white">Recent whale moves</h2>
            <span className="text-xs text-zinc-600">Live mock</span>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {mockMoves.map((move) => (
              <li
                key={`${move.wallet}-${move.time}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div>
                  <p className="text-sm text-white">{move.wallet}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {move.action} {move.amount} {move.asset}
                  </p>
                </div>
                <span className="text-xs text-zinc-600">{move.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#141416] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-sm font-medium text-white">Alert feed</h2>
            <span className="text-xs text-zinc-600">Stub</span>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {mockAlerts.map((alert) => (
              <li key={alert.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white">{alert.title}</p>
                  <span className="text-[11px] text-zinc-600">{alert.time}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{alert.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
