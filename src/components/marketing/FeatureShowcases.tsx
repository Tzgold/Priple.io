import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";
import { DotStage, MockSurface, PripleCard } from "@/components/marketing/PripleCard";

function SectionHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-[2.15rem] md:leading-[1.15]">
        {title}
      </h2>
      <p className="mt-3 text-[14px] leading-7 text-zinc-400 sm:text-[15px]">{description}</p>
    </div>
  );
}

function OpportunityDashboardMock() {
  return (
    <MockSurface>
      <div className="grid grid-cols-3 gap-2 border-b border-white/[0.06] p-3 sm:gap-2.5 sm:p-3.5">
        {[
          { label: "Whale inflow", value: "$48.2M", delta: "+12% vs 24h", good: true },
          { label: "Avg opp. score", value: "81", delta: "+4 pts", good: true },
          { label: "Open alerts", value: "7", delta: "2 high", good: false },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/[0.07] bg-[#121214] px-2.5 py-2.5 sm:px-3"
          >
            <p className="truncate text-[9px] text-zinc-500 sm:text-[10px]">{s.label}</p>
            <p className="mt-1 text-sm font-semibold tracking-tight text-white sm:text-base">
              {s.value}
            </p>
            <p
              className={`mt-0.5 truncate text-[9px] sm:text-[10px] ${
                s.good ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {s.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="relative px-2 pt-3 sm:px-3">
        <div className="mb-1 flex justify-between px-1 text-[9px] text-zinc-600">
          <span>$0</span>
          <span>Score / flow · 12d</span>
          <span>100</span>
        </div>
        <svg viewBox="0 0 420 130" className="h-[120px] w-full" preserveAspectRatio="none">
          {[26, 52, 78, 104].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="420"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
            />
          ))}
          <path
            d="M0,95 C35,90 55,70 90,68 C130,65 150,40 190,48 C230,56 250,30 290,28 C330,26 360,42 420,22"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2.2"
          />
          <path
            d="M0,105 C40,100 70,92 110,88 C160,82 200,78 250,70 C300,62 350,72 420,55"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.6"
          />
          {[
            [90, 68],
            [190, 48],
            [290, 28],
            [420, 22],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.2" fill="#0a0a0c" stroke="#fff" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="flex justify-between px-1 pb-2 text-[9px] text-zinc-600">
          {["Mar 1", "Mar 4", "Mar 7", "Mar 10", "Mar 12"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-3 py-2.5">
        <p className="mb-2 text-[11px] font-medium text-zinc-300">Token opportunity</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[340px] text-left text-[10px]">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-1.5 font-medium">Asset</th>
                <th className="pb-1.5 font-medium">Score</th>
                <th className="pb-1.5 font-medium">Whale $</th>
                <th className="pb-1.5 font-medium">Social</th>
                <th className="pb-1.5 font-medium">24h</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {[
                ["LINK", "88", "$6.2M", "High", "+8.7%"],
                ["SOL", "84", "$11.4M", "High", "+5.1%"],
                ["ETH", "78", "$22.1M", "Med", "+2.4%"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-white/[0.04]">
                  <td className="py-1.5 font-medium text-white">{row[0]}</td>
                  <td className="py-1.5">{row[1]}</td>
                  <td className="py-1.5">{row[2]}</td>
                  <td className="py-1.5">{row[3]}</td>
                  <td className="py-1.5 text-emerald-400">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MockSurface>
  );
}

function SignalBriefMock() {
  return (
    <MockSurface>
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#161618] text-[10px] font-semibold text-white">
          α
        </div>
        <div>
          <p className="text-sm font-medium text-white">Smart Money α</p>
          <p className="text-[10px] text-zinc-500">Labeled desk · 24h brief</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { label: "Net flow", value: "+$1.2M" },
          { label: "Opp. score", value: "91" },
          { label: "Overlap", value: "3 wallets" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/[0.07] bg-[#121214] px-2.5 py-2.5"
          >
            <p className="text-[9px] text-zinc-500">{s.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3">
        <div className="flex h-28 items-end gap-1.5 rounded-xl border border-white/[0.06] bg-[#0e0e10] px-3 pb-3 pt-4">
          {[40, 65, 48, 82, 70, 95, 58].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-zinc-700 to-white"
                style={{ height: `${h}%` }}
              />
              <span className="text-[8px] text-zinc-600">
                {"MTWTFSS"[i]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-5 text-zinc-500">
          Bridged ETH → Base, then clustered with two desks into LINK. Social
          mentions for LINK +47% in the same window.
        </p>
      </div>
    </MockSurface>
  );
}

function IntelligenceSummaryMock() {
  return (
    <MockSurface className="relative">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <p className="text-sm font-medium text-white">Summary · Today</p>
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
          <Settings2 className="h-3.5 w-3.5" />
          Customize
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] text-zinc-500">Tracked activity</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">142 moves</p>
          <p className="mt-1 text-[11px] text-emerald-400">+18% vs yesterday</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500">Signals hit target</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">68%</p>
          <p className="mt-1 text-[11px] text-zinc-500">of watched wallets</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4">
        <div className="rounded-xl border border-white/[0.07] bg-[#121214] p-3">
          <p className="text-[10px] text-zinc-500">Whale buys</p>
          <p className="mt-1 text-sm font-semibold text-white">$31.4M</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#121214] p-3">
          <p className="text-[10px] text-zinc-500">Bridge hops</p>
          <p className="mt-1 text-sm font-semibold text-white">19</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 px-4 pb-4">
        <svg viewBox="0 0 96 96" className="h-20 w-20 shrink-0">
          <circle cx="48" cy="48" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="48"
            cy="48"
            r="34"
            fill="none"
            stroke="#fff"
            strokeWidth="10"
            strokeDasharray="120 214"
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
          <circle
            cx="48"
            cy="48"
            r="34"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="10"
            strokeDasharray="55 214"
            strokeDashoffset="-120"
            transform="rotate(-90 48 48)"
          />
          <circle
            cx="48"
            cy="48"
            r="34"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="10"
            strokeDasharray="39 214"
            strokeDashoffset="-175"
            transform="rotate(-90 48 48)"
          />
        </svg>
        <ul className="space-y-1.5 text-[11px] text-zinc-400">
          <li className="flex justify-between gap-6">
            <span>On-chain</span>
            <span className="text-white">56%</span>
          </li>
          <li className="flex justify-between gap-6">
            <span>Social</span>
            <span className="text-white">26%</span>
          </li>
          <li className="flex justify-between gap-6">
            <span>Market</span>
            <span className="text-white">18%</span>
          </li>
        </ul>
      </div>
      <div className="absolute bottom-14 right-4 hidden rounded-xl border border-white/15 bg-[#161618] px-3 py-2 shadow-2xl sm:block">
        <p className="text-[10px] text-zinc-500">Focus cluster</p>
        <p className="text-sm font-semibold text-white">LINK · score 88</p>
        <p className="text-[10px] text-emerald-400">+8 vs average</p>
      </div>
    </MockSurface>
  );
}

function SmartMoneyTableMock() {
  const rows = [
    { name: "Wintermute Desk", week: "+$2.1M", pending: "3 alerts", score: "86", rate: "ETH" },
    { name: "Smart Money α", week: "+$1.2M", pending: "1 alert", score: "91", rate: "Base" },
    { name: "DeFi Accumulator", week: "+$420k", pending: "0", score: "74", rate: "BNB" },
    { name: "Arb Scout 07", week: "+$180k", pending: "2 alerts", score: "79", rate: "ARB" },
    { name: "NFT Flipper 09", week: "-$95k", pending: "0", score: "61", rate: "ETH" },
  ];

  return (
    <MockSurface>
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-sm font-medium text-white">Entity performance</p>
        <p className="text-[11px] text-zinc-500">Tracked desks · this week</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[12px]">
          <thead className="text-[10px] text-zinc-500">
            <tr className="border-b border-white/[0.05]">
              <th className="px-4 py-2.5 font-medium">Entity</th>
              <th className="px-3 py-2.5 font-medium">Flow</th>
              <th className="px-3 py-2.5 font-medium">Alerts</th>
              <th className="px-3 py-2.5 font-medium">Score</th>
              <th className="px-4 py-2.5 font-medium">Chain</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-white/[0.04] last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-500 to-zinc-800 text-[9px] font-semibold text-white">
                      {r.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="font-medium text-white">{r.name}</span>
                  </div>
                </td>
                <td
                  className={`px-3 py-3 font-medium ${
                    r.week.startsWith("+") ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {r.week}
                </td>
                <td className="px-3 py-3 text-zinc-400">{r.pending}</td>
                <td className="px-3 py-3 text-white">{r.score}</td>
                <td className="px-4 py-3 text-zinc-500">{r.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockSurface>
  );
}

function AlertCoachMock() {
  return (
    <MockSurface>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Priple · Signal coach
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          Three tracked wallets just stacked the same asset.
        </p>
        <p className="mt-2 text-[13px] leading-6 text-zinc-500">
          LINK Opportunity Score hit 88. Social mentions +47%. This is a
          correlation alert — not a trade call.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-zinc-500">Cluster size</p>
            <p className="mt-1 text-xl font-semibold text-white">$1.8M</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Confidence mix</p>
            <p className="mt-1 text-xl font-semibold text-white">81 / 100</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {[
            { label: "On-chain weight", pct: 58 },
            { label: "Social weight", pct: 26 },
            { label: "Market weight", pct: 16 },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>{row.label}</span>
                <span>{row.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <span className="rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#09090b]">
            Open cluster
          </span>
          <span className="rounded-full border border-white/12 px-4 py-2 text-[12px] text-zinc-400">
            Dismiss
          </span>
        </div>
      </div>
    </MockSurface>
  );
}

function WatchControlsMock() {
  return (
    <div className="relative mx-auto flex max-w-sm flex-col gap-3 py-2">
      <div className="priple-mock space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">Whale watch mode</p>
          <span className="relative h-6 w-11 rounded-full bg-white">
            <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-[#09090b]" />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["$50k+", "$100k+", "$250k+", "$1M+"].map((t, i) => (
            <span
              key={t}
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                i === 1
                  ? "bg-white text-[#09090b]"
                  : "border border-white/12 text-zinc-400"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">Minimum transfer size for live alerts</p>
      </div>
      <div className="priple-mock flex items-center justify-between px-4 py-3">
        <p className="text-sm text-white">Telegram push</p>
        <span className="relative h-6 w-11 rounded-full bg-white/15">
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-zinc-400" />
        </span>
      </div>
      <div className="priple-mock p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Muted noise</p>
          <span className="relative h-6 w-11 rounded-full bg-white">
            <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-[#09090b]" />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Memecoins", "NFT mints", "Dust txs", "Spam bridges"].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#121214] px-2 py-1 text-[11px] text-zinc-300"
            >
              {tag}
              <span className="text-zinc-600">×</span>
            </span>
          ))}
          <span className="px-2 py-1 text-[11px] text-zinc-500">Add filter</span>
        </div>
      </div>
    </div>
  );
}

export function FeatureShowcases() {
  return (
    <div id="features" className="scroll-mt-24 space-y-20 pb-8 sm:space-y-28">
      <section className="mx-auto max-w-6xl px-3 sm:px-6">
        <SectionHead
          eyebrow="Intelligence & flows"
          title="Know where smart money — and narrative heat — is moving"
          description="Priple fuses labeled wallet activity with market structure and social spikes so you see the full picture before you open ten tabs."
        />
        <DotStage>
          <div className="grid gap-4 lg:grid-cols-2">
            <PripleCard
              title="Opportunity dashboard"
              description="Watch whale inflow, composite scores, and token tables in one surface — built for crypto research, not billable hours."
            >
              <OpportunityDashboardMock />
            </PripleCard>
            <PripleCard
              title="Wallet signal briefs"
              description="Automatic entity reports: net flow, overlap wallets, and a week of activity — so you read the story, not the raw log."
            >
              <SignalBriefMock />
            </PripleCard>
          </div>
        </DotStage>
      </section>

      <section id="wallets" className="mx-auto max-w-6xl scroll-mt-24 px-3 sm:px-6">
        <SectionHead
          eyebrow="Desks & entities"
          title="Customize the watchlist. See utilization of every signal."
          description="Track the wallets that matter, score them, and keep alert load under control — same tool, tuned to how you research."
        />
        <DotStage>
          <div className="grid gap-4 lg:grid-cols-2">
            <PripleCard
              title="Intelligence summary"
              description="Daily snapshot of moves, hit-rate on watched wallets, and how much of today’s signal came from on-chain vs social vs market."
            >
              <IntelligenceSummaryMock />
            </PripleCard>
            <PripleCard
              title="Smart money table"
              description="Entity flow, open alerts, Opportunity Score, and home chain — desk-readable, not explorer-raw."
            >
              <SmartMoneyTableMock />
            </PripleCard>
          </div>
        </DotStage>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <Link href="/app/wallets" className="inline-flex items-center gap-1 hover:text-zinc-300">
            Open wallet tracker <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/app/screener" className="inline-flex items-center gap-1 hover:text-zinc-300">
            Open screener <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section id="screener" className="mx-auto max-w-6xl scroll-mt-24 px-3 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Alerts & focus
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Signal coach, not noise coach
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-zinc-400">
              When wallets correlate and scores spike, Priple explains the mix —
              on-chain, social, market — then lets you open the cluster or dismiss
              it. Informational only.
            </p>
            <div className="mt-6">
              <AlertCoachMock />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Personal filters
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Tuned per researcher
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-zinc-400">
              Set whale size thresholds, mute memecoin spam, and choose how hard
              alerts hit — without changing the shared intelligence layer.
            </p>
            <div className="mt-6">
              <WatchControlsMock />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
