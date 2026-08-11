"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Search,
  Settings,
  Wallet,
  CandlestickChart,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/wallets", label: "Wallets", icon: Wallet },
  { href: "/app/screener", label: "Screener", icon: CandlestickChart },
  { href: "#", label: "Alerts", icon: Bell, disabled: true },
  { href: "#", label: "Settings", icon: Settings, disabled: true },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0c0c0e]">
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.07] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black text-xs font-semibold">
          P
        </div>
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          Priple
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            !item.disabled &&
            (item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href));

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-600"
                title="Coming soon"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white/[0.06] text-white"
                  : "text-zinc-400 hover:bg-white/[0.03] hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <p className="text-xs font-medium text-white">Pro unlocks soon</p>
          <p className="mt-1 text-[11px] leading-4 text-zinc-500">
            Unlimited wallets, custom alerts, AI narratives.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function AppTopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#0c0c0e]/80 px-5 backdrop-blur-md">
      <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-white/10 bg-[#141416] px-3 text-sm text-zinc-500">
        <Search className="h-3.5 w-3.5" />
        <span>Search wallets, tokens, entities…</span>
        <kbd className="ml-auto hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-600 sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-300 sm:inline">
          Pro
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-400 to-zinc-700 text-[11px] font-semibold text-white">
          You
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
