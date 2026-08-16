import { Pool, type PoolConfig } from "pg";

const globalForDb = globalThis as unknown as {
  priplePgPool?: Pool;
};

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

/** SSL for managed Postgres. Default verifies certs; opt out only if needed. */
function sslConfig(connectionString: string): PoolConfig["ssl"] {
  const urlNeedsSsl =
    connectionString.includes("supabase") ||
    connectionString.includes("sslmode=require") ||
    isProduction();

  if (!urlNeedsSsl) return undefined;

  // Escape hatch for broken intermediary certs — prefer fixing CA over using this.
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: true };
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
