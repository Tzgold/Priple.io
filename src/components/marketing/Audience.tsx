import { Activity, Layers, LineChart } from "lucide-react";
import { CardBorder } from "@/components/marketing/PripleCard";

const audiences = [
  {
    title: "Traders",
    icon: Activity,
    body: "Alert → score → flow → coin. One path.",
  },
  {
    title: "Research desks",
    icon: LineChart,
    body: "Cohorts, watchlists, and the evidence behind every score.",
  },
  {
    title: "Token teams",
    icon: Layers,
    body: "Holders, liquidity, social, and news on one timeline.",
  },
];

export function Audience() {
  return (
    <section className="mx-auto max-w-6xl px-3 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl md:text-4xl">
          Built for more than one signal
        </h2>
        <p className="mt-3 font-mono text-[12px] leading-6 text-zinc-400 sm:text-[13px]">
          Track → detect → correlate → understand.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
        {audiences.map((item, index) => {
          const Icon = item.icon;
          const petal = (["tl-br", "tr-bl", "bl-tr"] as const)[index];
          return (
            <article key={item.title} className="priple-dash-card" data-petal={petal}>
              <CardBorder />
              <div className="priple-card-fill">
                <span className="inline-flex h-9 w-9 items-center justify-center border border-white/[0.12] bg-[#0c0c0e] text-white">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <h3 className="mt-8 font-sans text-[15px] font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-3 font-mono text-[12px] leading-6 text-zinc-400">{item.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
