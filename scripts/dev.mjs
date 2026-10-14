import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
if (process.env.API_PORT && process.env.API_PORT !== "3100")
  throw new Error("The Vite demo proxy expects API_PORT=3100");
const children = [
  spawn(process.execPath, ["apps/api/dist/main.js"], {
    stdio: "inherit",
    env: process.env,
  }),
  spawn("pnpm", ["--filter", "@lab/web", "exec", "vite"], {
    stdio: "inherit",
    env: process.env,
  }),
];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
for (const child of children)
  child.on("exit", (code) => {
    if (!stopping) {
      process.exitCode = code || 1;
      stop();
    }
  });
