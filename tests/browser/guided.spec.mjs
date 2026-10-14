import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
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
async function lesson(page, name) {
  await page
    .getByRole("navigation", { name: "Guided experiments" })
    .getByRole("button", { name: new RegExp(name) })
    .click();
}
async function shot(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
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
test.beforeEach(async ({ page, request }) => {
  expect(
    (
      await request.post("/api/demo/reset", {
        data: { confirm: "DELETE LAB DATA" },
      })
    ).status(),
  ).toBe(201);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Send the request", exact: true }),
  ).toBeEnabled();
});
test.afterAll(async () => pool.end());
test("first-time view explains the next action and keeps identifiers in the technical panel", async ({
  page,
}) => {
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator("#technical-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.getByTestId("server-observation")).toContainText(
    "No experiment started",
  );
  await expect(page.getByTestId("intention-key")).toBeHidden();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(page.getByRole("heading", { name: "Send twice" })).toHaveCSS(
    "font-family",
    /Atkinson Hyperlegible Next Variable/,
  );
  expect(
    await page.evaluate(() =>
      document.fonts.check('16px "Atkinson Hyperlegible Next Variable"'),
    ),
  ).toBe(true);
  await shot(page, "guided-ready-desktop");
  await page.locator("#technical-toggle").click();
  await expect(page.getByTestId("intention-key")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "HTTP activity" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Local fault controls" }),
  ).toBeHidden();
  await counts(0, 0);
});
test("guided sequential replay explains two sends and one actual saved request", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Send the request", exact: true })
    .click();
  await expect(page.getByTestId("client-observation")).toContainText(
    "Confirmation received",
  );
  await expect(page.getByTestId("server-observation")).toContainText(
    "One request saved",
  );
  const first = (await pool.query("SELECT id FROM interventions")).rows[0].id;
  await page
    .getByRole("button", { name: "Send the same request again" })
    .click();
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 1 saved request",
  );
  await expect(
    page.getByRole("button", { name: "Next experiment" }),
  ).toBeFocused();
  await counts(1, 1);
  expect((await pool.query("SELECT id FROM interventions")).rows[0].id).toBe(
    first,
  );
  await shot(page, "guided-repeat-desktop");
});
test("guided lost response, panel toggle and reload preserve the same reference and recover", async ({
  page,
}) => {
  await lesson(page, "Lost reply");
  await page.getByRole("button", { name: "Send with a lost reply" }).click();
  await expect(page.getByTestId("client-observation")).toContainText(
    "No confirmation received",
  );
  await expect(page.getByTestId("server-observation")).toContainText(
    "One request saved",
  );
  await counts(1, 1);
  await shot(page, "guided-lost-desktop");
  const saved = (await pool.query("SELECT response FROM idempotency_keys"))
    .rows[0].response;
  await page.locator("#technical-toggle").click();
  const key = await page.getByTestId("intention-key").textContent();
  await page.locator("#technical-toggle").click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry same request" }),
  ).toBeEnabled();
  await expect(page.getByTestId("client-observation")).toContainText(
    "No confirmation received",
  );
  await page.getByRole("button", { name: "Retry same request" }).click();
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 1 saved request",
  );
  await page.locator("#technical-toggle").click();
  await expect(page.getByTestId("intention-key")).toHaveText(key);
  await expect(page.getByTestId("business-id")).toHaveText(saved.request.id);
  await counts(1, 1);
});
test("guided concurrency uses twenty real sends and one saved record", async ({
  page,
}) => {
  await lesson(page, "Send together");
  await page.getByRole("button", { name: "Send 20 attempts together" }).click();
  await expect(page.locator(".takeaway")).toContainText(
    "20 sends, 1 saved request",
  );
  await counts(1, 1);
  await page.locator("#technical-toggle").click();
  await expect(page.locator(".timeline li")).toHaveCount(20);
});
test("guided rollback shows no saved record then a successful retry", async ({
  page,
}) => {
  await lesson(page, "Fail before saving");
  await page.getByRole("button", { name: "Try a send that fails" }).click();
  await expect(page.getByTestId("server-observation")).toContainText(
    "No saved request observed",
  );
  await counts(0, 0);
  await page.getByRole("button", { name: "Retry without the failure" }).click();
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 1 saved request",
  );
  await counts(1, 1);
});
test("guided content conflict preserves the original priority", async ({
  page,
}) => {
  await lesson(page, "Change content");
  await page.getByRole("button", { name: "Save the routine request" }).click();
  await page.getByRole("button", { name: "Try changing it to urgent" }).click();
  await expect(page.getByTestId("client-observation")).toContainText(
    "Different content refused",
  );
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 1 saved request",
  );
  await expect(page.locator(".stage-footer")).toContainText(
    "Changed content was refused",
  );
  await expect(page.locator(".stage-footer")).not.toContainText("was returned");
  expect(
    (await pool.query("SELECT priority FROM interventions")).rows[0].priority,
  ).toBe("routine");
  await counts(1, 1);
  await shot(page, "guided-conflict-desktop");
});
test("guided new intention uses two keys and creates two genuine requests", async ({
  page,
}) => {
  await lesson(page, "Create another");
  await page.getByRole("button", { name: "Save the first request" }).click();
  await page.getByRole("button", { name: "Create a separate request" }).click();
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 2 saved requests",
  );
  await counts(2, 2);
  const rows = (await pool.query("SELECT site,description FROM interventions"))
    .rows;
  expect(rows[0]).toEqual(rows[1]);
});
test("guided results exclude earlier experiments without deleting them", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Send the request", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send the same request again" })
    .click();
  await page.locator(".explanation > summary").click();
  await page.getByRole("button", { name: "Repeat this experiment" }).click();
  await page
    .getByRole("button", { name: "Send the request", exact: true })
    .click();
  await expect(page.getByTestId("server-observation")).toContainText(
    "One request saved",
  );
  await counts(2, 2);
});
test("server read failure never presents a fabricated zero or success conclusion", async ({
  page,
}) => {
  await page.route("**/api/interventions", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: "{}",
        })
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "Send the request", exact: true })
    .click();
  await expect(page.getByTestId("server-observation")).toContainText(
    "Could not check the server",
  );
  await counts(1, 1);
  await page
    .getByRole("button", { name: "Send the same request again" })
    .click();
  await expect(page.locator(".takeaway")).toContainText(
    "Server evidence is unavailable",
  );
  await expect(page.locator(".takeaway")).not.toContainText("1 saved request");
  await counts(1, 1);
});
test("existing v0.1 browser intent remains intact until a new experiment is explicitly started", async ({
  page,
}) => {
  const key = randomUUID();
  await page.addInitScript(
    (value) =>
      localStorage.setItem(
        "intervention-lab.intent.v1",
        JSON.stringify({
          key: value,
          draft: {
            site: "Existing fictional workshop",
            description: "Inspect the saved example pump",
            priority: "routine",
          },
          locked: true,
          attempts: [],
          businessId: null,
        }),
      ),
    key,
  );
  await page.reload();
  await expect(
    page.getByText("Your earlier request is preserved in", { exact: false }),
  ).toBeVisible();
  await page.locator("#technical-toggle").click();
  await expect(page.getByTestId("intention-key")).toHaveText(key);
  await page.locator(".advanced-tools > summary").click();
  await expect(page.getByLabel("Site", { exact: true })).toHaveValue(
    "Existing fictional workshop",
  );
  await counts(0, 0);
});
test("guided keyboard, accessible disclosure, mobile and 200 percent reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".brand")).toHaveAccessibleName(
    "Idempotent requests lab",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to the next action" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Send the request", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Send the same request again" }),
  ).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 1 saved request",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await shot(page, "guided-mobile");
  await page.locator("#technical-toggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#technical-toggle")).toBeFocused();
  await expect(page.locator("#technical-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByTestId("intention-key")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.locator("#technical-toggle").press("Enter");
  await page.setViewportSize({ width: 640, height: 800 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await shot(page, "guided-zoom");
});

test("in-app browser width keeps the guided action and observations readable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 659, height: 853 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await shot(page, "guided-inapp");
});

test("scenario navigation scopes the drawer and preserves the unfinished request", async ({
  page,
}) => {
  await lesson(page, "Lost reply");
  await page.getByRole("button", { name: "Send with a lost reply" }).click();
  await expect(page.locator(".state-label.unknown")).toHaveText("Unconfirmed");
  await page.locator("#technical-toggle").click();
  const key = await page.getByTestId("intention-key").textContent();
  await expect(page.locator(".http-outcome")).toHaveText("No response");
  await expect(page.getByTestId("business-id")).toHaveText("Not confirmed yet");
  await expect(page.locator(".scoped-records li")).toHaveCount(1);
  await expect(page.locator(".scoped-records")).toContainText(
    (await pool.query("SELECT id FROM interventions")).rows[0].id,
  );
  await lesson(page, "Send together");
  await expect(page.locator("#technical-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator("#technical-toggle").click();
  await expect(
    page.getByText("No attempts in this scenario yet."),
  ).toBeVisible();
  await expect(page.locator(".timeline li")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume Lost reply" }).click();
  await expect(
    page.getByRole("button", { name: "Retry same request" }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.locator("#technical-toggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator("#technical-toggle").click();
  await expect(page.getByTestId("intention-key")).toHaveText(key);
  await counts(1, 1);
});

test("version C expanded panel keeps the scenario action visible and copies the real key", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await lesson(page, "Lost reply");
  await page.getByRole("button", { name: "Send with a lost reply" }).click();
  await expect(page.locator(".state-label.unknown")).toHaveText("Unconfirmed");
  await page.locator("#technical-toggle").click();
  await expect(
    page.getByRole("button", { name: "Retry same request" }),
  ).toBeInViewport();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const key = await page.getByTestId("intention-key").textContent();
  await page.getByRole("button", { name: "Copy idempotency key" }).click();
  await expect(page.getByText("Idempotency key copied.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(key);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await mkdir(".impeccable/review", { recursive: true });
  await page.screenshot({ path: ".impeccable/review/hero-repro.png" });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".brand")).toHaveAccessibleName(
    "Idempotent requests lab",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 659, height: 853 });
  await page.screenshot({
    path: ".impeccable/review/user-659.png",
    fullPage: true,
  });
  await page.locator("#technical-toggle").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/user-659-collapsed.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.screenshot({
    path: ".impeccable/review/desktop-collapsed.png",
    fullPage: true,
  });
});

test("lost-reply summary distinguishes the plan from observed and unavailable evidence", async ({
  page,
}) => {
  await lesson(page, "Lost reply");
  await expect(page.locator(".stage-footer")).toHaveText(
    "Send a request, then lose its reply after saving.",
  );
  await expect(page.locator(".stage-footer")).not.toContainText(
    "The request is saved",
  );
  await shot(page, "workspace-c-lost-ready");
  await page.getByRole("button", { name: "Send with a lost reply" }).click();
  await expect(page.locator(".stage-footer")).toHaveText(
    "The request is saved. The reply never arrived.",
  );
  await page.locator("#technical-toggle").click();
  await page.route("**/api/interventions", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: "{}",
        })
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "Refresh records", exact: true })
    .click();
  await expect(page.locator(".stage-footer")).toHaveText(
    "Server evidence is unavailable. Refresh to check the result.",
  );
  await expect(page.locator(".result-counts")).not.toContainText("0 saved");
  await shot(page, "workspace-c-server-unavailable");
  await counts(1, 1);
});
