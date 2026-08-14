"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/DashboardShell";
import { PairSearchBox, type PairHit } from "@/components/app/PairSearchBox";
import { TokenDeskView } from "@/components/app/TokenDeskView";
import { TokenMark } from "@/components/app/TokenMark";
import type { BoardToken } from "@/lib/token-routes";
import { cn } from "@/lib/cn";

type BoardFilter = "All" | "Majors" | "Trending" | "Memes";

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (Math.abs(value) >= 1) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(3)}`;
}

function ScreenerBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const network = searchParams.get("network");
  const address = searchParams.get("address");
  const filter = (searchParams.get("filter") as BoardFilter) || "All";

  const [board, setBoard] = useState<BoardToken[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boardQuery, setBoardQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/screener", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { board?: BoardToken[]; live: boolean };
        if (cancelled) return;
        const rows = data.board ?? [];
        setBoard(rows);
        setLive(Boolean(data.live));

        if (!searchParams.get("network") && !searchParams.get("address") && rows[0]) {
          const first = rows.find((row) => row.kind === "trending") || rows[0];
          router.replace(
            `/app/screener?network=${encodeURIComponent(first.network)}&address=${encodeURIComponent(first.address)}`,
          );
        }
      } catch {
        // keep empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected =
    network && address
      ? board.find(
          (row) =>
            row.network === network && row.address.toLowerCase() === address.toLowerCase(),
        ) || null
      : null;

  const rows = useMemo(() => {
    let list = board;
    if (filter === "Majors") list = list.filter((row) => row.kind === "major");
    if (filter === "Trending") list = list.filter((row) => row.kind === "trending");
    if (filter === "Memes") {
      list = list.filter(
        (row) =>
          row.kind === "trending" &&
          (row.marketCapUsd == null || row.marketCapUsd < 500_000_000),
      );
    }
    const q = boardQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (row) =>
          row.symbol.toLowerCase().includes(q) ||
          row.name.toLowerCase().includes(q) ||
          row.address.toLowerCase().includes(q),
      );
    }
    return list;
  }, [board, filter, boardQuery]);

  function selectRow(row: BoardToken) {
    router.push(
      `/app/screener?network=${encodeURIComponent(row.network)}&address=${encodeURIComponent(row.address)}${
        filter !== "All" ? `&filter=${encodeURIComponent(filter)}` : ""
      }`,
    );
  }

  function setFilter(next: BoardFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "All") params.delete("filter");
    else params.set("filter", next);
    router.push(`/app/screener?${params.toString()}`);
  }

  function openPair(hit: PairHit) {
    router.push(
      `/app/screener?network=${encodeURIComponent(hit.network)}&address=${encodeURIComponent(hit.address)}`,
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Screener"
        description="Full token desk first — majors and tiny memecoins under it. Paste any contract a tracked wallet buys."
      />

      <PairSearchBox onSelect={openPair} />

      {network && address ? (
        <TokenDeskView network={network} address={address} compact />
      ) : (
        <p className="rounded-[20px] border border-white/[0.08] bg-black/30 px-4 py-10 text-center font-mono text-[12px] text-zinc-600">
          {loading ? "Loading board…" : "Select a coin below to open the desk."}
        </p>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-sans text-[15px] font-semibold text-white">Board</h3>
            <p className="mt-1 font-mono text-[11px] text-zinc-500">
              Majors + trending memecoins across ETH / Solana / Base
              {selected ? ` · viewing ${selected.symbol}` : ""}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-zinc-300">
            <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-teal-400" : "bg-zinc-500")} />
            {live ? "Live markets" : "Syncing"}
          </span>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["All", "Majors", "Trending", "Memes"] as BoardFilter[]).map((item) => (
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
          </div>
          <input
            value={boardQuery}
            onChange={(event) => setBoardQuery(event.target.value)}
            placeholder="Filter board…"
            className="h-9 w-full rounded-full border border-white/10 bg-black/40 px-3 font-mono text-[11px] text-white outline-none placeholder:text-zinc-600 sm:w-48"
          />
        </div>

        <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-black/30">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Token</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">24h</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">MCap</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Liq</th>
                <th className="px-4 py-3 font-medium">Vol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((row) => {
                const active =
                  network === row.network &&
                  address?.toLowerCase() === row.address.toLowerCase();
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer hover:bg-white/[0.02]",
                      active && "bg-white/[0.04]",
                    )}
                    onClick={() => selectRow(row)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <TokenMark symbol={row.symbol} imageUrl={row.imageUrl} size={28} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{row.symbol}</p>
                            <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-500">
                              {row.network === "coingecko" ? "cg" : row.network}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-zinc-500">{row.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-300">{money(row.priceUsd)}</td>
                    <td
                      className={cn(
                        "px-4 py-3.5 font-mono",
                        (row.change24h ?? 0) >= 0 ? "text-teal-400" : "text-rose-400",
                      )}
                    >
                      {row.change24h == null
                        ? "—"
                        : `${row.change24h > 0 ? "+" : ""}${row.change24h.toFixed(1)}%`}
                    </td>
                    <td className="hidden px-4 py-3.5 font-mono text-zinc-500 sm:table-cell">
                      {money(row.marketCapUsd ?? row.fdvUsd)}
                    </td>
                    <td className="hidden px-4 py-3.5 font-mono text-zinc-500 md:table-cell">
                      {money(row.liquidityUsd)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-zinc-400">{money(row.volume24hUsd)}</td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-mono text-[12px] text-zinc-600">
                    No tokens match those filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
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
