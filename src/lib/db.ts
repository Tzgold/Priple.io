import { Pool, type PoolConfig } from "pg";

const globalForDb = globalThis as unknown as {
  priplePgPool?: Pool;
};

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
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
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for desk persistence");
  }

  if (!globalForDb.priplePgPool) {
    globalForDb.priplePgPool = new Pool({
      connectionString: url,
      ssl: sslConfig(url),
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
