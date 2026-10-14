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
test("first-time view explains the next action and keeps identifiers in the technical tab", async ({
  page,
}) => {
  await expect(page.getByRole("tab", { name: "Guided demo" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("server-observation")).toContainText(
    "No experiment started",
  );
  await expect(page.getByTestId("intention-key")).toBeHidden();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(
    page.getByRole("heading", { name: "Try again. Keep one request." }),
  ).toHaveCSS("font-family", /Atkinson Hyperlegible Next Variable/);
  expect(
    await page.evaluate(() =>
      document.fonts.check('16px "Atkinson Hyperlegible Next Variable"'),
    ),
  ).toBe(true);
  await shot(page, "guided-ready-desktop");
  await page
    .getByRole("tab", { name: "Technical controls", exact: true })
    .click();
  await expect(page.getByTestId("intention-key")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Local fault controls" }),
  ).toBeVisible();
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
test("guided lost response, tab switch and reload preserve the same reference and recover", async ({
  page,
}) => {
  await lesson(page, "Lose a reply");
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
  await page.getByRole("button", { name: "Inspect the evidence" }).click();
  const key = await page.getByTestId("intention-key").textContent();
  await page.getByRole("tab", { name: "Guided demo" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Try the same request again" }),
  ).toBeEnabled();
  await expect(page.getByTestId("client-observation")).toContainText(
    "No confirmation received",
  );
  await page
    .getByRole("button", { name: "Try the same request again" })
    .click();
  await expect(page.locator(".takeaway")).toContainText(
    "2 sends, 1 saved request",
  );
  await page.getByRole("button", { name: "Inspect the evidence" }).click();
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
  await page.getByRole("button", { name: "Inspect the evidence" }).click();
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
  await lesson(page, "Change the content");
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
  await page
    .getByRole("tab", { name: "Technical controls", exact: true })
    .click();
  await expect(page.getByTestId("intention-key")).toHaveText(key);
  await expect(page.getByLabel("Site", { exact: true })).toHaveValue(
    "Existing fictional workshop",
  );
  await counts(0, 0);
});
test("guided keyboard, accessible tabs, mobile and 200 percent reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.getByRole("tab", { name: "Guided demo" }).click();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Technical controls", exact: true }),
  ).toBeFocused();
  await expect(page.getByTestId("intention-key")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("ArrowLeft");
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
