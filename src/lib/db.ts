import { Pool } from "pg";
import Database from "better-sqlite3";
import path from "path";

const globalForDb = globalThis as unknown as {
  priplePgPool?: Pool;
};

export function getPgPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for desk persistence");
  }

  if (!globalForDb.priplePgPool) {
    globalForDb.priplePgPool = new Pool({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
  }

  return globalForDb.priplePgPool;
}

/** Better Auth database adapter (Postgres when DATABASE_URL is set). */
export function createAuthDatabase() {
  const url = process.env.DATABASE_URL;
  if (url) return getPgPool();
  return new Database(path.join(process.cwd(), "sqlite.db"));
}
