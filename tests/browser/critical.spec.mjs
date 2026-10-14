import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { createPool } = require("../../apps/api/dist/database");
const pool = createPool();
async function counts(requests, keys) {
  const result = await pool.query(
    "SELECT (SELECT count(*)::int FROM interventions) AS requests, (SELECT count(*)::int FROM idempotency_keys) AS keys",
  );
  expect(result.rows[0]).toEqual({ requests, keys });
}
async function scenario(page, label) {
  if (!(await page.getByLabel("Scenario for the next attempt").isVisible()))
    await page.getByText("Open local scenario controls").click();
  await page
    .getByLabel("Scenario for the next attempt")
    .selectOption({ label });
}
async function screenshot(page, name) {
  await mkdir("test-results/screenshots", { recursive: true });
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
  if (process.env.CAPTURE_DOCS === "true") {
    await mkdir("docs/evidence", { recursive: true });
    await page.screenshot({
      path: `docs/evidence/${name}.png`,
      fullPage: true,
    });
  }
}
test.beforeEach(async ({ request, page }) => {
  expect(
    (
      await request.post("/api/demo/reset", {
        data: { confirm: "DELETE LAB DATA" },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/");
  await expect(page.getByText("Open local scenario controls")).toBeVisible();
});
test.afterAll(async () => pool.end());
test("normal send, exact retry and a distinct intention", async ({ page }) => {
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Result known.");
  const id = await page.getByTestId("business-id").textContent();
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.locator(".timeline li")).toHaveCount(2);
  await expect(page.getByTestId("business-id")).toHaveText(id);
  await counts(1, 1);
  await screenshot(page, "known-desktop");
  await page
    .getByRole("button", { name: "New intention", exact: true })
    .click();
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByTestId("saved-requests").locator("li")).toHaveCount(2);
  await counts(2, 2);
});
test("real response loss, reload with preserved key/content and recovery", async ({
  page,
}) => {
  await scenario(page, "Lose the response after commit");
  const key = await page.getByTestId("intention-key").textContent();
  const input = await page.getByLabel("What needs attention?").inputValue();
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Result unknown.",
  );
  await expect(page.getByTestId("saved-requests").locator("li")).toHaveCount(1);
  await counts(1, 1);
  const stored = (await pool.query("SELECT response FROM idempotency_keys"))
    .rows[0].response;
  await screenshot(page, "unknown-desktop");
  await page.reload();
  await expect(page.getByTestId("intention-key")).toHaveText(key);
  await expect(page.getByLabel("What needs attention?")).toHaveValue(input);
  await expect(page.getByLabel("What needs attention?")).toBeDisabled();
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.getByTestId("business-id")).toHaveText(stored.request.id);
  await counts(1, 1);
});
test("content conflict is visible without a duplicate", async ({ page }) => {
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Result known.");
  const id = await page.getByTestId("business-id").textContent();
  await scenario(page, "Change content under the same key");
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Content conflict.",
  );
  await expect(page.getByTestId("business-id")).toHaveText(id);
  await counts(1, 1);
});
test("pre-commit failure and recovery leave no partial writes", async ({
  page,
}) => {
  await scenario(page, "Fail before commit");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "Temporarily unavailable",
  );
  await counts(0, 0);
  await scenario(page, "Normal delivery");
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.getByRole("status").first()).toContainText("Result known.");
  await counts(1, 1);
});
test("twenty actual browser sends create one record", async ({ page }) => {
  await scenario(page, "Send 20 simultaneous attempts");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.locator(".timeline li")).toHaveCount(20);
  await expect(
    page.getByRole("button", { name: "Retry same request" }),
  ).toBeEnabled();
  await expect(page.getByTestId("saved-requests").locator("li")).toHaveCount(1);
  await counts(1, 1);
});
test("mobile and keyboard path, reduced motion, contrast and 200% reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to request form" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Site", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("What needs attention?")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Priority", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Send request", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").first()).toContainText("Result known.");
  await counts(1, 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await screenshot(page, "known-mobile");
  await page.setViewportSize({ width: 640, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Retry same request" }),
  ).toBeVisible();
  await screenshot(page, "zoom-reflow");
});
test("explicit reset confirmation and purge controls", async ({ page }) => {
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("Result known.");
  await scenario(page, "Normal delivery");
  await page.getByRole("button", { name: "Purge eligible keys" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "0 retained keys",
  );
  await counts(1, 1);
  await page.getByRole("button", { name: "Advance clock by 25 hours" }).click();
  await expect(page.getByRole("status").last()).toContainText("clock advanced");
  await page.getByRole("button", { name: "Purge eligible keys" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "1 retained keys",
  );
  await counts(1, 0);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset lab data" }).click();
  await expect(page.getByRole("status").last()).toContainText("Lab data reset");
  await counts(0, 0);
});

test("storage failure prevents sending an unpreserved intention", async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Unavailable storage");
    };
  });
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "No request sent",
  );
  await counts(0, 0);
});

test("reload during an in-flight commit preserves the intent and recovers", async ({
  page,
  request,
}) => {
  const { id } = await (await request.post("/api/demo/gates")).json();
  const key = await page.getByTestId("intention-key").textContent();
  await page.route("**/api/interventions", (route) =>
    route.continue({
      headers: { ...route.request().headers(), "x-lab-gate": id },
    }),
  );
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/demo/gates/${id}`)).json()).reached,
    )
    .toBe(true);
  await counts(0, 0);
  await page.reload();
  await expect(page.getByTestId("intention-key")).toHaveText(key);
  await expect(page.getByRole("status").first()).toContainText(
    "No result confirmed",
  );
  expect((await request.post(`/api/demo/gates/${id}/release`)).status()).toBe(
    201,
  );
  await page.unroute("**/api/interventions");
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.getByRole("status").first()).toContainText("Result known.");
  await counts(1, 1);
});
