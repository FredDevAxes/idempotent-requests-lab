import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const { createPool, migrate, schema } = require("../apps/api/dist/database");
const { createApp } = require("../apps/api/dist/app");
if (!schema.startsWith("idempotency_lab_browser_"))
  throw new Error("Browser tests require an isolated browser schema");
const pool = createPool();
await migrate(pool);
const app = await createApp(pool, true);
await app.listen(3101, "127.0.0.1");
const vite = spawn(
  "pnpm",
  ["--filter", "@lab/web", "exec", "vite", "preview", "--port", "5174"],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_API_TARGET: "http://127.0.0.1:3101" },
  },
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  vite.kill("SIGTERM");
  await app.close();
  await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await pool.end();
  process.exit(0);
}
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => void stop());
vite.on("exit", () => {
  if (!stopping) void stop();
});
