import { Pool } from "pg";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
if (existsSync(".env")) process.loadEnvFile(".env");
export const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://lab@127.0.0.1:55432/idempotency_lab";
export const schema = process.env.DB_SCHEMA ?? "idempotency_lab";
if (!/^idempotency_lab(?:_[a-z0-9_]+)?$/.test(schema))
  throw new Error("Invalid lab schema");
export function createPool() {
  return new Pool({
    connectionString: databaseUrl,
    max: 25,
    connectionTimeoutMillis: 3000,
    options: `-c search_path=${schema}`,
    application_name: "idempotent-requests-lab",
  });
}
export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(841954)");
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(
      readFileSync(join(__dirname, "../migrations/001.sql"), "utf8"),
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
