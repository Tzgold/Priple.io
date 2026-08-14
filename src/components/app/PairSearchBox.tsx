"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TokenMark } from "@/components/app/TokenMark";
import { cn } from "@/lib/cn";

export type PairHit = {
  network: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  source: "dex" | "coingecko";
  pairLabel?: string | null;
};

export function PairSearchBox({
  onSelect,
  className,
  placeholder = "Search pair, ticker, or paste contract…",
}: {
  onSelect: (hit: PairHit) => void;
  className?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PairHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 1) {
      setHits([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/token?query=${encodeURIComponent(value)}`, {
            credentials: "include",
          });
          const data = (await res.json()) as {
            hits?: PairHit[];
            hit?: PairHit;
            error?: string;
          };
          if (id !== reqId.current) return;
          const next = data.hits?.length ? data.hits : data.hit ? [data.hit] : [];
          setHits(next);
          setActive(0);
          setOpen(true);
          if (!res.ok && next.length === 0) {
            setError(data.error || "No pairs found");
          }
        } catch {
          if (id === reqId.current) setError("Search failed");
        } finally {
          if (id === reqId.current) setLoading(false);
        }
      })();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  function choose(hit: PairHit) {
    onSelect(hit);
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <div className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3">
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!open || hits.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, hits.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              choose(hits[active] || hits[0]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent font-mono text-[12px] text-white outline-none placeholder:text-zinc-600"
        />
        {loading ? (
          <span className="font-mono text-[10px] text-zinc-500">…</span>
        ) : null}
      </div>

      {open && (hits.length > 0 || error || (query.trim() && !loading)) ? (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-2xl shadow-black/50">
          <div className="border-b border-white/[0.06] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            Pairs
          </div>
          {hits.length === 0 ? (
            <p className="px-3 py-4 font-mono text-[11px] text-zinc-500">
              {error || "No pairs found"}
            </p>
          ) : (
            <ul className="max-h-80 overflow-auto py-1">
              {hits.map((hit, index) => (
                <li key={`${hit.network}-${hit.address}-${hit.source}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(hit)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                      index === active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                    )}
                  >
                    <TokenMark symbol={hit.symbol} imageUrl={hit.imageUrl} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-white">{hit.symbol}</span>
                        <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-500">
                          {hit.network === "coingecko" ? "spot" : hit.network}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                        {hit.pairLabel || hit.name}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] uppercase text-zinc-600">
                      {hit.source === "coingecko" ? "TV" : "DEX"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
