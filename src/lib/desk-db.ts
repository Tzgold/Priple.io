import { randomUUID } from "crypto";
import { getPgPool } from "@/lib/db";

export const CHAINS = ["ETH", "SOL", "BNB", "ARB", "BASE"] as const;
export type DeskChain = (typeof CHAINS)[number];

export const ALERT_TYPES = ["signal", "flow", "social", "score"] as const;
export type DeskAlertType = (typeof ALERT_TYPES)[number];

export type WalletRow = {
  id: string;
  user_id: string;
  address: string;
  chain: string;
  label: string;
  notes: string;
  created_at: Date;
  updated_at: Date;
};

export type AlertEventRow = {
  id: string;
  user_id: string;
  rule_id: string | null;
  title: string;
  detail: string;
  severity: string;
  alert_type: string;
  dismissed: boolean;
  created_at: Date;
};

function isChain(value: string): value is DeskChain {
  return (CHAINS as readonly string[]).includes(value);
}

function isAlertType(value: string): value is DeskAlertType {
  return (ALERT_TYPES as readonly string[]).includes(value);
}

export function normalizeAddress(address: string) {
  return address.trim();
}

export function shortAddress(address: string) {
  const value = address.trim();
  if (value.startsWith("0x") && value.length > 12) {
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }
  if (value.length > 12) return `${value.slice(0, 4)}…${value.slice(-4)}`;
  return value;
}

export async function listWallets(userId: string) {
  const { rows } = await getPgPool().query<WalletRow>(
    `SELECT id, user_id, address, chain, label, notes, created_at, updated_at
     FROM public.tracked_wallets
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function createWallet(
  userId: string,
  input: { address: string; chain: string; label?: string; notes?: string },
) {
  const address = normalizeAddress(input.address);
  const chain = input.chain.trim().toUpperCase();
  const label = (input.label ?? "").trim().slice(0, 80) || "Custom wallet";
  const notes = (input.notes ?? "").trim().slice(0, 500);

  if (!isChain(chain)) {
    throw new Error("Invalid chain");
  }
  if (address.length < 8 || address.length > 128) {
    throw new Error("Invalid address length");
  }

  const id = randomUUID();
  try {
    const { rows } = await getPgPool().query<WalletRow>(
      `INSERT INTO public.tracked_wallets (id, user_id, address, chain, label, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, address, chain, label, notes, created_at, updated_at`,
      [id, userId, address, chain, label, notes],
    );
    return rows[0];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      throw new Error("Wallet already tracked on this chain");
    }
    throw error;
  }
}

export async function getWallet(userId: string, walletId: string) {
  const { rows } = await getPgPool().query<WalletRow>(
    `SELECT id, user_id, address, chain, label, notes, created_at, updated_at
     FROM public.tracked_wallets
     WHERE user_id = $1 AND id = $2
     LIMIT 1`,
    [userId, walletId],
  );
  return rows[0] ?? null;
}

export async function deleteWallet(userId: string, walletId: string) {
  const { rowCount } = await getPgPool().query(
    `DELETE FROM public.tracked_wallets WHERE id = $1 AND user_id = $2`,
    [walletId, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function listAlertEvents(userId: string) {
  const { rows } = await getPgPool().query<AlertEventRow>(
    `SELECT id, user_id, rule_id, title, detail, severity, alert_type, dismissed, created_at
     FROM public.alert_events
     WHERE user_id = $1 AND dismissed = false
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId],
  );
  return rows;
}

export async function createAlertEvent(
  userId: string,
  input: { title: string; detail?: string; alertType: string },
) {
  const title = input.title.trim().slice(0, 160);
  const detail = (input.detail ?? "").trim().slice(0, 800);
  const alertType = input.alertType.trim();

  if (!title) throw new Error("Title is required");
  if (!isAlertType(alertType)) throw new Error("Invalid alert type");

  const id = randomUUID();
  const { rows } = await getPgPool().query<AlertEventRow>(
    `INSERT INTO public.alert_events (id, user_id, title, detail, severity, alert_type, dismissed)
     VALUES ($1, $2, $3, $4, 'info', $5, false)
     RETURNING id, user_id, rule_id, title, detail, severity, alert_type, dismissed, created_at`,
    [id, userId, title, detail, alertType],
  );
  return rows[0];
}

export async function dismissAlertEvent(userId: string, alertId: string) {
  const { rowCount } = await getPgPool().query(
    `UPDATE public.alert_events
     SET dismissed = true
     WHERE id = $1 AND user_id = $2 AND dismissed = false`,
    [alertId, userId],
  );
  return (rowCount ?? 0) > 0;
}

export function chainAsset(chain: string) {
  if (chain === "SOL") return "SOL";
  if (chain === "BNB") return "BNB";
  if (chain === "ARB") return "ARB";
  if (chain === "BASE") return "ETH";
  return "ETH";
}

export function relativeTime(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
