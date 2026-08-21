import assert from "node:assert/strict";
import { normalizeDatabaseUrl } from "./db";

const session =
  "postgresql://postgres.abc:secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";
const normalized = normalizeDatabaseUrl(session);
const u = new URL(normalized);
assert.equal(u.port, "6543");
assert.equal(u.searchParams.get("pgbouncer"), "true");
assert.equal(u.searchParams.get("connection_limit"), "1");

const already =
  "postgresql://postgres.abc:secret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
assert.equal(new URL(normalizeDatabaseUrl(already)).port, "6543");

console.log("db-url.test.ts: ok");
