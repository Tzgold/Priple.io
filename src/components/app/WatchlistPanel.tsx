"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  CandlestickChart,
  ChevronDown,
  Home,
  LogOut,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { PripleMark } from "@/components/brand/PripleMark";
import { CopyButton } from "@/components/app/CopyButton";
import { TokenMark } from "@/components/app/TokenMark";
import { useAddWallet } from "@/components/app/WalletModalProvider";
import { cn } from "@/lib/cn";
import { useDesk } from "@/lib/app-store";
import { watchTokens } from "@/lib/mock/data";
import { signOut } from "@/lib/auth-client";

const nav = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/wallets", label: "Wallets", icon: Wallet },
  { href: "/app/screener", label: "Screener", icon: CandlestickChart },
  { href: "/app/alerts", label: "Alerts", icon: Bell },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const sorts = ["score", "pnl", "name"] as const;

export function WatchlistPanel({ workspace }: { workspace: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { trackedWallets, marketWallets, personalMode, sort, setSort, watchedTokens } = useDesk();
  const { openAddWallet } = useAddWallet();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const yourList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trackedWallets;
    return trackedWallets.filter(
      (wallet) =>
        wallet.label.toLowerCase().includes(q) ||
        wallet.address.toLowerCase().includes(q) ||
        wallet.asset.toLowerCase().includes(q),
    );
  }, [query, trackedWallets]);

  const marketList = useMemo(() => {
    if (personalMode) return [];
    const q = query.trim().toLowerCase();
    if (!q) return marketWallets;
    return marketWallets.filter(
      (wallet) =>
        wallet.label.toLowerCase().includes(q) ||
        wallet.address.toLowerCase().includes(q) ||
        wallet.asset.toLowerCase().includes(q),
    );
  }, [query, marketWallets, personalMode]);

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-[22px] border border-white/[0.08] bg-[#0c0c0e] lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[340px] xl:w-[360px]">
      <div className="relative flex items-center justify-between gap-3 px-4 pb-1 pt-4">
        <Link href="/" className="flex items-center gap-2.5">
          <PripleMark size={32} />
          <span className="font-sans text-[15px] font-semibold tracking-tight text-white">
            Priple
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex max-w-[148px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-zinc-300"
          title={workspace}
        >
          <span className="truncate">{workspace}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />
        </button>
        {menuOpen ? (
          <div className="absolute right-4 top-14 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#111113] py-1">
            <Link
              href="/app/settings"
              className="block px-3 py-2 font-mono text-[11px] text-zinc-300 hover:bg-white/[0.04]"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] text-zinc-300 hover:bg-white/[0.04]"
              onClick={async () => {
                await signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/login"),
                  },
                });
              }}
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        ) : null}
      </div>

      <nav className="mx-4 mt-4 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/40 px-2 py-1.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 px-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          Coin watchlist
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {watchedTokens.length === 0
            ? watchTokens.map((token) => (
                <Link
                  key={token.symbol}
                  href={`/app/screener?token=${token.symbol}`}
                  className="flex w-11 shrink-0 flex-col items-center gap-2 opacity-50"
                  title={`${token.name} (pin coins from screener)`}
                >
                  <TokenMark symbol={token.symbol} size={36} />
                  <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-600">
                    {token.symbol}
                  </span>
                </Link>
              ))
            : watchedTokens.slice(0, 10).map((token) => (
                <Link
                  key={token.id}
                  href={`/app/screener?network=${encodeURIComponent(token.network)}&address=${encodeURIComponent(token.address)}`}
                  className="flex w-11 shrink-0 flex-col items-center gap-2"
                  title={token.name}
                >
                  <TokenMark symbol={token.symbol} imageUrl={token.imageUrl} size={36} />
                  <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                    {token.symbol}
                  </span>
                </Link>
              ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 className="font-sans text-[15px] font-semibold text-white">Your wallets</h2>
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            {trackedWallets.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <button
            type="button"
            onClick={openAddWallet}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.04] hover:text-white"
            title="Add wallet"
          >
            <Plus className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={() => {
              const index = sorts.indexOf(sort);
              setSort(sorts[(index + 1) % sorts.length]);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.04] hover:text-white"
            title={`Sort by ${sort}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="mx-4 mt-3 flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3">
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search desks, addresses…"
          className="w-full bg-transparent font-mono text-[12px] text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <ul className="mt-2 flex-1 space-y-0.5 overflow-auto px-2 pb-4">
        {yourList.map((wallet) => (
          <li key={wallet.id}>
            <Link
              href={`/app/wallets?id=${wallet.id}`}
              className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.035]"
            >
              <TokenMark symbol={wallet.asset} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[13px] font-medium text-white">{wallet.label}</p>
                  <CopyButton value={wallet.fullAddress || wallet.address} />
                </div>
                <p className="truncate font-mono text-[11px] text-zinc-500">{wallet.address}</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "font-mono text-[12px] font-medium",
                    wallet.pnl30d.startsWith("+")
                      ? "text-teal-400"
                      : wallet.pnl30d.startsWith("-")
                        ? "text-rose-400"
                        : "text-zinc-400",
                  )}
                >
                  {wallet.pnl30d}
                </p>
                <p className="font-mono text-[11px] text-zinc-500">{wallet.usd}</p>
              </div>
            </Link>
          </li>
        ))}
        {yourList.length === 0 ? (
          <li className="px-3 py-5 text-center">
            <p className="font-mono text-[11px] text-zinc-600">No wallets yet.</p>
            <button
              type="button"
              onClick={openAddWallet}
              className="mt-2 font-mono text-[11px] text-teal-400 hover:text-teal-300"
            >
              Track an address
            </button>
          </li>
        ) : null}

        {marketList.length > 0 ? (
          <>
            <li className="px-2.5 pb-1 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                Market desks
              </p>
            </li>
            {marketList.map((wallet) => (
              <li key={wallet.id}>
                <Link
                  href={`/app/wallets?id=${wallet.id}`}
                  className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.035]"
                >
                  <TokenMark symbol={wallet.asset} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[13px] font-medium text-zinc-200">
                        {wallet.label}
                      </p>
                      <CopyButton value={wallet.address} />
                    </div>
                    <p className="truncate font-mono text-[11px] text-zinc-600">{wallet.address}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-mono text-[12px] font-medium",
                        wallet.pnl30d.startsWith("+")
                          ? "text-teal-400"
                          : wallet.pnl30d.startsWith("-")
                            ? "text-rose-400"
                            : "text-zinc-400",
                      )}
                    >
                      {wallet.pnl30d}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-600">{wallet.usd}</p>
                  </div>
                </Link>
              </li>
            ))}
          </>
        ) : null}
      </ul>
    </aside>
  );
}
