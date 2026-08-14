import { Bell, Check, Mail, MessageCircle, SlidersHorizontal } from "lucide-react";
import { CryptoIcon } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection, SceneLabel } from "../ProductSection";

const rules = [
  { label: "Entity", value: "Smart Money cohort" },
  { label: "Action", value: "Buys or sells" },
  { label: "Value", value: "More than $50,000" },
  { label: "Opportunity", value: "Score ≥ 80" },
  { label: "Social", value: "Momentum above +40%" },
];

function RuleBuilder() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-none border border-white/[0.12] bg-[#09090b] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Alert rule</p>
            <p className="mt-0.5 text-[10px] text-zinc-600">
              Five conditions · mock configuration
            </p>
          </div>
          <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
        </div>

        <div className="mt-5 space-y-2">
          {rules.map((rule, index) => (
            <div
              key={rule.label}
              className="grid grid-cols-[64px_1fr] items-center gap-3"
            >
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                {index === 0 ? "When" : "And"}
              </span>
              <button
                type="button"
                className="flex min-h-10 items-center justify-between rounded-none border border-white/[0.09] bg-[#131315] px-3 text-left"
              >
                <span>
                  <span className="mr-2 text-[10px] text-zinc-600">
                    {rule.label}
                  </span>
                  <span className="text-[12px] text-zinc-200">{rule.value}</span>
                </span>
                <span className="text-zinc-600">⌄</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
            Deliver to
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "In app", icon: Bell, active: true },
              { label: "Telegram", icon: MessageCircle, active: true },
              { label: "Email", icon: Mail, active: false },
            ].map((channel) => {
              const Icon = channel.icon;
              return (
                <button
                  key={channel.label}
                  type="button"
                  className={
                    channel.active
                      ? "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1.5 text-[11px] text-[#09090b]"
                      : "inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-500"
                  }
                >
                  <Icon className="h-3 w-3" />
                  {channel.label}
                  {channel.active ? <Check className="h-3 w-3" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-none border border-white/[0.12] bg-[#09090b] p-4 sm:p-5">
        <SceneLabel className="self-start">Resulting notification</SceneLabel>
        <div className="scene-node-glow mt-5 rounded-none border border-white/[0.12] bg-[#151517] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30">
                <CryptoIcon name="link" size={20} />
              </span>
              <div>
                <p className="text-[12px] font-medium text-white">
                  Correlated LINK buy
                </p>
                <p className="text-[9px] text-zinc-600">Triggered 16:42 UTC</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-4 text-[13px] leading-6 text-zinc-300">
            Three followed wallets bought{" "}
            <span className="font-medium text-white">$184k LINK</span>. Opportunity
            Score is 86 and social momentum is +47%.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Wallets", "3"],
              ["Net buy", "$184k"],
              ["Score", "86"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-none border border-white/[0.07] bg-black/25 p-2"
              >
                <p className="text-[8px] uppercase tracking-wider text-zinc-600">
                  {label}
                </p>
                <p className="mt-1 text-[12px] font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-full bg-white py-2 text-[11px] font-medium text-[#09090b]"
          >
            Open coin analysis
          </button>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-zinc-600">
          Alerts direct attention; they are not trade recommendations.
        </p>
      </div>
    </div>
  );
}

export function AlertsScene() {
  return (
    <ProductSection
      id="alerts"
      eyebrow="02 · Alerts"
      title="Build the alert you actually mean"
      description="Who moved, buy or sell, size, score, and social heat — delivered in-app, Telegram, or email."
    >
      <DotStage>
        <PripleCard
          label="Custom surveillance"
          title="From a fill to a decision prompt"
          description="Who moved, who else agrees, and what the score says."
          className="min-h-0"
          petal="tr-bl"
        >
          <RuleBuilder />
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
