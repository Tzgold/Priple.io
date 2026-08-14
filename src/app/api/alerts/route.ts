import { NextResponse } from "next/server";
import {
  createAlertEvent,
  listAlertEvents,
  relativeTime,
  type DeskAlertType,
} from "@/lib/desk-db";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listAlertEvents(session.user.id);
  const alerts = rows.map((row) => ({
    id: row.id,
    title: row.title,
    detail: row.detail,
    time: relativeTime(new Date(row.created_at)),
    type: row.alert_type as DeskAlertType,
    status: "Live" as const,
    custom: true,
  }));

  return NextResponse.json({ alerts });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; detail?: string; type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title || !body.type) {
    return NextResponse.json({ error: "title and type are required" }, { status: 400 });
  }

  try {
    const row = await createAlertEvent(session.user.id, {
      title: body.title,
      detail: body.detail,
      alertType: body.type,
    });

    return NextResponse.json(
      {
        alert: {
          id: row.id,
          title: row.title,
          detail: row.detail,
          time: "now",
          type: row.alert_type as DeskAlertType,
          status: "Live" as const,
          custom: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create alert";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
