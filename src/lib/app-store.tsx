"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PERSONAL_PULSE_THRESHOLD } from "@/lib/curated-wallets";
import {
  mockMoves,
  mockTokens,
  mockWallets,
  type AlertItem,
  type TrackedWallet,
} from "@/lib/mock/data";
import { watchedTokenId, type WatchedToken } from "@/lib/watched-tokens";

const PREFS_KEY = "priple-desk-prefs-v1";
const WATCH_TOKENS_KEY = "priple-watched-tokens-v1";

export type WalletSort = "score" | "pnl" | "name";
export type ScreenerFilter = "All" | "Trending" | "Whales buying" | "Social spike";
export type ChartPref = "dexscreener" | "priple";

type DeskPrefs = {
  sort: WalletSort;
  emailAlerts: boolean;
  defaultChart: ChartPref;
};

const defaultPrefs: DeskPrefs = {
  sort: "score",
  emailAlerts: true,
  defaultChart: "dexscreener",
};

type DeskContextValue = {
  wallets: TrackedWallet[];
  trackedWallets: TrackedWallet[];
  marketWallets: TrackedWallet[];
  personalMode: boolean;
  trackedCount: number;
  pulseThreshold: number;
  alerts: AlertItem[];
  savedAlerts: AlertItem[];
  tokens: typeof mockTokens;
  watchedTokens: WatchedToken[];
  moves: typeof mockMoves;
  sort: WalletSort;
  emailAlerts: boolean;
  defaultChart: ChartPref;
  /** API wallets/alerts/settings loaded. */
  ready: boolean;
  /**
   * localStorage prefs + watchlist have been read.
   * Until true, watchedTokens is always [] so SSR and the first client
   * render match (avoids hydration mismatches on the rail).
   */
  hydrated: boolean;
  addWallet: (input: { label: string; address: string; chain: string }) => Promise<void>;
  removeWallet: (id: string) => Promise<void>;
  setSort: (sort: WalletSort) => void;
  addAlert: (input: { title: string; detail: string; type: AlertItem["type"] }) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  setEmailAlerts: (value: boolean) => void;
  setDefaultChart: (value: ChartPref) => void;
  refreshAlerts: () => Promise<void>;
  isTokenWatched: (network: string, address: string) => boolean;
  toggleWatchToken: (token: Omit<WatchedToken, "id" | "addedAt">) => void;
};

