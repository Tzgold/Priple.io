import { NextResponse } from "next/server";
import { dismissAlertEvent } from "@/lib/desk-db";
import { requireSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const dismissed = await dismissAlertEvent(session.user.id, id);
  if (!dismissed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
