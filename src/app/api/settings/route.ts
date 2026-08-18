import { NextResponse } from "next/server";
import {
  CHART_PREFS,
  getUserSettings,
  upsertUserSettings,
  type ChartPref,
} from "@/lib/desk-db";
import { limitUserRoute, rateLimitJson } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";

function clip(value: string | null | undefined, max: number) {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "desk:settings", 30);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const settings = await getUserSettings(session.user.id);
  return NextResponse.json({
    settings: {
      emailAlerts: settings.email_alerts,
      telegramHandle: settings.telegram_handle,
      defaultChart: settings.default_chart,
    },
    profile: {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      emailVerified: Boolean(session.user.emailVerified),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitUserRoute(session.user.id, "desk:settings", 30);
  if (!limited.ok) {
    return rateLimitJson(limited.retryAfterSec);
  }

  const body = (await request.json().catch(() => null)) as {
    emailAlerts?: boolean;
    telegramHandle?: string | null;
    defaultChart?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const defaultChart =
    typeof body.defaultChart === "string" && (CHART_PREFS as readonly string[]).includes(body.defaultChart)
      ? (body.defaultChart as ChartPref)
      : undefined;

  const telegramHandle =
    body.telegramHandle === undefined ? undefined : clip(body.telegramHandle, 32) ?? null;

  const settings = await upsertUserSettings(session.user.id, {
    emailAlerts: typeof body.emailAlerts === "boolean" ? body.emailAlerts : undefined,
    telegramHandle,
    defaultChart,
  });

  return NextResponse.json({
    settings: {
      emailAlerts: settings.email_alerts,
      telegramHandle: settings.telegram_handle,
      defaultChart: settings.default_chart,
    },
  });
}
