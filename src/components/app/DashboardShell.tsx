"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Bell, LogOut } from "lucide-react";
import { CommandSearch } from "@/components/app/CommandSearch";
import { CopyButton } from "@/components/app/CopyButton";
import { WatchlistPanel } from "@/components/app/WatchlistPanel";
import { WalletModalProvider } from "@/components/app/WalletModalProvider";
import { DeskProvider } from "@/lib/app-store";
import { signOut } from "@/lib/auth-client";

type AppUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function DashboardTopBar({ user }: { user: AppUser }) {
  const router = useRouter();
  const initials =
    user.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || user.email.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate font-sans text-[17px] font-semibold tracking-tight text-white">
          {user.name || "Research desk"}
        </h1>
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          <span className="truncate">{user.email}</span>
          <CopyButton value={user.email} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CommandSearch />
        <Link
          href="/app/alerts"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-400 transition-colors hover:text-white"
          title="Alerts"
        >
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-400 transition-colors hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.6} />
        </button>
        <Link
          href="/app/settings"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-zinc-300 to-zinc-700 text-[11px] font-semibold text-white"
          title="Settings"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <DeskProvider>
      <WalletModalProvider>
        <div className="min-h-screen bg-black text-white">
          <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:p-5">
            <Suspense fallback={<aside className="hidden lg:block lg:w-[340px] xl:w-[360px]" />}>
              <WatchlistPanel workspace={user.email} />
            </Suspense>
            <section className="flex min-w-0 flex-1 flex-col rounded-[22px] border border-white/[0.08] bg-[#0c0c0e] p-4 sm:p-5">
              <DashboardTopBar user={user} />
              <div className="min-h-0 flex-1">{children}</div>
            </section>
          </div>
        </div>
      </WalletModalProvider>
    </DeskProvider>
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
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-sans text-xl font-semibold tracking-tight text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
