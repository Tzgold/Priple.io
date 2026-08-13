import { Bell, Check, Plus, Radio } from "lucide-react";
import { CryptoIcon, type CryptoIconName } from "../CryptoIcons";
import { DotStage, PripleCard } from "../PripleCard";
import { ProductSection, SceneLabel } from "../ProductSection";

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
    <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-[#09090b]">
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
      eyebrow="01 · Smart-money tracking"
      title="Follow wallets and cohorts that consistently move first"
      description="Track any address, save favorite traders, or monitor curated Smart Money cohorts. See performance context and the exact assets they buy, sell, or bridge."
    >
      <DotStage>
        <PripleCard
          label="Wallet intelligence"
          title="The traders you care about, in one watchlist"
          description="Move beyond raw addresses. Priple combines labels, behavioral cohorts, realized performance, and recent activity so every wallet has context."
          className="min-h-0"
        >
          <TraderRows />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.12] bg-black/25 p-3">
              <SceneLabel>Any address</SceneLabel>
              <p className="mt-3 text-sm font-medium text-white">Paste and follow</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                Ethereum, Base, Arbitrum, BNB Chain, and Solana-ready UI.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.12] bg-black/25 p-3">
              <Radio className="h-4 w-4 text-zinc-400" />
              <p className="mt-3 text-sm font-medium text-white">
                Behavioral cohorts
              </p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                Group wallets by win rate, timing, protocols, and recurring assets.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.12] bg-black/25 p-3">
              <Bell className="h-4 w-4 text-zinc-400" />
              <p className="mt-3 text-sm font-medium text-white">
                Follow state travels
              </p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                The same watchlist powers alerts, correlation, and daily briefs.
              </p>
            </div>
          </div>
        </PripleCard>
      </DotStage>
    </ProductSection>
  );
}
