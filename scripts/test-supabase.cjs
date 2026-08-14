const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");

for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

async function test(label, connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    const result = await pool.query("SELECT NOW() AS now");
    console.log(`${label}: OK (${result.rows[0].now})`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${label}: FAILED - ${message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function listTables(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    const result = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    const tables = result.rows.map((row) => row.tablename);
    console.log("tables:", tables.length ? tables.join(", ") : "(none yet)");
    return tables;
  } finally {
    await pool.end();
  }
}

async function main() {
  const pooler = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  if (!pooler || !direct) {
    console.log("Missing DATABASE_URL or DIRECT_URL in .env.local");
    process.exit(1);
  }

  const directOk = await test("DIRECT_URL", direct);
  const poolerOk = await test("DATABASE_URL (pooler)", pooler);

  if (directOk) {
    await listTables(direct);
  }

  process.exit(directOk && poolerOk ? 0 : 1);
}

main();
