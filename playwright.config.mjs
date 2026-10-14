import { defineConfig } from "@playwright/test";
import { randomUUID } from "node:crypto";
process.env.DB_SCHEMA ??= `idempotency_lab_browser_${randomUUID().replaceAll("-", "")}`;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/browser.json" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    browserName: "chromium",
    viewport: { width: 1440, height: 1100 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/browser-server.mjs",
    url: "http://127.0.0.1:5174/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
