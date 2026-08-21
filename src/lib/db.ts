import { Pool, type PoolConfig } from "pg";

const globalForDb = globalThis as unknown as {
  priplePgPool?: Pool;
};

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

/**
 * Serverless + Supabase session pooler (port 5432) exhausts quickly
 * (EMAXCONNSESSION / pool_size: 15). Prefer transaction pooler (6543).
 */
export function normalizeDatabaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  const host = url.hostname.toLowerCase();
  const isSupabasePooler =
    host.includes("pooler.supabase.com") || host.includes("pooler.supabase.co");

  if (isSupabasePooler) {
    // Session mode → transaction mode for serverless.
    if (!url.port || url.port === "5432") {
      url.port = "6543";
    }
    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connection_limit")) {
      // Hint for some drivers; pg Pool.max is the real cap.
      url.searchParams.set("connection_limit", "1");
    }
  }

  return url.toString();
}

/**
 * SSL for managed Postgres.
 * Supabase pooler commonly triggers Node "self-signed certificate in certificate chain"
 * on Windows/local (and sometimes serverless). Default: do not reject for Supabase;
 * opt into strict verify with DATABASE_SSL_REJECT_UNAUTHORIZED=true.
 */
function sslConfig(connectionString: string): PoolConfig["ssl"] {
  const urlNeedsSsl =
    connectionString.includes("supabase") ||
    connectionString.includes("sslmode=require") ||
    isProduction();

  if (!urlNeedsSsl) return undefined;

  const flag = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (flag === "false") return { rejectUnauthorized: false };
  if (flag === "true") return { rejectUnauthorized: true };

  // Supabase transaction/session pooler — prefer connectivity over strict CA verify.
  if (connectionString.includes("supabase")) {
    return { rejectUnauthorized: false };
  }

  // Non-Supabase production DBs: verify certificates.
  return { rejectUnauthorized: isProduction() };
}

export function getPgPool(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is required for desk persistence");
  }

  if (!globalForDb.priplePgPool) {
    const url = normalizeDatabaseUrl(raw);
    // One client per serverless isolate — many cold starts × max:5 blew Supabase session pool.
    const max = Number(process.env.DATABASE_POOL_MAX || (isProduction() ? 1 : 5));
    globalForDb.priplePgPool = new Pool({
      connectionString: url,
      ssl: sslConfig(url),
      max: Number.isFinite(max) && max > 0 ? max : 1,
      idleTimeoutMillis: isProduction() ? 5_000 : 20_000,
      connectionTimeoutMillis: 8_000,
      allowExitOnIdle: true,
    });
  }

  return globalForDb.priplePgPool;
}

/** Better Auth database — Postgres only (no sqlite on Vercel). */
export function createAuthDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. SQLite is not supported — set DATABASE_URL for local and production.",
    );
  }
  return getPgPool();
}

const PUBLIC_TABLE = /^[a-z_][a-z0-9_]*$/i;

/**
 * Priple never uses the Supabase Data API. Every public table must:
 * - have RLS on (blocks anon/authenticated even if grants leak)
 * - revoke grants from anon, authenticated, and PUBLIC
 *
 * The server DATABASE_URL role (postgres) bypasses RLS, so the app keeps working.
 */
export async function lockPublicTable(table: string) {
  if (!PUBLIC_TABLE.test(table)) {
    throw new Error(`Refusing to lock invalid table name: ${table}`);
  }

  const pool = getPgPool();
  await pool.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
  await pool.query(`REVOKE ALL ON TABLE public.${table} FROM PUBLIC`);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON TABLE public.${table} FROM anon';
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON TABLE public.${table} FROM authenticated';
      END IF;
    END
    $$;
  `);
}
