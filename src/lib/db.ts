import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  priplePgPool?: Pool;
};

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function getPgPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for desk persistence");
  }

  if (!globalForDb.priplePgPool) {
    const isSupabase = url.includes("supabase");
    globalForDb.priplePgPool = new Pool({
      connectionString: url,
      // Supabase pooler uses certs that Node may not trust in all environments.
      ssl: isSupabase || isProduction() ? { rejectUnauthorized: false } : undefined,
      max: isProduction() ? 5 : 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
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
