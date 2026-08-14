import { randomUUID } from "crypto";
import type { PulseItem } from "@/lib/alchemy-pulse";
import { getPgPool } from "@/lib/db";
import type { DeskAlertType } from "@/lib/desk-db";

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

/** Persist notable pulse transfers as inbox alerts (idempotent via fingerprint). */
export async function syncAlertsFromPulse(userId: string, items: PulseItem[]) {
  const pool = getPgPool();
  let created = 0;

  for (const item of items) {
    if (item.source === "demo") continue;
    if (!item.hash && !item.id) continue;

    const usd = parseUsd(item.usd);
    // Only meaningful size — avoid noise from dust transfers
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
    ]
      .join(":")
      .slice(0, 220);

    const title = `${item.walletLabel} ${item.action.toLowerCase()} ${item.asset}`;
    const detail = `${item.amount} ${item.asset} (${item.usd}) · ${item.time} · from live pulse`;
    const alertType = alertTypeFor(item);
    const severity = severityFor(usd);

    try {
      const { rowCount } = await pool.query(
        `INSERT INTO public.alert_events
           (id, user_id, title, detail, severity, alert_type, dismissed, fingerprint)
         SELECT $1, $2, $3, $4, $5, $6, false, $7
         WHERE NOT EXISTS (
           SELECT 1 FROM public.alert_events
           WHERE user_id = $2 AND fingerprint = $7
         )`,
        [
          randomUUID(),
          userId,
          title.slice(0, 160),
          detail.slice(0, 800),
          severity,
          alertType,
          fingerprint,
        ],
      );
      if ((rowCount ?? 0) > 0) created += 1;
    } catch {
      // Skip transient write issues; pulse still returns.
    }
  }

  return created;
}
