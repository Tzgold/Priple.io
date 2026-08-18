import { randomUUID } from "crypto";
import type { PulseItem } from "@/lib/alchemy-pulse";
import { getPgPool } from "@/lib/db";
import {
  getUserEmail,
  getUserSettings,
  listAlertRules,
  listWallets,
  type AlertRuleRow,
  type DeskAlertType,
} from "@/lib/desk-db";
import { sendAlertEmail } from "@/lib/email";

function parseUsd(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "").toUpperCase();
  if (!cleaned || cleaned === "—") return 0;
  if (cleaned.endsWith("M")) return parseFloat(cleaned) * 1_000_000 || 0;
  if (cleaned.endsWith("K")) return parseFloat(cleaned) * 1_000 || 0;
  if (cleaned.endsWith("B")) return parseFloat(cleaned) * 1_000_000_000 || 0;
  return parseFloat(cleaned) || 0;
}

function alertTypeFor(item: PulseItem): DeskAlertType {
  if (item.type === "flow") return "flow";
  if (item.type === "buy" || item.type === "sell") return "signal";
  return "signal";
}

function severityFor(usd: number) {
  if (usd >= 1_000_000) return "critical";
  if (usd >= 100_000) return "warn";
  return "info";
}

async function insertAlertEvent(input: {
  userId: string;
  title: string;
  detail: string;
  severity: string;
  alertType: DeskAlertType;
  fingerprint: string;
  ruleId?: string | null;
}) {
  const pool = getPgPool();
  const { rowCount } = await pool.query(
    `INSERT INTO public.alert_events
       (id, user_id, rule_id, title, detail, severity, alert_type, dismissed, fingerprint)
     SELECT $1, $2, $3, $4, $5, $6, $7, false, $8
     WHERE NOT EXISTS (
       SELECT 1 FROM public.alert_events
       WHERE user_id = $2 AND fingerprint = $8
     )`,
    [
      randomUUID(),
      input.userId,
      input.ruleId ?? null,
      input.title.slice(0, 160),
      input.detail.slice(0, 800),
      input.severity,
      input.alertType,
      input.fingerprint.slice(0, 220),
    ],
  );
  return (rowCount ?? 0) > 0;
}

function ruleMatches(
  rule: AlertRuleRow,
  item: PulseItem,
  walletIdByAddress: Map<string, string>,
) {
  if (!rule.enabled) return false;

  const side = item.type === "buy" || item.type === "sell" ? item.type : null;
  if (rule.side !== "any") {
    if (!side || side !== rule.side) return false;
  }

  const usd = parseUsd(item.usd);
  if (usd > 0 && usd < rule.min_usd) return false;
  if (usd === 0 && rule.min_usd > 0) return false;

  if (rule.wallet_id) {
    const itemWalletId = walletIdByAddress.get((item.walletAddress || "").toLowerCase());
    if (!itemWalletId || itemWalletId !== rule.wallet_id) return false;
  }

  return true;
}

async function notifyAlertEmail(userId: string, title: string, detail: string) {
  try {
    const settings = await getUserSettings(userId);
    if (!settings.email_alerts) return;
    const email = await getUserEmail(userId);
    if (!email) return;
    await sendAlertEmail({ to: email, title, detail });
  } catch {
    // Email is best-effort — inbox still stored.
  }
}

function createMailBudget(max: number) {
  let sent = 0;
  return async (userId: string, title: string, detail: string) => {
    if (sent >= max) return;
    sent += 1;
    await notifyAlertEmail(userId, title, detail);
  };
}

/** Evaluate user rules against pulse items (wallet + side + min USD). */
export async function evaluateAlertRulesFromPulse(
  userId: string,
  items: PulseItem[],
  mail?: (userId: string, title: string, detail: string) => Promise<void>,
) {
  const [rules, wallets] = await Promise.all([listAlertRules(userId), listWallets(userId)]);
  if (rules.length === 0) return 0;

  const walletIdByAddress = new Map(
    wallets.map((wallet) => [wallet.address.trim().toLowerCase(), wallet.id]),
  );

  let created = 0;
  for (const item of items) {
    if (item.source !== "personal") continue;
    if (!item.hash && !item.id) continue;

    for (const rule of rules) {
      if (!ruleMatches(rule, item, walletIdByAddress)) continue;

      const usd = parseUsd(item.usd);
      const fingerprint = [
        "rule",
        rule.id,
        item.hash || item.id,
        item.walletAddress || item.walletLabel,
        item.action,
      ].join(":");

      try {
        const ok = await insertAlertEvent({
          userId,
          ruleId: rule.id,
          title: rule.title || `${item.walletLabel} ${item.action} ${item.asset}`,
          detail: `${item.walletLabel} · ${item.amount} ${item.asset} (${item.usd}) · rule ≥ $${Math.round(rule.min_usd).toLocaleString("en-US")} · ${item.time}`,
          severity: severityFor(usd),
          alertType: "signal",
          fingerprint,
        });
        if (ok) {
          created += 1;
          void (mail ?? notifyAlertEmail)(
            userId,
            rule.title || `${item.walletLabel} ${item.action} ${item.asset}`,
            `${item.walletLabel} · ${item.amount} ${item.asset} (${item.usd})`,
          );
        }
      } catch {
        // Skip transient write issues.
      }
    }
  }

  return created;
}

/** Persist notable pulse transfers as inbox alerts (idempotent via fingerprint). */
export async function syncAlertsFromPulse(userId: string, items: PulseItem[]) {
  let created = 0;
  const mail = createMailBudget(3);

  for (const item of items) {
    if (item.source !== "personal") continue;
    if (!item.hash && !item.id) continue;

    const usd = parseUsd(item.usd);
    // Default noise floor when no custom rules fire.
    if (usd > 0 && usd < 25_000) continue;
    if (usd === 0 && item.asset === "ETH") {
      const amount = parseFloat(item.amount.replace(/[kKmM,]/g, "")) || 0;
      if (amount < 5) continue;
    }

    const fingerprint = [
      "pulse",
      item.source,
      item.hash || item.id,
      item.walletAddress || item.walletLabel,
      item.action,
    ].join(":");

    const title = `${item.walletLabel} ${item.action.toLowerCase()} ${item.asset}`;
    const detail = `${item.amount} ${item.asset} (${item.usd}) · ${item.time} · from live pulse`;

    try {
      const ok = await insertAlertEvent({
        userId,
        title,
        detail,
        severity: severityFor(usd),
        alertType: alertTypeFor(item),
        fingerprint,
      });
      if (ok) {
        created += 1;
        void mail(userId, title, detail);
      }
    } catch {
      // Skip transient write issues; pulse still returns.
    }
  }

  try {
    created += await evaluateAlertRulesFromPulse(userId, items, mail);
  } catch {
    // Rules are best-effort on top of default pulse sync.
  }

  return created;
}