const DeskContext = createContext<DeskContextValue | null>(null);

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<DeskPrefs>(defaultPrefs);
  const [savedWallets, setSavedWallets] = useState<TrackedWallet[]>([]);
  const [savedAlerts, setSavedAlerts] = useState<AlertItem[]>([]);
  const [watchedTokensState, setWatchedTokens] = useState<WatchedToken[]>([]);
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage once after mount. Never during render — that desyncs SSR HTML.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DeskPrefs>;
        setPrefs({
          ...defaultPrefs,
          ...parsed,
          defaultChart: parsed.defaultChart === "priple" ? "priple" : "dexscreener",
        });
      }
      const watchRaw = window.localStorage.getItem(WATCH_TOKENS_KEY);
      if (watchRaw) {
        const parsed = JSON.parse(watchRaw) as WatchedToken[];
        if (Array.isArray(parsed)) setWatchedTokens(parsed);
      }
    } catch {
      setPrefs(defaultPrefs);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist only after the initial read finished — otherwise ready=true with
  // empty watchedTokens would wipe the user's pins to [].
  useEffect(() => {
    if (!hydrated || !ready) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, ready, hydrated]);

  useEffect(() => {
    if (!hydrated || !ready) return;
    window.localStorage.setItem(WATCH_TOKENS_KEY, JSON.stringify(watchedTokensState));
  }, [watchedTokensState, ready, hydrated]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [walletsRes, alertsRes, settingsRes] = await Promise.all([
          fetch("/api/wallets", { credentials: "include" }),
          fetch("/api/alerts", { credentials: "include" }),
          fetch("/api/settings", { credentials: "include" }),
        ]);

        if (!cancelled && walletsRes.ok) {
          const data = (await walletsRes.json()) as { wallets: TrackedWallet[] };
          setSavedWallets(data.wallets ?? []);
        }

        if (!cancelled && alertsRes.ok) {
          const data = (await alertsRes.json()) as { alerts: AlertItem[] };
          setSavedAlerts(data.alerts ?? []);
        }

        if (!cancelled && settingsRes.ok) {
          const data = (await settingsRes.json()) as {
            settings?: { emailAlerts?: boolean; defaultChart?: ChartPref };
          };
          setPrefs((current) => ({
            ...current,
            emailAlerts: data.settings?.emailAlerts ?? current.emailAlerts,
            defaultChart: data.settings?.defaultChart === "priple" ? "priple" : "dexscreener",
          }));
        }
      } catch {
        // offline
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Stable empty list during SSR + first client paint so rail markup matches.
  const watchedTokens = hydrated ? watchedTokensState : [];
  const sortWallets = (list: TrackedWallet[]) =>
    [...list].sort((a, b) => {
      if (prefs.sort === "name") return a.label.localeCompare(b.label);
      if (prefs.sort === "pnl") return (parseFloat(b.pnl30d) || 0) - (parseFloat(a.pnl30d) || 0);
      return b.score - a.score;
    });

  const trackedWallets = useMemo(() => sortWallets(savedWallets), [savedWallets, prefs.sort]);
  const marketWallets = useMemo(() => sortWallets(mockWallets), [prefs.sort]);
  const personalMode = savedWallets.length >= PERSONAL_PULSE_THRESHOLD;

  const wallets = useMemo(() => {
    // Once the user tracks anything real, never mix in mock market desks.
    if (savedWallets.length > 0) return trackedWallets;
    return marketWallets;
  }, [trackedWallets, marketWallets, savedWallets.length]);

  const alerts = savedAlerts;

  const refreshAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { alerts: AlertItem[] };
      setSavedAlerts(data.alerts ?? []);
    } catch {
      // keep
    }
  }, []);

  const isTokenWatched = useCallback(
    (network: string, address: string) =>
      watchedTokensState.some((t) => t.id === watchedTokenId(network, address)),
    [watchedTokensState],
  );

  const toggleWatchToken = useCallback((token: Omit<WatchedToken, "id" | "addedAt">) => {
    const id = watchedTokenId(token.network, token.address);
    setWatchedTokens((current) => {
      if (current.some((t) => t.id === id)) return current.filter((t) => t.id !== id);
      return [
        { ...token, id, addedAt: Date.now() },
        ...current,
      ].slice(0, 40);
    });
  }, []);

  const value = useMemo<DeskContextValue>(
    () => ({
      wallets,
      trackedWallets,
      marketWallets,
      personalMode,
      trackedCount: savedWallets.length,
      pulseThreshold: PERSONAL_PULSE_THRESHOLD,
      alerts,
      savedAlerts,
      tokens: mockTokens,
      watchedTokens,
      moves: mockMoves,
      sort: prefs.sort,
      emailAlerts: prefs.emailAlerts,
      defaultChart: prefs.defaultChart,
      ready,
      hydrated,
      addWallet: async ({ label, address, chain }) => {
        const res = await fetch("/api/wallets", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, address, chain }),
        });
        const data = (await res.json()) as { wallet?: TrackedWallet; error?: string };
        if (!res.ok || !data.wallet) throw new Error(data.error ?? "Failed to add wallet");
        setSavedWallets((current) => [data.wallet!, ...current.filter((w) => w.id !== data.wallet!.id)]);
      },
      removeWallet: async (id) => {
        const isSaved = savedWallets.some((wallet) => wallet.id === id);
        if (!isSaved) return;
        const res = await fetch(`/api/wallets/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok && res.status !== 404) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to remove wallet");
        }
        setSavedWallets((current) => current.filter((wallet) => wallet.id !== id));
      },
      setSort: (sort) => setPrefs((current) => ({ ...current, sort })),
      addAlert: async ({ title, detail, type }) => {
        const res = await fetch("/api/alerts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, detail, type }),
        });
        const data = (await res.json()) as { alert?: AlertItem; error?: string };
        if (!res.ok || !data.alert) throw new Error(data.error ?? "Failed to create alert");
        setSavedAlerts((current) => [data.alert!, ...current]);
      },
      dismissAlert: async (id) => {
        const isSaved = savedAlerts.some((alert) => alert.id === id);
        if (!isSaved) return;
        const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok && res.status !== 404) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to dismiss alert");
        }
        setSavedAlerts((current) => current.filter((alert) => alert.id !== id));
      },
      setEmailAlerts: (emailAlerts) => setPrefs((current) => ({ ...current, emailAlerts })),
      setDefaultChart: (defaultChart) => setPrefs((current) => ({ ...current, defaultChart })),
      refreshAlerts,
      isTokenWatched,
      toggleWatchToken,
    }),
    [
      wallets,
      trackedWallets,
      marketWallets,
      personalMode,
      alerts,
      savedAlerts,
      watchedTokens,
      prefs.sort,
      prefs.emailAlerts,
      prefs.defaultChart,
      ready,
      hydrated,
      savedWallets,
      refreshAlerts,
      isTokenWatched,
      toggleWatchToken,
    ],
  );

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const value = useContext(DeskContext);
  if (!value) throw new Error("useDesk must be used inside DeskProvider");
  return value;
}
