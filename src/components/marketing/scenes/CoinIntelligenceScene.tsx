import { Newspaper, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { CryptoIcon } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection, SceneLabel } from "../ProductSection";

function IntelligenceChart() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#09090b] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CryptoIcon name="link" size={28} />
          <div>
            <p className="text-sm font-medium text-white">LINK / USD</p>
            <p className="text-[10px] text-zinc-600">$18.92 · mock chart</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-emerald-400">+8.7%</p>
          <p className="text-[9px] text-zinc-600">24 hours</p>
        </div>
      </div>

      <div className="relative mt-4">
        <svg
          viewBox="0 0 700 300"
          className="h-[260px] w-full"
          preserveAspectRatio="none"
          aria-label="Mock LINK price chart with wallet and news overlays"
        >
          <defs>
            <linearGradient id="price-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {[50, 100, 150, 200, 250].map((y) => (
            <line
              key={y}
              x1="0"
              x2="700"
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,.035)"
            />
          ))}
          <path
            d="M0 245 C45 238 70 212 110 218 C155 225 175 180 220 185 C270 190 285 145 330 154 C375 163 405 118 445 125 C490 132 505 92 555 105 C605 118 635 75 700 64 L700 300 L0 300Z"
            fill="url(#price-area)"
          />
          <path
            d="M0 245 C45 238 70 212 110 218 C155 225 175 180 220 185 C270 190 285 145 330 154 C375 163 405 118 445 125 C490 132 505 92 555 105 C605 118 635 75 700 64"
            fill="none"
            stroke="rgba(255,255,255,.88)"
            strokeWidth="2.5"
          />
          <line
            x1="220"
            x2="220"
            y1="25"
            y2="280"
            stroke="rgba(16,185,129,.45)"
            strokeDasharray="4 6"
          />
          <line
            x1="445"
            x2="445"
            y1="25"
            y2="280"
            stroke="rgba(244,63,94,.38)"
            strokeDasharray="4 6"
          />
          <line
            x1="555"
            x2="555"
            y1="25"
            y2="280"
            stroke="rgba(255,255,255,.22)"
            strokeDasharray="4 6"
          />
          <circle cx="220" cy="185" r="5" fill="#10b981" />
          <circle cx="445" cy="125" r="5" fill="#f43f5e" />
          <circle cx="555" cy="105" r="5" fill="#fff" />
        </svg>

        <div className="absolute left-[27%] top-5 rounded-full bg-emerald-400 px-2 py-1 text-[8px] font-semibold text-[#07110d]">
          3 wallets BUY
        </div>
        <div className="absolute left-[58%] top-16 rounded-full bg-rose-400 px-2 py-1 text-[8px] font-semibold text-[#16080b]">
          Exchange SELL
        </div>
        <div className="absolute right-[9%] top-6 max-w-[150px] rounded-xl border border-white/12 bg-[#151517] p-2.5">
          <div className="flex items-center gap-1.5">
            <Newspaper className="h-3 w-3 text-zinc-400" />
            <p className="text-[8px] font-medium uppercase tracking-wider text-zinc-500">
              News overlay
            </p>
          </div>
          <p className="mt-1.5 text-[9px] leading-4 text-zinc-300">
            Protocol announces new institutional data partnership
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.06] pt-3 text-[9px] text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Followed-wallet buy
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> Exchange deposit
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white" /> News/social event
        </span>
      </div>
    </div>
  );
}

export function CoinIntelligenceScene() {
  return (
    <ProductSection
      id="intelligence"
      eyebrow="06 · Social, news & coin analysis"
      title="Put wallet moves on the same timeline as price, social momentum, and news"
      description="A transaction is more useful when you know what happened around it. Priple overlays off-chain events and token fundamentals on the same research surface."
    >
      <DotStage>
        <PripleCard
          label="Mixed-signal context"
          title="Understand the coin behind the wallet alert"
          description="Open a token from any alert or wallet narrative and inspect price action, Smart Money flow, social acceleration, news events, liquidity, and concentration."
          className="min-h-0"
        >
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <IntelligenceChart />

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-white/[0.12] bg-[#09090b] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Coin analysis</p>
                  <SceneLabel>Mock</SceneLabel>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: "Smart Money netflow",
                      value: "+$6.2M",
                      icon: TrendingUp,
                      tone: "text-emerald-400",
                    },
                    {
                      label: "Liquidity",
                      value: "$842M",
                      icon: ShieldAlert,
                      tone: "text-white",
                    },
                    {
                      label: "Top-20 concentration",
                      value: "31%",
                      icon: Users,
                      tone: "text-white",
                    },
                    {
                      label: "Social acceleration",
                      value: "+47%",
                      icon: Newspaper,
                      tone: "text-white",
                    },
                  ].map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#141416] p-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="text-[10px] text-zinc-500">
                            {metric.label}
                          </span>
                        </div>
                        <span className={`text-[12px] font-medium ${metric.tone}`}>
                          {metric.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-white/[0.12] bg-[#09090b] p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-600">
                  Narrative pulse
                </p>
                <p className="mt-3 text-[13px] leading-6 text-zinc-300">
                  Social activity is rising with wallet accumulation rather than
                  preceding it. News coverage is concentrated around infrastructure
                  adoption, not short-lived price speculation.
                </p>
                <p className="mt-3 text-[10px] leading-5 text-zinc-600">
                  Sources require licensed or official APIs in production.
                </p>
              </div>
            </div>
          </div>
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
