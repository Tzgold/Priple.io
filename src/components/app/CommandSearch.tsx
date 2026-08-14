"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useDesk } from "@/lib/app-store";

export function CommandSearch() {
  const router = useRouter();
  const { wallets, tokens } = useDesk();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const walletHits = wallets
      .filter(
        (wallet) =>
          wallet.label.toLowerCase().includes(q) || wallet.address.toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((wallet) => ({
        href: `/app/wallets?id=${wallet.id}`,
        title: wallet.label,
        hint: wallet.address,
      }));
    const tokenHits = tokens
      .filter(
        (token) =>
          token.symbol.toLowerCase().includes(q) || token.name.toLowerCase().includes(q),
      )
      .slice(0, 4)
      .map((token) => ({
        href: `/app/screener?token=${token.symbol}`,
        title: token.symbol,
        hint: token.name,
      }));
    return [...walletHits, ...tokenHits];
  }, [query, wallets, tokens]);

  return (
    <div className="relative hidden sm:block">
      <div className="flex h-10 w-[240px] items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3">
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search wallets, tokens…"
          className="w-full bg-transparent font-mono text-[11px] text-white outline-none placeholder:text-zinc-600"
        />
      </div>
      {open && results.length > 0 ? (
        <div className="absolute right-0 top-12 z-30 w-[280px] overflow-hidden rounded-xl border border-white/10 bg-[#111113] py-1">
          {results.map((result) => (
            <button
              key={result.href + result.title}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-white/[0.04]"
              onMouseDown={() => {
                router.push(result.href);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="text-[12px] text-white">{result.title}</span>
              <span className="font-mono text-[10px] text-zinc-500">{result.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
