"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/DashboardShell";
import { TokenMark } from "@/components/app/TokenMark";
import { useDesk, type ScreenerFilter } from "@/lib/app-store";
import { cn } from "@/lib/cn";

const filters: ScreenerFilter[] = ["All", "Trending", "Whales buying", "Social spike"];

function ScreenerBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tokens } = useDesk();
  const token = searchParams.get("token");
  const filter = (searchParams.get("filter") as ScreenerFilter) || "All";

  const rows = useMemo(() => {
    let list = tokens;
    if (token) list = list.filter((item) => item.symbol === token);
    if (filter === "Trending") list = list.filter((item) => item.score >= 75);
    if (filter === "Whales buying") list = list.filter((item) => item.positive && item.score >= 70);
    if (filter === "Social spike") list = list.filter((item) => ["SOL", "LINK", "XRP"].includes(item.symbol));
    return list;
  }, [tokens, token, filter]);

  function setFilter(next: ScreenerFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "All") params.delete("filter");
    else params.set("filter", next);
    router.push(`/app/screener?${params.toString()}`);
  }

  return (
    <div>
      <PageHeader
        title="Screener"
        description={token ? `Focused on ${token}.` : "Tokens ranked by Opportunity Score."}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors",
              filter === item
                ? "border-white/20 bg-white text-[#09090b]"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white",
            )}
          >
            {item}
          </button>
        ))}
        {token ? (
          <button
            type="button"
            onClick={() => router.push("/app/screener")}
            className="rounded-full border border-teal-400/30 px-3 py-1.5 font-mono text-[11px] text-teal-300"
          >
            Clear {token}
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-black/30">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Volume</th>
              <th className="px-4 py-3 font-medium">Opp. Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((item) => (
              <tr
                key={item.symbol}
                className={cn(
                  "cursor-pointer hover:bg-white/[0.02]",
                  token === item.symbol && "bg-white/[0.04]",
                )}
                onClick={() => router.push(`/app/screener?token=${item.symbol}`)}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <TokenMark symbol={item.symbol} size={28} />
                    <div>
                      <p className="font-medium text-white">{item.symbol}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{item.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-zinc-300">{item.price}</td>
                <td
                  className={`px-4 py-3.5 font-mono ${
                    item.positive ? "text-teal-400" : "text-rose-400"
                  }`}
                >
                  {item.change24h}
                </td>
                <td className="hidden px-4 py-3.5 font-mono text-zinc-500 sm:table-cell">
                  {item.volume}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="font-mono text-white">{item.score}</span>
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

export default function ScreenerPage() {
  return (
    <Suspense>
      <ScreenerBoard />
    </Suspense>
  );
}
