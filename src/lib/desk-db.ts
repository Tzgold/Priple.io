import { randomUUID } from "crypto";
import { getPgPool, lockPublicTable } from "@/lib/db";
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
  await lockPublicTable("alert_rules");
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

export const CHART_PREFS = ["dexscreener", "priple"] as const;
export type ChartPref = (typeof CHART_PREFS)[number];

export type UserSettingsRow = {
  user_id: string;
  email_alerts: boolean;
  telegram_handle: string | null;
  default_chart: ChartPref;
  updated_at: Date;
};

let userSettingsReady = false;

async function ensureUserSettingsTable() {
  if (userSettingsReady) return;
  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS public.user_settings (
      user_id text PRIMARY KEY,
      email_alerts boolean NOT NULL DEFAULT true,
      telegram_handle text NULL,
      default_chart text NOT NULL DEFAULT 'dexscreener',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await lockPublicTable("user_settings");
  userSettingsReady = true;
}

function isChartPref(value: string): value is ChartPref {
  return (CHART_PREFS as readonly string[]).includes(value);
}

export async function getUserSettings(userId: string): Promise<UserSettingsRow> {
  await ensureUserSettingsTable();
  const { rows } = await getPgPool().query<UserSettingsRow>(
    `SELECT user_id, email_alerts, telegram_handle, default_chart, updated_at
     FROM public.user_settings
     WHERE user_id = $1`,
    [userId],
  );
  const row = rows[0];
  if (row) {
    return {
      ...row,
      default_chart: isChartPref(row.default_chart) ? row.default_chart : "dexscreener",
    };
  }
  return {
    user_id: userId,
    email_alerts: true,
    telegram_handle: null,
    default_chart: "dexscreener",
    updated_at: new Date(),
  };
}

export async function upsertUserSettings(
  userId: string,
  input: {
    emailAlerts?: boolean;
    telegramHandle?: string | null;
    defaultChart?: ChartPref;
  },
): Promise<UserSettingsRow> {
  await ensureUserSettingsTable();
  const current = await getUserSettings(userId);
  const emailAlerts = input.emailAlerts ?? current.email_alerts;
  const telegramHandle =
    input.telegramHandle === undefined ? current.telegram_handle : input.telegramHandle;
  const defaultChart = input.defaultChart ?? current.default_chart;
  const rawHandle =
    typeof telegramHandle === "string" ? telegramHandle.replace(/^@/, "").trim().slice(0, 32) : null;
  const handle = rawHandle && /^[A-Za-z0-9_]{3,32}$/.test(rawHandle) ? rawHandle : null;

  const { rows } = await getPgPool().query<UserSettingsRow>(
    `INSERT INTO public.user_settings (user_id, email_alerts, telegram_handle, default_chart, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id) DO UPDATE SET
       email_alerts = EXCLUDED.email_alerts,
       telegram_handle = EXCLUDED.telegram_handle,
       default_chart = EXCLUDED.default_chart,
       updated_at = now()
     RETURNING user_id, email_alerts, telegram_handle, default_chart, updated_at`,
    [userId, emailAlerts, handle, defaultChart],
  );
  const row = rows[0] ?? current;
  return {
    ...row,
    default_chart: isChartPref(row.default_chart) ? row.default_chart : "dexscreener",
  };
}

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { rows } = await getPgPool().query<{ email: string }>(
      `SELECT email FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );
    return rows[0]?.email || null;
  } catch {
    return null;
  }
}
