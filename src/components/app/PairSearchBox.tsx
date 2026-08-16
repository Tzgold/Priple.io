"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Search, Star, X } from "lucide-react";
import { TokenMark } from "@/components/app/TokenMark";
import { useDesk } from "@/lib/app-store";
import { cn } from "@/lib/cn";
import { MAJOR_TOKEN_ROUTES, SYMBOL_TO_CG, TV_SYMBOL_BY_CG } from "@/lib/token-routes";

export type PairHit = {
  network: string;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  source: "dex" | "coingecko" | "major";
  pairLabel?: string | null;
  quoteSymbol?: string | null;
  dexId?: string | null;
  exchangeLabel?: string | null;
  priceUsd?: number | null;
  volume24hUsd?: number | null;
  liquidityUsd?: number | null;
  priceChange24h?: number | null;
  kind?: "spot" | "pair" | "major";
};

type FilterTab = "all" | "majors" | "dex";

const RECENTS_KEY = "priple-search-recents-v1";

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toPrecision(3)}`;
}

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-sky-400">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

function majorSuggestions(): PairHit[] {
  const hits: PairHit[] = [];
  for (const [symbol, cgId] of Object.entries(SYMBOL_TO_CG)) {
    const route = MAJOR_TOKEN_ROUTES[cgId];
    if (!route) continue;
    const tv = TV_SYMBOL_BY_CG[cgId];
    if ("cg" in route) {
      hits.push({
        network: "coingecko",
        address: route.cg,
        name: symbol,
        symbol,
        imageUrl: null,
        source: "major",
        pairLabel: `${symbol} / USD`,
        exchangeLabel: tv ? "TV" : "Major",
        kind: "major",
      });
    } else {
      hits.push({
        network: route.network,
        address: route.address,
        name: symbol,
        symbol,
        imageUrl: null,
        source: "major",
        pairLabel: `${symbol} / ${route.network.toUpperCase()}`,
        exchangeLabel: tv ? "TV" : route.network.toUpperCase(),
        kind: "major",
      });
    }
  }
  return hits;
}

function readRecents(): PairHit[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PairHit[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function pushRecent(hit: PairHit) {
  try {
    const prev = readRecents().filter(
      (row) => !(row.network === hit.network && row.address.toLowerCase() === hit.address.toLowerCase()),
    );
    const next = [hit, ...prev].slice(0, 8);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function PairSearchBox({
  onSelect,
  className,
  placeholder = "Search symbol, pair, or paste contract…",
}: {
  onSelect: (hit: PairHit) => void;
  className?: string;
  placeholder?: string;
}) {
  const { watchedTokens } = useDesk();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PairHit[]>([]);
  const [recents, setRecents] = useState<PairHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<FilterTab>("all");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reqId = useRef(0);

  const emptySuggestions = useMemo(() => {
    const watchHits: PairHit[] = watchedTokens.slice(0, 8).map((t) => ({
      network: t.network,
      address: t.address,
      name: t.name,
      symbol: t.symbol,
      imageUrl: t.imageUrl,
      source: t.network === "coingecko" ? "coingecko" : "dex",
      pairLabel: `${t.symbol} · watchlist`,
      exchangeLabel: "★",
      kind: t.network === "coingecko" ? "spot" : "pair",
    }));
    return {
      recents,
      watchlist: watchHits,
      majors: majorSuggestions(),
    };
  }, [watchedTokens, recents]);

  const browseRows = useMemo(() => {
    const rows: Array<{ section: string; hit: PairHit }> = [];
    for (const hit of emptySuggestions.recents) rows.push({ section: "Recent", hit });
    for (const hit of emptySuggestions.watchlist) rows.push({ section: "Watchlist", hit });
    for (const hit of emptySuggestions.majors) rows.push({ section: "Majors", hit });
    return rows;
  }, [emptySuggestions]);

  const filtered = useMemo(() => {
    if (tab === "majors") {
      return hits.filter(
        (h) => h.source === "major" || h.source === "coingecko" || h.kind === "major" || h.kind === "spot",
      );
    }
    if (tab === "dex") {
      return hits.filter((h) => h.source === "dex" || h.kind === "pair");
    }
    return hits;
  }, [hits, tab]);

  const listRows = query.trim()
    ? filtered.map((hit) => ({ section: null as string | null, hit }))
    : browseRows;

  useEffect(() => {
    setRecents(readRecents());
  }, []);

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
            setError(data.error || "No matches");
          }
        } catch {
          if (id === reqId.current) setError("Search failed — try again");
        } finally {
          if (id === reqId.current) setLoading(false);
        }
      })();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [tab, listRows.length, query]);

  function choose(hit: PairHit) {
    pushRecent(hit);
    setRecents(readRecents());
    onSelect(hit);
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  const showPanel = open;

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <div className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-[#0c0c0e] px-3.5 shadow-inner shadow-black/40 focus-within:border-white/20">
        <Search className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (!showPanel || listRows.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, listRows.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const row = listRows[active] || listRows[0];
              if (row) choose(row.hit);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-zinc-600"
          autoComplete="off"
          spellCheck={false}
        />
        {loading ? <span className="font-mono text-[10px] text-zinc-500">…</span> : null}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setHits([]);
              inputRef.current?.focus();
            }}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-[3.35rem] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <p className="text-[13px] font-medium text-zinc-200">Symbol search</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-white"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {query.trim() ? (
            <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
              {(
                [
                  ["all", "All"],
                  ["majors", "Majors / Spot"],
                  ["dex", "DEX pairs"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 font-mono text-[11px] transition-colors",
                    tab === key
                      ? "bg-white text-[#09090b]"
                      : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          {listRows.length === 0 ? (
            <p className="px-4 py-8 text-center font-mono text-[12px] text-zinc-500">
              {loading
                ? "Searching markets…"
                : error || "No matches — try ticker, name, or contract"}
            </p>
          ) : (
            <ul className="max-h-[min(28rem,55vh)] overflow-auto py-1">
              {listRows.map((row, index) => {
                const hit = row.hit;
                const prevSection = index > 0 ? listRows[index - 1]?.section : null;
                const showSection = Boolean(row.section && row.section !== prevSection);
                const change = hit.priceChange24h;
                const badge =
                  hit.kind === "major" || hit.source === "major"
                    ? "MAJOR"
                    : hit.kind === "spot" || hit.source === "coingecko"
                      ? "SPOT"
                      : (hit.network || "DEX").toUpperCase();

                return (
                  <li key={`${row.section || "q"}-${hit.network}-${hit.address}-${hit.symbol}`}>
                    {showSection ? (
                      <div className="flex items-center gap-1.5 px-4 pb-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                        {row.section === "Recent" ? <Clock className="h-3 w-3" /> : null}
                        {row.section === "Watchlist" ? <Star className="h-3 w-3" /> : null}
                        {row.section}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(hit)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        index === active ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
                      )}
                    >
                      <TokenMark symbol={hit.symbol} imageUrl={hit.imageUrl} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-sky-400">
                            {highlightMatch(hit.symbol, query)}
                          </span>
                          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-zinc-400">
                            {badge}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-zinc-400">
                          {highlightMatch(hit.pairLabel || hit.name, query)}
                        </span>
                      </span>
                      <span className="hidden min-w-[4.5rem] text-right sm:block">
                        {hit.priceUsd != null ? (
                          <span className="block font-mono text-[12px] text-zinc-200">
                            {money(hit.priceUsd)}
                          </span>
                        ) : null}
                        {change != null ? (
                          <span
                            className={cn(
                              "block font-mono text-[10px]",
                              change > 0
                                ? "text-teal-400"
                                : change < 0
                                  ? "text-rose-400"
                                  : "text-zinc-500",
                            )}
                          >
                            {change > 0 ? "+" : ""}
                            {change.toFixed(2)}%
                          </span>
                        ) : hit.liquidityUsd != null ? (
                          <span className="block font-mono text-[10px] text-zinc-500">
                            Liq {money(hit.liquidityUsd)}
                          </span>
                        ) : null}
                      </span>
                      <span className="w-16 shrink-0 text-right font-mono text-[10px] uppercase text-zinc-500">
                        {hit.exchangeLabel ||
                          (hit.source === "coingecko" || hit.source === "major" ? "TV" : "DEX")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="border-t border-white/[0.06] px-4 py-2 text-center font-mono text-[10px] text-zinc-600">
            {query.trim()
              ? "Tip: paste a contract for exact chain match · ↑↓ Enter to open"
              : "Before you type: recents, watchlist, and majors — then search any pair"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
