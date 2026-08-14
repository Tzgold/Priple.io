import { ArrowRight, GitBranch, Radar } from "lucide-react";
import { CryptoIcon, type CryptoIconName } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection, SceneLabel } from "../ProductSection";

const chainPath: Array<{
  name: string;
  icon: CryptoIconName;
  detail: string;
}> = [
  { name: "Ethereum", icon: "ethereum", detail: "$1.2M ETH" },
  { name: "Base", icon: "base", detail: "Bridge in" },
  { name: "Arbitrum", icon: "arbitrum", detail: "LINK buy" },
];

function WalletNode({
  label,
  address,
  className,
}: {
  label: string;
  address: string;
  className: string;
}) {
  return (
    <div
      className={`scene-node-glow absolute z-10 w-[132px] rounded-none border border-white/[0.12] bg-[#151517] p-3 ${className}`}
    >
      <p className="text-[11px] font-medium text-white">{label}</p>
      <p className="mt-1 font-mono text-[8px] text-zinc-600">{address}</p>
      <p className="mt-2 text-[9px] text-emerald-400">Accumulating</p>
    </div>
  );
}

function CorrelationGraph() {
  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-none border border-white/[0.12] bg-[#09090b] p-4">
      <div className="absolute inset-0 scene-muted-grid opacity-75" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_40%)]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 600 340"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flow-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,.12)" />
            <stop offset=".5" stopColor="rgba(255,255,255,.7)" />
            <stop offset="1" stopColor="rgba(255,255,255,.12)" />
          </linearGradient>
        </defs>
        <path
          d="M135 80 C245 80 220 170 300 170"
          fill="none"
          stroke="url(#flow-line)"
          strokeDasharray="5 7"
        />
        <path
          d="M135 255 C225 255 225 180 300 170"
          fill="none"
          stroke="url(#flow-line)"
          strokeDasharray="5 7"
        />
        <path
          d="M465 80 C370 80 380 155 300 170"
          fill="none"
          stroke="url(#flow-line)"
          strokeDasharray="5 7"
        />
        <circle cx="300" cy="170" r="64" fill="rgba(255,255,255,.015)" />
        <circle
          cx="300"
          cy="170"
          r="64"
          fill="none"
          stroke="rgba(255,255,255,.08)"
          strokeDasharray="2 8"
        />
      </svg>

      <WalletNode
        label="Smart Money α"
        address="0x71a9…08d3"
        className="left-4 top-5 sm:left-8"
      />
      <WalletNode
        label="Early LP 12"
        address="0x2b91…c4e0"
        className="bottom-5 left-4 sm:left-8"
      />
      <WalletNode
        label="Momentum Desk"
        address="9B5x…pQ7a"
        className="right-4 top-5 sm:right-8"
      />

      <div className="scene-node-glow absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/[0.18] bg-[#151517]">
        <CryptoIcon name="link" size={34} />
        <p className="mt-1 text-[10px] font-medium text-white">LINK</p>
        <p className="text-[8px] text-zinc-600">Shared target</p>
      </div>

      <div className="absolute bottom-4 right-4 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[9px] text-zinc-500">
        Correlation window · 42m
      </div>
    </div>
  );
}

function CrossChainPath() {
  return (
    <div className="rounded-none border border-white/[0.12] bg-[#09090b] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Cross-chain trace</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">
            One entity · three networks · mock path
          </p>
        </div>
        <Radar className="h-4 w-4 text-zinc-500" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {chainPath.map((chain, index) => (
          <div key={chain.name} className="contents">
            <div className="flex flex-1 items-center gap-3 rounded-none border border-white/[0.12] bg-[#141416] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-white/10 bg-black/30">
                <CryptoIcon name={chain.icon} size={24} />
              </span>
              <div>
                <p className="text-[12px] font-medium text-white">{chain.name}</p>
                <p className="mt-0.5 text-[9px] text-zinc-600">{chain.detail}</p>
              </div>
            </div>
            {index < chainPath.length - 1 ? (
              <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-zinc-600 sm:rotate-0" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          ["Bridge", "Across"],
          ["Elapsed", "18 minutes"],
          ["Destination buy", "$420k LINK"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-none border border-white/[0.06] bg-black/25 px-3 py-2"
          >
            <p className="text-[8px] uppercase tracking-wider text-zinc-600">
              {label}
            </p>
            <p className="mt-1 text-[11px] text-zinc-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlowsScene() {
  return (
    <ProductSection
      id="flows"
      eyebrow="04 · Flows"
      title="When wallets start moving together"
      description="Overlap, leader/follower patterns, and bridge paths as one flow."
    >
      <DotStage>
        <PripleCard
          label="Relationship intelligence"
          title="Three wallets. One asset. Then a hop."
          description="Correlation catches the cluster. Tracing keeps it across chains."
          className="min-h-0"
          petal="br-tl"
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <CorrelationGraph />
            <div className="flex flex-col gap-4">
              <CrossChainPath />
              <div className="flex flex-1 items-start gap-3 rounded-none border border-white/[0.12] bg-black/25 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-white/10 bg-[#151517]">
                  <GitBranch className="h-4 w-4 text-zinc-400" />
                </span>
                <div>
                  <SceneLabel>Leader/follower candidate</SceneLabel>
                  <p className="mt-3 text-[13px] leading-6 text-zinc-300">
                    Smart Money α entered first. Two historically related wallets
                    followed within 31 minutes on separate chains.
                  </p>
                  <p className="mt-2 text-[10px] leading-5 text-zinc-600">
                    Pattern confidence 81/100 · research signal, not causation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
