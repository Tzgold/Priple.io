import { PageHeader } from "@/components/app/AppChrome";
import { mockTokens } from "@/lib/mock/data";

export default function ScreenerPage() {
  return (
    <div>
      <PageHeader
        title="Screener"
        description="Tokens ranked by Opportunity Score — mock feed for the shell."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "Trending", "Whales buying", "Social spike"].map((filter, i) => (
          <button
            key={filter}
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              i === 0
                ? "border-white/20 bg-white text-[#09090b]"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Volume</th>
              <th className="px-4 py-3 font-medium">Opp. Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {mockTokens.map((t) => (
              <tr key={t.symbol} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1d] text-[10px] font-semibold text-zinc-300">
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{t.symbol}</p>
                      <p className="text-xs text-zinc-500">{t.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-zinc-300">{t.price}</td>
                <td
                  className={`px-4 py-3.5 ${
                    t.positive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {t.change24h}
                </td>
                <td className="hidden px-4 py-3.5 text-zinc-500 sm:table-cell">
                  {t.volume}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${t.score}%` }}
                      />
                    </div>
                    <span className="text-white">{t.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
