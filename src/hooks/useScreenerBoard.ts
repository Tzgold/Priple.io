"use client";

import { useEffect, useMemo, useState } from "react";
import { useDesk } from "@/lib/app-store";
import type { PulseItem } from "@/lib/alchemy-pulse";
import { buildScreenerLists } from "@/lib/screener-lists";
import type { BoardToken } from "@/lib/token-routes";

export function useScreenerBoard(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { watchedTokens } = useDesk();
  const [board, setBoard] = useState<BoardToken[]>([]);
  const [pulseBuys, setPulseBuys] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [screenerRes, pulseRes] = await Promise.all([
          fetch("/api/screener", { credentials: "include" }),
          fetch("/api/pulse", { credentials: "include" }),
        ]);

        if (cancelled) return;

        if (screenerRes.ok) {
          const data = (await screenerRes.json()) as { board?: BoardToken[] };
          setBoard(data.board ?? []);
        }

        if (pulseRes.ok) {
          const data = (await pulseRes.json()) as { items?: PulseItem[] };
          setPulseBuys(
            (data.items ?? []).filter((item) => item.type === "buy" && item.source !== "demo"),
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
  }, [enabled]);

  const lists = useMemo(
    () => buildScreenerLists(board, pulseBuys, watchedTokens),
    [board, pulseBuys, watchedTokens],
  );

  return { board, pulseBuys, loading, ...lists };
}
