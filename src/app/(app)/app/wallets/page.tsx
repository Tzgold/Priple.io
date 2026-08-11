import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/app/AppChrome";
import { mockWallets } from "@/lib/mock/data";

export default function WalletsPage() {
  return (
    <div>
      <PageHeader
        title="Wallets"
        description="Track smart money entities and labeled desks."
        action={
          <Button size="sm" variant="primary">
            Add wallet
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Address</th>
              <th className="px-4 py-3 font-medium">Chain</th>
              <th className="px-4 py-3 font-medium">30d PnL</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Last move</th>
              <th className="px-4 py-3 font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {mockWallets.map((w) => (
              <tr key={w.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3.5 font-medium text-white">{w.label}</td>
                <td className="hidden px-4 py-3.5 font-mono text-xs text-zinc-500 sm:table-cell">
                  {w.address}
                </td>
                <td className="px-4 py-3.5 text-zinc-400">{w.chain}</td>
                <td
                  className={`px-4 py-3.5 ${
                    w.pnl30d.startsWith("+") ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {w.pnl30d}
                </td>
                <td className="hidden px-4 py-3.5 text-zinc-500 md:table-cell">
                  {w.lastMove}
                </td>
                <td className="px-4 py-3.5 text-white">{w.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-10 text-center">
        <p className="text-sm font-medium text-white">Add your first custom wallet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Paste an address or entity name. Wiring to indexers comes in the data
          phase — this panel is the UX shell.
        </p>
        <div className="mt-5">
          <Button size="sm">Add wallet</Button>
        </div>
      </div>
    </div>
  );
}
