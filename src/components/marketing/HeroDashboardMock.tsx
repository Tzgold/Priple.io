import { Bell, CandlestickChart, LayoutDashboard, Search, Wallet } from "lucide-react";
import { DotStage, PriplePanel } from "@/components/marketing/PripleCard";

function ShellChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0c0c0e]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <div className="ml-2 flex h-7 flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-[#141416] px-2.5 text-[11px] text-zinc-500">
          <Search className="h-3 w-3" />
          Search wallets, tokens, entities…
        </div>
      </div>
      <div className="flex min-h-[280px] sm:min-h-[340px]">
        <aside className="hidden w-[148px] shrink-0 border-r border-white/[0.06] bg-[#0a0a0c] p-2.5 sm:block">
          <div className="mb-3 flex items-center gap-2 px-1.5 py-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black text-[10px] font-semibold">
              P
            </div>
            <span className="text-xs font-semibold text-white">Priple</span>
          </div>
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: Wallet, label: "Wallets" },
            { icon: CandlestickChart, label: "Screener" },
            { icon: Bell, label: "Alerts" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`mb-0.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                  item.active ? "bg-white/[0.06] text-white" : "text-zinc-500"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {item.label}
              </div>
            );
          })}
        </aside>
        <div className="min-w-0 flex-1 p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const c = 2 * Math.PI * 34;
  return (
    <div className="relative flex h-[84px] w-[84px] items-center justify-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <div className="text-center">
        <p className="text-xl font-semibold text-white">{value}</p>
        <p className="text-[8px] uppercase tracking-wider text-zinc-500">Score</p>
      </div>
    </div>
  );
}

export function HeroDashboardMock() {
  return (
    <section
      aria-label="Priple dashboard preview"
      className="relative mx-auto max-w-5xl px-3 pb-16 sm:px-6 sm:pb-24"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#09090b] via-[#09090b]/70 to-transparent sm:h-44" />

      <DotStage className="mx-auto max-w-4xl">
        <div className="relative">
          <div className="absolute -right-1 top-8 z-20 hidden w-[220px] animate-fade-up delay-3 rounded-2xl border border-white/16 bg-[#121214] p-3 shadow-2xl lg:block xl:-right-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Live alert
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-2 text-sm font-medium text-white">Whale accumulation</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-500">
              3 tracked wallets bought $LINK in the last 40m
            </p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#09090b]">
                Open signal
              </span>
              <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] text-zinc-400">
                Snooze
              </span>
            </div>
          </div>

          <div className="absolute -left-1 top-16 z-20 hidden w-[200px] animate-fade-up delay-2 rounded-2xl border border-white/16 bg-[#121214] p-3 shadow-2xl lg:block xl:-left-6">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              LINK · Opportunity
            </p>
            <div className="mt-2 flex items-center gap-3">
              <ScoreRing value={88} />
              <div className="space-y-1.5 text-[10px]">
                <p className="flex justify-between gap-3 text-zinc-400">
                  On-chain <span className="text-white">92</span>
                </p>
                <p className="flex justify-between gap-3 text-zinc-400">
                  Social <span className="text-white">78</span>
                </p>
                <p className="flex justify-between gap-3 text-zinc-400">
                  Market <span className="text-white">84</span>
                </p>
              </div>
            </div>
          </div>

          <div className="animate-fade-up delay-1 origin-bottom scale-[0.98] sm:scale-100">
            <PriplePanel>
              <ShellChrome>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Overview</p>
                    <p className="text-[11px] text-zinc-500">Intelligence snapshot · mock</p>
                  </div>
                  <span className="rounded-full border border-white/12 px-2 py-0.5 text-[10px] text-zinc-400">
                    Risk-on bias
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Tracked wallets", value: "24", hint: "4 active" },
                    { label: "Open alerts", value: "7", hint: "2 high" },
                    { label: "Top score", value: "91", hint: "Smart Money α" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/[0.08] bg-[#141416] p-2.5 sm:p-3"
                    >
                      <p className="truncate text-[9px] text-zinc-500 sm:text-[10px]">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-base font-semibold text-white sm:text-lg">
                        {stat.value}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-zinc-600 sm:text-[10px]">
                        {stat.hint}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-2 grid gap-2 lg:grid-cols-5">
                  <div className="rounded-xl border border-white/[0.08] bg-[#141416] lg:col-span-3">
                    <div className="border-b border-white/[0.05] px-3 py-2">
                      <p className="text-[11px] font-medium text-white">Recent whale moves</p>
                    </div>
                    <ul className="divide-y divide-white/[0.04]">
                      {[
                        ["Wintermute Desk", "Bought $420k LINK", "4m"],
                        ["Smart Money α", "Bridged $1.2M ETH → Base", "18m"],
                        ["DeFi Accumulator", "Staked 2.4k ETH", "1h"],
                      ].map(([wallet, move, time]) => (
                        <li
                          key={wallet}
                          className="flex items-center justify-between gap-2 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-white">
                              {wallet}
                            </p>
                            <p className="truncate text-[10px] text-zinc-500">{move}</p>
                          </div>
                          <span className="shrink-0 text-[10px] text-zinc-600">{time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#141416] lg:col-span-2">
                    <div className="border-b border-white/[0.05] px-3 py-2">
                      <p className="text-[11px] font-medium text-white">Screener leaders</p>
                    </div>
                    <ul className="divide-y divide-white/[0.04]">
                      {[
                        ["LINK", "88", "+8.7%"],
                        ["SOL", "84", "+5.1%"],
                        ["ETH", "78", "+2.4%"],
                      ].map(([sym, score, ch]) => (
                        <li
                          key={sym}
                          className="flex items-center justify-between px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[9px] font-semibold text-zinc-300">
                              {sym.slice(0, 2)}
                            </span>
                            <span className="text-[11px] text-white">{sym}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-white">{score}</p>
                            <p className="text-[10px] text-emerald-400">{ch}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ShellChrome>
            </PriplePanel>
          </div>
        </div>
      </DotStage>
    </section>
  );
}
