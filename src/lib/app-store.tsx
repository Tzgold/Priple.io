"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PERSONAL_PULSE_THRESHOLD } from "@/lib/curated-wallets";
import {
  mockAlerts,
  mockMoves,
  mockTokens,
  mockWallets,
  type AlertItem,
  type TrackedWallet,
} from "@/lib/mock/data";

const PREFS_KEY = "priple-desk-prefs-v1";

export type WalletSort = "score" | "pnl" | "name";
export type ScreenerFilter = "All" | "Trending" | "Whales buying" | "Social spike";

type DeskPrefs = {
  sort: WalletSort;
  emailAlerts: boolean;
  dismissedMockAlertIds: string[];
};

const defaultPrefs: DeskPrefs = {
  sort: "score",
  emailAlerts: true,
  dismissedMockAlertIds: [],
};

type DeskContextValue = {
  wallets: TrackedWallet[];
  /** User-saved wallets only (not market demo desks). */
  trackedWallets: TrackedWallet[];
  marketWallets: TrackedWallet[];
  personalMode: boolean;
  trackedCount: number;
  pulseThreshold: number;
  alerts: AlertItem[];
  savedAlerts: AlertItem[];
  tokens: typeof mockTokens;
  moves: typeof mockMoves;
  sort: WalletSort;
  emailAlerts: boolean;
  ready: boolean;
  addWallet: (input: { label: string; address: string; chain: string }) => Promise<void>;
  removeWallet: (id: string) => Promise<void>;
  setSort: (sort: WalletSort) => void;
  addAlert: (input: { title: string; detail: string; type: AlertItem["type"] }) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  setEmailAlerts: (value: boolean) => void;
  refreshAlerts: () => Promise<void>;
};

const DeskContext = createContext<DeskContextValue | null>(null);

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<DeskPrefs>(defaultPrefs);
  const [savedWallets, setSavedWallets] = useState<TrackedWallet[]>([]);
  const [savedAlerts, setSavedAlerts] = useState<AlertItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DeskPrefs>;
        setPrefs({ ...defaultPrefs, ...parsed });
      }
    } catch {
      setPrefs(defaultPrefs);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, ready]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [walletsRes, alertsRes] = await Promise.all([
          fetch("/api/wallets", { credentials: "include" }),
          fetch("/api/alerts", { credentials: "include" }),
        ]);

        if (!cancelled && walletsRes.ok) {
          const data = (await walletsRes.json()) as { wallets: TrackedWallet[] };
          setSavedWallets(data.wallets ?? []);
        }

        if (!cancelled && alertsRes.ok) {
          const data = (await alertsRes.json()) as { alerts: AlertItem[] };
          setSavedAlerts(data.alerts ?? []);
        }
      } catch {
        // Keep mock desk usable offline; saved rows stay empty until next load.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (personalMode) return trackedWallets;
    return sortWallets([...savedWallets, ...mockWallets]);
  }, [personalMode, trackedWallets, savedWallets, prefs.sort]);

  const alerts = useMemo(
    () =>
      [...savedAlerts, ...mockAlerts].filter(
        (alert) => !prefs.dismissedMockAlertIds.includes(alert.id),
      ),
    [savedAlerts, prefs.dismissedMockAlertIds],
  );

  const refreshAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { alerts: AlertItem[] };
      setSavedAlerts(data.alerts ?? []);
    } catch {
      // Keep current inbox.
    }
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
      moves: mockMoves,
      sort: prefs.sort,
      emailAlerts: prefs.emailAlerts,
      ready,
      addWallet: async ({ label, address, chain }) => {
        const res = await fetch("/api/wallets", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, address, chain }),
        });
        const data = (await res.json()) as { wallet?: TrackedWallet; error?: string };
        if (!res.ok || !data.wallet) {
          throw new Error(data.error ?? "Failed to add wallet");
        }
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
        if (!res.ok || !data.alert) {
          throw new Error(data.error ?? "Failed to create alert");
        }
        setSavedAlerts((current) => [data.alert!, ...current]);
      },
      dismissAlert: async (id) => {
        const isSaved = savedAlerts.some((alert) => alert.id === id);
        if (isSaved) {
          const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok && res.status !== 404) {
            const data = (await res.json()) as { error?: string };
            throw new Error(data.error ?? "Failed to dismiss alert");
          }
          setSavedAlerts((current) => current.filter((alert) => alert.id !== id));
          return;
        }
        setPrefs((current) => ({
          ...current,
          dismissedMockAlertIds: [...current.dismissedMockAlertIds, id],
        }));
      },
      setEmailAlerts: (emailAlerts) => setPrefs((current) => ({ ...current, emailAlerts })),
      refreshAlerts,
    }),
    [
      wallets,
      trackedWallets,
      marketWallets,
      personalMode,
      alerts,
      savedAlerts,
      prefs.sort,
      prefs.emailAlerts,
      ready,
      savedWallets,
      refreshAlerts,
    ],
  );

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const value = useContext(DeskContext);
  if (!value) throw new Error("useDesk must be used inside DeskProvider");
  return value;
}
