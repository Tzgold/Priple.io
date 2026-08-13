import { Activity, Layers, LineChart } from "lucide-react";

const audiences = [
  {
    title: "Active traders",
    eyebrow: "Workflow",
    icon: Activity,
    body: "Move from a Smart Money alert to score, correlation, cross-chain flow, and coin context without rebuilding the story across five tools.",
    stat: "Alert → score",
    hint: "One research path",
  },
  {
    title: "Research desks",
    eyebrow: "Cohorts",
    icon: LineChart,
    body: "Monitor behavioral cohorts, compare wallet performance, share watchlists, and preserve the evidence behind every narrative and score.",
    stat: "Shared watchlists",
    hint: "Evidence preserved",
  },
  {
    title: "Token teams & analysts",
    eyebrow: "Context",
    icon: Layers,
    body: "Connect holder behavior and exchange flows with liquidity, social momentum, news, and risk — on one explainable timeline.",
    stat: "One timeline",
    hint: "On-chain + news",
  },
];

export function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-3 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl md:text-4xl">
          Built for decisions that need more than one signal
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-zinc-400 sm:mt-4 sm:text-[15px]">
          Track → detect → correlate → understand. Priple keeps the raw evidence
          available while turning fragmented on-chain and off-chain activity into
          a useful research workflow.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
        {audiences.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="priple-dash-card">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.12] bg-[#0c0c0e] text-white">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {item.eyebrow}
                </span>
              </div>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-zinc-400">{item.body}</p>
              <div className="mt-5 flex items-center justify-between rounded-[12px] border border-white/[0.1] bg-[#0c0c0e] px-3 py-2.5">
                <p className="text-[12px] font-medium text-white">{item.stat}</p>
                <p className="text-[11px] text-zinc-500">{item.hint}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
