import {
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  ToggleRight,
  Type,
  Waves,
} from "lucide-react";

const features = [
  {
    id: "scorecard",
    title: "Smart Scorecard",
    description: "On-chain flows, social buzz, and fundamentals in one Opportunity Score.",
    span: "lg:col-span-3",
    visual: (
      <div className="flex h-full min-h-[160px] items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          Score
        </span>
      </div>
    ),
    icon: Type,
  },
  {
    id: "wallets",
    title: "Wallet tracking",
    description: "Follow whales and smart money with labeled entities and live moves.",
    span: "lg:col-span-3",
    visual: (
      <div className="relative flex h-full min-h-[160px] items-end justify-end overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(180,180,200,0.22),transparent_55%)]" />
        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
        <Waves className="relative h-10 w-10 text-zinc-300" strokeWidth={1.25} />
      </div>
    ),
    icon: Waves,
  },
  {
    id: "transitions",
    title: "Cross-chain flows",
    description: "Catch bridge hops and multi-network accumulation before the crowd.",
    span: "lg:col-span-2",
    visual: (
      <div className="flex h-full min-h-[140px] items-center justify-center">
        <span className="text-6xl font-semibold text-zinc-700/80">01</span>
      </div>
    ),
    icon: Activity,
  },
  {
    id: "alerts",
    title: "Live alerts",
    description: "Composable conditions for wallets, tokens, and sentiment spikes.",
    span: "lg:col-span-2",
    visual: (
      <div className="flex h-full min-h-[140px] items-center justify-center">
        <Sparkles className="h-14 w-14 text-zinc-300" strokeWidth={1.1} />
      </div>
    ),
    icon: Sparkles,
  },
  {
    id: "ai",
    title: "AI narratives",
    description: "Plain-language briefs of wallet activity — research without the grind.",
    span: "lg:col-span-2",
    visual: (
      <div className="flex h-full min-h-[140px] items-center justify-center">
        <ToggleRight className="h-14 w-14 text-zinc-200" strokeWidth={1.1} />
      </div>
    ),
    icon: Layers,
  },
];

export function FeatureBento() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 pb-24">
      <div className="surface-xl overflow-hidden p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <a
                key={feature.id}
                id={
                  feature.id === "wallets"
                    ? "wallets"
                    : feature.id === "scorecard"
                      ? "screener"
                      : undefined
                }
                href="/signup"
                className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] transition-colors hover:border-white/14 hover:bg-[#17171a] ${feature.span}`}
              >
                <div className="dot-panel flex-1 border-b border-white/[0.06]">
                  {feature.visual}
                </div>
                <div className="flex items-start gap-3 p-4 pr-10">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                    <p className="mt-1 text-[13px] leading-5 text-zinc-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-300" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
