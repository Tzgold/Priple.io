"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/DashboardShell";
import { TokenMark } from "@/components/app/TokenMark";
import { CopyButton } from "@/components/app/CopyButton";
import { useAddWallet } from "@/components/app/WalletModalProvider";
import { useDesk } from "@/lib/app-store";
import { cn } from "@/lib/cn";

function WalletsBoard() {
  const searchParams = useSearchParams();
  const focused = searchParams.get("id");
  const { wallets, removeWallet } = useDesk();
  const { openAddWallet } = useAddWallet();

  return (
    <div>
      <PageHeader
        title="Smart money"
        description="Desks and labeled wallets Priple is watching."
        action={
          <Button size="sm" onClick={openAddWallet}>
            Add wallet
          </Button>
        }
      />

      <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-black/30">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Address</th>
              <th className="px-4 py-3 font-medium">Chain</th>
              <th className="px-4 py-3 font-medium">30d PnL</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Last move</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {wallets.map((wallet) => (
              <tr
                key={wallet.id}
                id={wallet.id}
                className={cn(
                  "hover:bg-white/[0.02]",
                  focused === wallet.id && "bg-white/[0.04]",
                )}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <TokenMark symbol={wallet.asset} size={28} />
                    <span className="font-medium text-white">{wallet.label}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3.5 sm:table-cell">
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-500">
                    {wallet.address}
                    <CopyButton value={wallet.address} />
                  </span>
                </td>
                <td className="px-4 py-3.5 text-zinc-400">{wallet.chain}</td>
                <td
                  className={`px-4 py-3.5 font-mono ${
                    wallet.pnl30d.startsWith("+")
                      ? "text-teal-400"
                      : wallet.pnl30d.startsWith("-")
                        ? "text-rose-400"
                        : "text-zinc-400"
                  }`}
                >
                  {wallet.pnl30d}
                </td>
                <td className="hidden px-4 py-3.5 text-zinc-500 md:table-cell">
                  {wallet.lastMove}
                </td>
                <td className="px-4 py-3.5 font-mono text-white">{wallet.score}</td>
                <td className="px-4 py-3.5">
                  {wallet.custom ? (
                    <button
                      type="button"
                      onClick={() => removeWallet(wallet.id)}
                      className="text-zinc-600 hover:text-rose-400"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  return (
    <Suspense>
      <WalletsBoard />
    </Suspense>
  );
}
