import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

// Use the same isolated PostgreSQL server and cleanup as browser verification.
export default defineConfig({
  ...base,
  testDir: "./scripts",
  testMatch: "capture-docs.spec.mjs",
  timeout: 120000,
  reporter: "list",
  use: {
    ...base.use,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  },
});
