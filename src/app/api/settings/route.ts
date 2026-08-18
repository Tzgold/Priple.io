import { NextResponse } from "next/server";
import {
  CHART_PREFS,
  getUserSettings,
  upsertUserSettings,
  type ChartPref,
} from "@/lib/desk-db";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getUserSettings(session.user.id);
  return NextResponse.json({
    settings: {
      emailAlerts: settings.email_alerts,
      telegramHandle: settings.telegram_handle,
      defaultChart: settings.default_chart,
    },
    profile: {
      id: session.user.id,
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

  const settings = await upsertUserSettings(session.user.id, {
    emailAlerts: typeof body.emailAlerts === "boolean" ? body.emailAlerts : undefined,
    telegramHandle: body.telegramHandle,
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
