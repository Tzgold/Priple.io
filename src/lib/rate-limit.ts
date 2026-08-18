import { getPgPool, lockPublicTable } from "@/lib/db";

type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number; remaining: 0 };

const ensured = { ready: false as boolean };

async function ensureRateLimitTable() {
  if (ensured.ready) return;
  await getPgPool().query(`
    CREATE TABLE IF NOT EXISTS public.api_rate_limits (
      bucket_key text PRIMARY KEY,
      hit_count integer NOT NULL DEFAULT 0,
      window_starts_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await lockPublicTable("api_rate_limits");
  ensured.ready = true;
}

/**
 * Durable sliding fixed-window limiter (Postgres) — works across serverless instances.
 */
export async function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs?: number;
}): Promise<RateLimitResult> {
  const windowMs = input.windowMs ?? 60_000;
  const limit = Math.max(1, input.limit);
  const key = input.key.slice(0, 200);

  await ensureRateLimitTable();

  const { rows } = await getPgPool().query<{
    hit_count: number;
    window_starts_at: Date;
  }>(
    `INSERT INTO public.api_rate_limits (bucket_key, hit_count, window_starts_at)
     VALUES ($1, 1, now())
     ON CONFLICT (bucket_key) DO UPDATE SET
       hit_count = CASE
         WHEN public.api_rate_limits.window_starts_at
              <= (now() - ($2::text || ' milliseconds')::interval)
         THEN 1
         ELSE public.api_rate_limits.hit_count + 1
       END,
       window_starts_at = CASE
         WHEN public.api_rate_limits.window_starts_at
              <= (now() - ($2::text || ' milliseconds')::interval)
         THEN now()
         ELSE public.api_rate_limits.window_starts_at
       END
     RETURNING hit_count, window_starts_at`,
    [key, String(windowMs)],
  );

  const row = rows[0];
  if (!row) {
    return { ok: true, remaining: limit - 1 };
  }

  if (row.hit_count > limit) {
    const elapsed = Date.now() - new Date(row.window_starts_at).getTime();
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
    return { ok: false, remaining: 0, retryAfterSec };
  }

  return { ok: true, remaining: Math.max(0, limit - row.hit_count) };
}

export async function limitUserRoute(
  userId: string,
  route: string,
  limit: number,
  windowMs = 60_000,
) {
  return enforceRateLimit({
    key: `${route}:${userId}`,
    limit,
    windowMs,
  });
}

export function rateLimitJson(retryAfterSec: number) {
  return Response.json(
    {
      error: "Too many requests — slow down and retry shortly",
      retryAfterSec,
      rateLimited: true,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}
