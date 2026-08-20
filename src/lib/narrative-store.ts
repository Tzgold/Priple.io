import { randomUUID } from "crypto";
import { getPgPool, lockPublicTable } from "@/lib/db";
import type { NarrativePacket } from "@/lib/narrative-packet";
import type { NarrativeMessage, NarrativeOrigin } from "@/lib/narrative-types";
import type { WalletNarrative } from "@/lib/wallet-narrative";

export type { NarrativeMessage, NarrativeOrigin };

export type NarrativeThread = {
  id: string;
  userId: string;
  subjectType: "wallet" | "coin";
  subjectKey: string;
  packet: NarrativePacket;
  briefing: WalletNarrative;
  origin: NarrativeOrigin;
  createdAt: string;
  expiresAt: string;
};

let ready = false;

async function ensureNarrativeTables() {
  if (ready) return;
  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.narrative_threads (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      subject_type text NOT NULL,
      subject_key text NOT NULL,
      packet_json jsonb NOT NULL,
      briefing_json jsonb NOT NULL,
      origin text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS narrative_threads_user_subject_idx
    ON public.narrative_threads (user_id, subject_type, subject_key, expires_at DESC)
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.narrative_messages (
      id text PRIMARY KEY,
      thread_id text NOT NULL REFERENCES public.narrative_threads(id) ON DELETE CASCADE,
      role text NOT NULL,
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS narrative_messages_thread_idx
    ON public.narrative_messages (thread_id, created_at)
  `);
  await lockPublicTable("narrative_threads");
  await lockPublicTable("narrative_messages");
  ready = true;
}

type ThreadRow = {
  id: string;
  user_id: string;
  subject_type: "wallet" | "coin";
  subject_key: string;
  packet_json: NarrativePacket;
  briefing_json: WalletNarrative;
  origin: NarrativeOrigin;
  created_at: Date;
  expires_at: Date;
};

function mapThread(row: ThreadRow): NarrativeThread {
  return {
    id: row.id,
    userId: row.user_id,
    subjectType: row.subject_type,
    subjectKey: row.subject_key,
    packet: row.packet_json,
    briefing: row.briefing_json,
    origin: row.origin,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

export async function getActiveNarrativeThread(
  userId: string,
  subjectType: "wallet" | "coin",
  subjectKey: string,
) {
  await ensureNarrativeTables();
  const { rows } = await getPgPool().query<ThreadRow>(
    `SELECT id, user_id, subject_type, subject_key, packet_json, briefing_json, origin, created_at, expires_at
     FROM public.narrative_threads
     WHERE user_id = $1 AND subject_type = $2 AND subject_key = $3 AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, subjectType, subjectKey],
  );
  return rows[0] ? mapThread(rows[0]) : null;
}

export async function getNarrativeThreadById(userId: string, threadId: string) {
  await ensureNarrativeTables();
  const { rows } = await getPgPool().query<ThreadRow>(
    `SELECT id, user_id, subject_type, subject_key, packet_json, briefing_json, origin, created_at, expires_at
     FROM public.narrative_threads
     WHERE id = $1 AND user_id = $2 AND expires_at > now()
     LIMIT 1`,
    [threadId, userId],
  );
  return rows[0] ? mapThread(rows[0]) : null;
}

export async function createNarrativeThread(input: {
  userId: string;
  subjectType: "wallet" | "coin";
  subjectKey: string;
  packet: NarrativePacket;
  briefing: WalletNarrative;
  origin: NarrativeOrigin;
}) {
  await ensureNarrativeTables();
  const id = randomUUID();
  const { rows } = await getPgPool().query<ThreadRow>(
    `INSERT INTO public.narrative_threads
       (id, user_id, subject_type, subject_key, packet_json, briefing_json, origin, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, now(), now() + interval '24 hours')
     RETURNING id, user_id, subject_type, subject_key, packet_json, briefing_json, origin, created_at, expires_at`,
    [
      id,
      input.userId,
      input.subjectType,
      input.subjectKey,
      JSON.stringify(input.packet),
      JSON.stringify(input.briefing),
      input.origin,
    ],
  );
  const row = rows[0];
  if (!row) {
    throw new Error("Could not store narrative thread");
  }
  return mapThread(row);
}

export async function listNarrativeMessages(threadId: string): Promise<NarrativeMessage[]> {
  await ensureNarrativeTables();
  const { rows } = await getPgPool().query<{
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: Date;
  }>(
    `SELECT id, role, content, created_at
     FROM public.narrative_messages
     WHERE thread_id = $1
     ORDER BY created_at ASC`,
    [threadId],
  );
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function countUserNarrativeMessages(threadId: string) {
  await ensureNarrativeTables();
  const { rows } = await getPgPool().query<{ n: string }>(
    `SELECT count(*)::text AS n FROM public.narrative_messages WHERE thread_id = $1 AND role = 'user'`,
    [threadId],
  );
  return parseInt(rows[0]?.n || "0", 10);
}

export async function appendNarrativeMessage(input: {
  threadId: string;
  role: "user" | "assistant";
  content: string;
}) {
  await ensureNarrativeTables();
  const id = randomUUID();
  await getPgPool().query(
    `INSERT INTO public.narrative_messages (id, thread_id, role, content, created_at)
     VALUES ($1, $2, $3, $4, now())`,
    [id, input.threadId, input.role, input.content.slice(0, 8000)],
  );
  return id;
}
