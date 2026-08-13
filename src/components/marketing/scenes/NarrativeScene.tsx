import { Bot, ExternalLink, FileText, Sparkles } from "lucide-react";
import { CryptoIcon } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection, SceneLabel } from "../ProductSection";

const facts = [
  { label: "Net flow", value: "+$1.24M", tone: "text-emerald-400" },
  { label: "Profitable trades", value: "7 / 9", tone: "text-white" },
  { label: "Protocols used", value: "4", tone: "text-white" },
  { label: "Wallet overlap", value: "3 cohorts", tone: "text-white" },
];

export function NarrativeScene() {
  return (
    <ProductSection
      id="narrative"
      eyebrow="05 · AI wallet narratives"
      title="Read the wallet story without reconstructing it transaction by transaction"
      description="Priple turns normalized wallet activity into a concise briefing, while keeping the supporting facts visible so every sentence can be checked."
    >
      <DotStage>
        <PripleCard
          label="Daily wallet brief"
          title="Smart Money Alpha changed its behavior"
          description="The narrative explains what happened, what was unusual, and which related wallets or assets deserve a closer look."
          className="min-h-0"
        >
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/[0.12] bg-[#09090b]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#151517]">
                    <Bot className="h-4 w-4 text-zinc-300" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Priple Narrative</p>
                    <p className="mt-0.5 text-[9px] text-zinc-600">
                      AI summary · mock data · 24h
                    </p>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-zinc-500" />
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-[15px] leading-7 text-zinc-300">
                  Smart Money Alpha shifted from passive staking to active
                  accumulation. The wallet bridged{" "}
                  <span className="font-medium text-white">$1.2M ETH</span> to
                  Base, entered LINK across two venues, and increased its position
                  after two historically related wallets joined the same asset.
                </p>
                <p className="mt-4 text-[15px] leading-7 text-zinc-300">
                  The behavior differs from its prior 30-day pattern: transaction
                  size is 2.4× higher, protocol usage expanded from one to four,
                  and exchange deposits fell while self-custodied balances rose.
                </p>

                <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                  <div className="flex items-center gap-2">
                    <CryptoIcon name="link" size={20} />
                    <p className="text-[11px] font-medium text-white">
                      What changed around LINK
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-zinc-600">
                    Smart-money netflow turned positive, social momentum rose 47%,
                    and liquidity held while three followed wallets accumulated.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-xl border border-white/[0.12] bg-[#09090b] p-3.5"
                  >
                    <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                      {fact.label}
                    </p>
                    <p className={`mt-2 text-lg font-semibold ${fact.tone}`}>
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex-1 rounded-2xl border border-white/[0.12] bg-[#09090b] p-4">
                <div className="flex items-center justify-between">
                  <SceneLabel>Evidence trail</SceneLabel>
                  <FileText className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      time: "14:31",
                      text: "Bridged 342 ETH from Ethereum to Base",
                      icon: "ethereum" as const,
                    },
                    {
                      time: "14:49",
                      text: "Bought $420k LINK across two pools",
                      icon: "link" as const,
                    },
                    {
                      time: "15:02",
                      text: "Wallet overlap increased from 1 to 3",
                      icon: "base" as const,
                    },
                  ].map((event) => (
                    <div
                      key={event.time}
                      className="flex items-start gap-3 border-b border-white/[0.055] pb-3 last:border-0 last:pb-0"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-[#141416]">
                        <CryptoIcon name={event.icon} size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-600">{event.time} UTC</p>
                        <p className="mt-1 text-[11px] leading-5 text-zinc-300">
                          {event.text}
                        </p>
                      </div>
                      <ExternalLink className="ml-auto mt-1 h-3 w-3 shrink-0 text-zinc-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
