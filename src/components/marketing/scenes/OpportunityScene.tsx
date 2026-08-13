import { ArrowDownToLine, MessageSquareText, ShieldCheck, Waves } from "lucide-react";
import { CryptoIcon } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection, SceneLabel } from "../ProductSection";

const dimensions = [
  {
    label: "On-chain flows",
    value: 92,
    detail: "3 followed wallets accumulating",
    icon: ArrowDownToLine,
  },
  {
    label: "Social momentum",
    value: 78,
    detail: "Mentions +47%, quality stable",
    icon: MessageSquareText,
  },
  {
    label: "Market structure",
    value: 84,
    detail: "Volume expanding with liquidity",
    icon: Waves,
  },
  {
    label: "Risk quality",
    value: 73,
    detail: "Holder concentration moderate",
    icon: ShieldCheck,
  },
];

function ScoreDial() {
  const circumference = 2 * Math.PI * 72;
  const filled = circumference * 0.86;

  return (
    <div className="relative mx-auto flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
      <div className="absolute inset-4 rounded-full bg-white/[0.025] blur-2xl" />
      <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="90"
          cy="90"
          r="72"
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth="9"
        />
        <circle
          cx="90"
          cy="90"
          r="72"
          fill="none"
          stroke="rgba(255,255,255,.92)"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          strokeWidth="9"
        />
      </svg>
      <div className="relative text-center">
        <div className="mb-2 flex justify-center">
          <CryptoIcon name="link" size={30} />
        </div>
        <p className="text-5xl font-semibold tracking-[-0.06em] text-white">86</p>
        <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-600">
          Opportunity score
        </p>
        <p className="mt-2 text-[10px] text-emerald-400">+6 in 24h</p>
      </div>
    </div>
  );
}

export function OpportunityScene() {
  return (
    <ProductSection
      id="opportunity"
      eyebrow="03 · Opportunity Score"
      title="A single score, with every reason visible"
      description="Priple combines wallet flows, social momentum, market structure, and token risk into an interpretable score. You can always inspect the evidence behind it."
    >
      <DotStage>
        <PripleCard
          label="Transparent composite"
          title="LINK is showing converging evidence"
          description="The score organizes attention; it does not predict a price or issue a buy/sell recommendation."
          className="min-h-0"
        >
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.12] bg-[#09090b] p-5">
              <SceneLabel>Mock analysis · 24h</SceneLabel>
              <ScoreDial />
              <div className="grid w-full grid-cols-3 gap-2">
                {[
                  ["Smart netflow", "+$6.2M"],
                  ["Liquidity", "$842M"],
                  ["Social delta", "+47%"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/[0.07] bg-black/25 p-2 text-center"
                  >
                    <p className="text-[8px] uppercase tracking-wider text-zinc-600">
                      {label}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.12] bg-[#09090b] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Score breakdown</p>
                <span className="text-[10px] text-zinc-600">Updated 4m ago</span>
              </div>
              <div className="mt-5 space-y-5">
                {dimensions.map((dimension) => {
                  const Icon = dimension.icon;
                  return (
                    <div key={dimension.label}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-[#141416]">
                            <Icon className="h-3.5 w-3.5 text-zinc-400" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-zinc-200">
                              {dimension.label}
                            </p>
                            <p className="truncate text-[9px] text-zinc-600">
                              {dimension.detail}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {dimension.value}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-zinc-500 to-white"
                          style={{ width: `${dimension.value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                <p className="text-[10px] font-medium text-zinc-400">
                  Why the score rose
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-zinc-600">
                  Two profitable cohorts joined an existing accumulation cluster
                  while exchange outflow increased and social quality remained stable.
                </p>
              </div>
            </div>
          </div>
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
