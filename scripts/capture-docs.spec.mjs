import { test, expect } from "@playwright/test";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, copyFile, rm, readFile } from "node:fs/promises";
import { crc32 } from "node:zlib";

const output = "docs/visuals";
const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const changedRuntime = execFileSync(
  "git",
  [
    "diff",
    "--name-only",
    "HEAD",
    "--",
    "apps/api",
    "apps/web",
    "packages/contracts",
  ],
  { encoding: "utf8" },
).trim();
if (changedRuntime)
  throw new Error(
    "Commit runtime changes before producing revision-linked documentation captures.",
  );
let sourceTag;
try {
  sourceTag = execFileSync(
    "git",
    ["describe", "--tags", "--exact-match", "HEAD"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
} catch {
  sourceTag = null;
}

// Add provenance as PNG metadata without changing the screenshot pixels.
function withProvenance(png, description) {
  if (png.subarray(-8, -4).toString() !== "IEND")
    throw new Error("Expected a PNG screenshot");
  const data = Buffer.from(`impeccable:prompt\0${description}`, "latin1");
  const type = Buffer.from("tEXt");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([
    png.subarray(0, -12),
    length,
    type,
    data,
    checksum,
    png.subarray(-12),
  ]);
}

test("capture the current scenario workspace and real persisted outcomes", async ({
  page,
  request,
  browser,
}) => {
  await mkdir(output, { recursive: true });
  const captures = [];
  async function start(id) {
    expect(
      (
        await request.post("/api/demo/reset", {
          data: { confirm: "DELETE LAB DATA" },
        })
      ).status(),
    ).toBe(201);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`/#${id}`);
    await expect(page.locator("#guide-action")).toBeEnabled();
    await expect(page.locator("#technical-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  }
  async function click(name) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("#guide-action")).toBeEnabled();
  }
  async function capture(file, expectedSends, expectedRows) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    const session = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("intervention-lab.intent.v1")),
    );
    const body = await (await request.get("/api/interventions")).json();
    const sends = session
      ? (session.guide?.priorSends ?? 0) + session.attempts.length
      : 0;
    expect(sends).toBe(expectedSends);
    expect(body.requests).toHaveLength(expectedRows);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const png = await page.screenshot({ fullPage: true });
    const description = `Origin: actual compiled lab at ${sourceRevision}; Chromium ${browser.version()}, isolated fictional PostgreSQL data. ${file}: ${sends} sends, ${body.requests.length} persisted rows. No image generation or pixel compositing.`;
    await writeFile(`${output}/${file}.png`, withProvenance(png, description));
    captures.push({
      file: `${file}.png`,
      viewport: page.viewportSize(),
      scenario: new URL(page.url()).hash.slice(1),
      sends,
      savedRequests: body.requests.length,
      outcomes: session?.attempts.map((attempt) => attempt.outcome) ?? [],
      technicalPanel:
        (await page
          .locator("#technical-toggle")
          .getAttribute("aria-expanded")) === "true",
      capturedAt: new Date().toISOString(),
    });
  }
  await page.goto("/");
  await start("repeat");
  await capture("overview", 0, 0);
  await click("Send the request");
  await click("Send the same request again");
  await expect(
    page.getByRole("button", { name: "Restart scenario" }),
  ).toBeVisible();
  await capture("send-twice", 2, 1);

  await start("lost");
  await click("Send with a lost reply");
  await expect(page.getByTestId("client-observation")).toContainText(
    "No confirmation received",
  );
  await capture("lost-reply", 1, 1);
  await page.locator("#technical-toggle").click();
  await capture("technical-panel", 1, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("technical-mobile", 1, 1);
  await page.locator("#technical-toggle").click();
  await capture("scenario-mobile", 1, 1);
  await page.setViewportSize({ width: 1440, height: 900 });
  await click("Retry same request");
  await capture("recovered-reply", 2, 1);

  await start("parallel");
  await click("Send 20 attempts together");
  await capture("concurrent-sends", 20, 1);

  await start("rollback");
  await click("Try a send that fails");
  await capture("rolled-back", 1, 0);
  await click("Retry without the failure");
  await capture("recovered-failure", 2, 1);

  await start("conflict");
  await click("Save the routine request");
  await click("Try changing it to urgent");
  await capture("changed-content", 2, 1);
  expect(
    (await (await request.get("/api/interventions")).json()).requests[0]
      .priority,
  ).toBe("routine");

  await start("new");
  await click("Save the first request");
  await click("Create a separate request");
  await capture("separate-requests", 2, 2);

  let recording;
  try {
    recording = JSON.parse(
      await readFile(`${output}/manifest.json`, "utf8"),
    ).recording;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (process.env.CAPTURE_GIF === "true") {
    // Timing holds make the real recording readable; assertions establish outcomes.
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:5174",
      viewport: { width: 1440, height: 900 },
      reducedMotion: "no-preference",
      recordVideo: {
        dir: "test-results/visual-recording",
        size: { width: 1440, height: 900 },
      },
    });
    try {
      expect(
        (
          await request.post("/api/demo/reset", {
            data: { confirm: "DELETE LAB DATA" },
          })
        ).status(),
      ).toBe(201);
      const videoPage = await context.newPage();
      await videoPage.goto("/#lost");
      await expect(
        videoPage.getByRole("button", { name: "Send with a lost reply" }),
      ).toBeEnabled();
      await videoPage.evaluate(async () => {
        await document.fonts.ready;
      });
      await videoPage.waitForTimeout(1000);
      await videoPage
        .getByRole("button", { name: "Send with a lost reply" })
        .click();
      await expect(
        videoPage.getByRole("button", { name: "Retry same request" }),
      ).toBeEnabled();
      await expect(videoPage.getByTestId("server-observation")).toContainText(
        "One request saved",
      );
      await videoPage.waitForTimeout(2500);
      await videoPage
        .getByRole("button", { name: "Retry same request" })
        .click();
      await expect(
        videoPage.getByRole("button", { name: "Restart scenario" }),
      ).toBeEnabled();
      await expect(videoPage.locator(".takeaway")).toContainText(
        "2 sends, 1 saved request",
      );
      await videoPage.waitForTimeout(2500);
      const video = videoPage.video();
      await context.close();
      await video.saveAs(`${output}/request-reply.webm`);
      await promisify(execFile)("ffmpeg", [
        "-y",
        "-i",
        `${output}/request-reply.webm`,
        "-vf",
        "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        "-loop",
        "0",
        `${output}/request-reply.gif`,
      ]);
      await copyFile(
        `${output}/request-reply.webm`,
        "test-results/visual-recording/request-reply.webm",
      );
      await rm(`${output}/request-reply.webm`);
      recording = {
        file: "request-reply.gif",
        sourceRevision,
        sourceTag,
        capturedAt: new Date().toISOString(),
        ffmpeg: execFileSync("ffmpeg", ["-version"], {
          encoding: "utf8",
        }).split("\n")[0],
        scenario: "lost",
        description:
          "Actual browser recording: lost reply after commit, then retry of the same request. Encoded at 12fps and 960px wide; playback speed preserved. Not a network timing measurement.",
      };
    } finally {
      await context.close();
    }
  }
  await writeFile(
    `${output}/manifest.json`,
    JSON.stringify(
      {
        sourceRevision,
        sourceTag,
        browser: `Chromium ${browser.version()}`,
        database: "PostgreSQL 17.6 in an isolated browser schema",
        reducedMotion:
          "Static PNGs disable decorative packets; optional recording retains normal motion.",
        captures,
        ...(recording ? { recording } : {}),
      },
      null,
      2,
    ) + "\n",
  );
});
