import { Check, Plus } from "lucide-react";
import { CryptoIcon, type CryptoIconName } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection } from "../ProductSection";

const traders: Array<{
  name: string;
  address: string;
  cohort: string;
  pnl: string;
  action: "BUY" | "SELL";
  amount: string;
  token: CryptoIconName;
  chain: CryptoIconName;
  time: string;
  followed: boolean;
}> = [
  {
    name: "Smart Money Alpha",
    address: "0x71a9…08d3",
    cohort: "High win rate",
    pnl: "+42.1%",
    action: "BUY",
    amount: "$184k LINK",
    token: "link",
    chain: "ethereum",
    time: "2m",
    followed: true,
  },
  {
    name: "DeFi Accumulator",
    address: "0x2b91…c4e0",
    cohort: "Early LP",
    pnl: "+18.4%",
    action: "BUY",
    amount: "$96k ETH",
    token: "eth",
    chain: "base",
    time: "11m",
    followed: true,
  },
  {
    name: "Momentum Desk",
    address: "9B5x…pQ7a",
    cohort: "SOL specialist",
    pnl: "+27.8%",
    action: "SELL",
    amount: "$71k SOL",
    token: "sol",
    chain: "solana",
    time: "24m",
    followed: false,
  },
];

function TraderRows() {
  return (
    <div className="overflow-hidden rounded-none border border-white/[0.12] bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Trader watchlist</p>
          <p className="mt-0.5 text-[10px] text-zinc-600">
            Favorite wallets and curated cohorts · mock data
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-300"
        >
          <Plus className="h-3 w-3" />
          Add wallet
        </button>
      </div>

      <div className="divide-y divide-white/[0.055]">
        {traders.map((trader) => (
          <div
            key={trader.address}
            className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.5fr)_0.65fr_1fr_auto] sm:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#151517]">
                <CryptoIcon name={trader.chain} size={23} />
                <span className="absolute -bottom-1 -right-1 rounded-full border border-[#09090b] bg-[#151517] p-0.5">
                  <CryptoIcon name={trader.token} size={13} />
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">
                  {trader.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-600">
                  {trader.address} · {trader.cohort}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                30d realized
              </p>
              <p className="mt-1 text-[12px] font-medium text-emerald-400">
                {trader.pnl}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={
                  trader.action === "BUY"
                    ? "rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold text-emerald-400"
                    : "rounded-full bg-rose-400/10 px-2 py-1 text-[9px] font-semibold text-rose-400"
                }
              >
                {trader.action}
              </span>
              <div>
                <p className="text-[11px] text-zinc-200">{trader.amount}</p>
                <p className="text-[9px] text-zinc-600">{trader.time} ago</p>
              </div>
            </div>

            <button
              type="button"
              aria-label={
                trader.followed
                  ? `Following ${trader.name}`
                  : `Follow ${trader.name}`
              }
              className={
                trader.followed
                  ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white text-[#09090b]"
                  : "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-500"
              }
            >
              {trader.followed ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmartMoneyScene() {
  return (
    <ProductSection
      id="smart-money"
      eyebrow="01 · Smart money"
      title="Follow the wallets that move first"
      description="Any address, favorite traders, or curated cohorts — with buy/sell context."
    >
      <DotStage>
        <PripleCard
          label="Watchlist"
          title="The desks you track"
          description="Labels, performance, and the last move — in one list."
          className="min-h-0"
          petal="tl-br"
        >
          <TraderRows />
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
