import { randomUUID } from "crypto";
import { getPgPool } from "@/lib/db";
import {
  DESK_CHAINS,
  chainAssetSymbol,
  isDeskChain,
  type DeskChain,
} from "@/lib/alchemy-networks";
import { validateWalletAddress } from "@/lib/wallet-address";

export const CHAINS = DESK_CHAINS;
export type { DeskChain };

export const ALERT_TYPES = ["signal", "flow", "social", "score"] as const;
export type DeskAlertType = (typeof ALERT_TYPES)[number];

export const ALERT_SIDES = ["buy", "sell", "any"] as const;
export type AlertSide = (typeof ALERT_SIDES)[number];

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

export type AlertRuleRow = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  title: string;
  side: string;
  min_usd: number;
  enabled: boolean;
  created_at: Date;
};

function isChain(value: string): value is DeskChain {
  return isDeskChain(value);
}

function isAlertType(value: string): value is DeskAlertType {
  return (ALERT_TYPES as readonly string[]).includes(value);
}

function isAlertSide(value: string): value is AlertSide {
  return (ALERT_SIDES as readonly string[]).includes(value);
}

let alertRulesReady = false;

async function ensureAlertRulesTable() {
  if (alertRulesReady) return;
  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS public.alert_rules (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      wallet_id text NULL,
      title text NOT NULL,
      side text NOT NULL DEFAULT 'any',
      min_usd double precision NOT NULL DEFAULT 25000,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await getPgPool().query(`
    CREATE INDEX IF NOT EXISTS alert_rules_user_idx
    ON public.alert_rules (user_id)
  `);
  alertRulesReady = true;
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
  const addressError = validateWalletAddress(chain, address);
  if (addressError) {
    throw new Error(addressError);
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
  input: { title: string; detail?: string; alertType: string; ruleId?: string | null },
) {
  const title = input.title.trim().slice(0, 160);
  const detail = (input.detail ?? "").trim().slice(0, 800);
  const alertType = input.alertType.trim();

  if (!title) throw new Error("Title is required");
  if (!isAlertType(alertType)) throw new Error("Invalid alert type");

  const id = randomUUID();
  const { rows } = await getPgPool().query<AlertEventRow>(
    `INSERT INTO public.alert_events (id, user_id, rule_id, title, detail, severity, alert_type, dismissed)
     VALUES ($1, $2, $3, $4, $5, 'info', $6, false)
     RETURNING id, user_id, rule_id, title, detail, severity, alert_type, dismissed, created_at`,
    [id, userId, input.ruleId ?? null, title, detail, alertType],
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

export async function listAlertRules(userId: string) {
  await ensureAlertRulesTable();
  const { rows } = await getPgPool().query<AlertRuleRow>(
    `SELECT id, user_id, wallet_id, title, side, min_usd, enabled, created_at
     FROM public.alert_rules
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId],
  );
  return rows;
}

export async function createAlertRule(
  userId: string,
  input: {
    title: string;
    walletId?: string | null;
    side?: string;
    minUsd?: number;
  },
) {
  await ensureAlertRulesTable();

  const title = input.title.trim().slice(0, 120) || "Wallet size alert";
  const side = (input.side || "any").trim().toLowerCase();
  const minUsd = Number(input.minUsd ?? 25_000);
  const walletId = input.walletId?.trim() || null;

  if (!isAlertSide(side)) throw new Error("Invalid side (buy, sell, or any)");
  if (!Number.isFinite(minUsd) || minUsd < 0) throw new Error("minUsd must be >= 0");
  if (minUsd > 50_000_000) throw new Error("minUsd too large");

  if (walletId) {
    const wallet = await getWallet(userId, walletId);
    if (!wallet) throw new Error("Wallet not found");
  }

  const existing = await listAlertRules(userId);
  if (existing.length >= 20) throw new Error("Alert rule limit reached (20)");

  const id = randomUUID();
  const { rows } = await getPgPool().query<AlertRuleRow>(
    `INSERT INTO public.alert_rules (id, user_id, wallet_id, title, side, min_usd, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, user_id, wallet_id, title, side, min_usd, enabled, created_at`,
    [id, userId, walletId, title, side, minUsd],
  );
  return rows[0];
}

export async function deleteAlertRule(userId: string, ruleId: string) {
  await ensureAlertRulesTable();
  const { rowCount } = await getPgPool().query(
    `DELETE FROM public.alert_rules WHERE id = $1 AND user_id = $2`,
    [ruleId, userId],
  );
  return (rowCount ?? 0) > 0;
}

export function chainAsset(chain: string) {
  return chainAssetSymbol(chain);
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
