"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  mockAlerts,
  mockMoves,
  mockTokens,
  mockWallets,
  type AlertItem,
  type TrackedWallet,
} from "@/lib/mock/data";

const STORAGE_KEY = "priple-desk-v1";

export type WalletSort = "score" | "pnl" | "name";
export type ScreenerFilter = "All" | "Trending" | "Whales buying" | "Social spike";

type DeskState = {
  extraWallets: TrackedWallet[];
  extraAlerts: AlertItem[];
  dismissedAlertIds: string[];
  sort: WalletSort;
  emailAlerts: boolean;
};

const defaults: DeskState = {
  extraWallets: [],
  extraAlerts: [],
  dismissedAlertIds: [],
  sort: "score",
  emailAlerts: true,
};

type DeskContextValue = {
  wallets: TrackedWallet[];
  alerts: AlertItem[];
  tokens: typeof mockTokens;
  moves: typeof mockMoves;
  sort: WalletSort;
  emailAlerts: boolean;
  addWallet: (input: { label: string; address: string; chain: string }) => void;
  removeWallet: (id: string) => void;
  setSort: (sort: WalletSort) => void;
  addAlert: (input: { title: string; detail: string; type: AlertItem["type"] }) => void;
  dismissAlert: (id: string) => void;
  setEmailAlerts: (value: boolean) => void;
};

const DeskContext = createContext<DeskContextValue | null>(null);

function shortAddress(address: string) {
  const value = address.trim();
  if (value.startsWith("0x") && value.length > 12) {
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }
  if (value.length > 12) return `${value.slice(0, 4)}…${value.slice(-4)}`;
  return value;
}

function chainAsset(chain: string) {
  if (chain === "SOL") return "SOL";
  if (chain === "BNB") return "BNB";
  if (chain === "ARB") return "ARB";
  return "ETH";
}

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DeskState>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DeskState>;
        setState({ ...defaults, ...parsed });
      }
    } catch {
      setState(defaults);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const wallets = useMemo(() => {
    const list = [...mockWallets, ...state.extraWallets];
    return [...list].sort((a, b) => {
      if (state.sort === "name") return a.label.localeCompare(b.label);
      if (state.sort === "pnl") return (parseFloat(b.pnl30d) || 0) - (parseFloat(a.pnl30d) || 0);
      return b.score - a.score;
    });
  }, [state.extraWallets, state.sort]);

  const alerts = useMemo(
    () =>
      [...state.extraAlerts, ...mockAlerts].filter(
        (alert) => !state.dismissedAlertIds.includes(alert.id),
      ),
    [state.extraAlerts, state.dismissedAlertIds],
  );

  const value = useMemo<DeskContextValue>(
    () => ({
      wallets,
      alerts,
      tokens: mockTokens,
      moves: mockMoves,
      sort: state.sort,
      emailAlerts: state.emailAlerts,
      addWallet: ({ label, address, chain }) => {
        const wallet: TrackedWallet = {
          id: `custom-${Date.now()}`,
          label: label.trim() || "Custom wallet",
          address: shortAddress(address),
          chain,
          pnl30d: "—",
          lastMove: "Just added",
          score: 50,
          asset: chainAsset(chain),
          usd: "—",
          custom: true,
        };
        setState((current) => ({
          ...current,
          extraWallets: [wallet, ...current.extraWallets],
        }));
      },
      removeWallet: (id) => {
        setState((current) => ({
          ...current,
          extraWallets: current.extraWallets.filter((wallet) => wallet.id !== id),
        }));
      },
      setSort: (sort) => setState((current) => ({ ...current, sort })),
      addAlert: ({ title, detail, type }) => {
        const alert: AlertItem = {
          id: `custom-alert-${Date.now()}`,
          title,
          detail,
          time: "now",
          type,
          status: "Live",
        };
        setState((current) => ({
          ...current,
          extraAlerts: [alert, ...current.extraAlerts],
        }));
      },
      dismissAlert: (id) => {
        setState((current) => ({
          ...current,
          dismissedAlertIds: [...current.dismissedAlertIds, id],
          extraAlerts: current.extraAlerts.filter((alert) => alert.id !== id),
        }));
      },
      setEmailAlerts: (emailAlerts) => setState((current) => ({ ...current, emailAlerts })),
    }),
    [wallets, alerts, state.sort, state.emailAlerts],
  );

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const value = useContext(DeskContext);
  if (!value) throw new Error("useDesk must be used inside DeskProvider");
  return value;
}
