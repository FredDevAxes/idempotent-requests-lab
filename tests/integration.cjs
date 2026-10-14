const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
process.env.DB_SCHEMA = `idempotency_lab_integration_${randomUUID().replaceAll("-", "")}`;
const { createPool, migrate, schema } = require("../apps/api/dist/database");
const { createApp } = require("../apps/api/dist/app");
const pools = [createPool(), createPool(), createPool()];
const apps = [],
  urls = [];
const payload = {
  site: "North workshop",
  description: "Inspect the fictional water pump",
  priority: "routine",
};
async function post(base, key, body = payload, extra = {}) {
  return fetch(`${base}/interventions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key === undefined ? {} : { "Idempotency-Key": key }),
      ...extra,
    },
    body: JSON.stringify(body),
  });
}
async function control(path, body = {}) {
  const response = await fetch(`${urls[0]}/demo/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 201);
  return response.json();
}
async function counts(requests, keys) {
  const result = await pools[2].query(
    "SELECT (SELECT count(*)::int FROM interventions) AS requests, (SELECT count(*)::int FROM idempotency_keys) AS keys",
  );
  assert.deepEqual(result.rows[0], { requests, keys });
}
async function until(check, label) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Condition not observed: ${label}`);
}
async function reached(id) {
  await until(
    async () =>
      (await (await fetch(`${urls[0]}/demo/gates/${id}`)).json()).reached,
    "gate arrival",
  );
}
before(async () => {
  await migrate(pools[0]);
  for (let i = 0; i < 3; i++) {
    const app = await createApp(pools[i], i < 2);
    await app.listen(0, "127.0.0.1");
    apps.push(app);
    urls.push(await app.getUrl());
  }
});
beforeEach(async () => {
  await control("reset", { confirm: "DELETE LAB DATA" });
});
after(async () => {
  for (const app of apps) await app.close();
  await pools[0].query(`DROP SCHEMA "${schema}" CASCADE`);
  for (const pool of pools) await pool.end();
});

test("health verifies PostgreSQL, normal creation and exact sequential replay", async () => {
  assert.equal(
    (await (await fetch(`${urls[0]}/health`)).json()).database,
    "connected",
  );
  const key = randomUUID();
  const first = await post(urls[0], key);
  const body = await first.json();
  assert.equal(first.status, 201);
  assert.ok(body.request.id);
  const replay = await post(urls[1], key, {
    priority: "routine",
    description: "  Inspect   the fictional water pump ",
    site: "North workshop",
  });
  assert.equal(replay.status, 201);
  assert.deepEqual(await replay.json(), body);
  await counts(1, 1);
});
for (const size of [2, 20])
  test(`${size} concurrent sends across two API instances and PostgreSQL connections create one row`, async () => {
    const key = randomUUID();
    const responses = await Promise.all(
      Array.from({ length: size }, (_, index) => post(urls[index % 2], key)),
    );
    const bodies = await Promise.all(
      responses.map((response) => response.json()),
    );
    assert.ok(responses.every((response) => response.status === 201));
    assert.ok(bodies.every((body) => body.request.id === bodies[0].request.id));
    for (const body of bodies) assert.deepEqual(body, bodies[0]);
    await counts(1, 1);
  });
test("sequential content conflict rejects without a duplicate", async () => {
  const key = randomUUID();
  await post(urls[0], key);
  const response = await post(urls[1], key, { ...payload, priority: "urgent" });
  assert.equal(response.status, 409);
  await counts(1, 1);
});
test("concurrent different content accepts exactly one winner", async () => {
  const key = randomUUID();
  const responses = await Promise.all([
    post(urls[0], key),
    post(urls[1], key, { ...payload, priority: "urgent" }),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );
  const body = await responses
    .find((response) => response.status === 201)
    .json();
  const stored = await pools[2].query("SELECT priority FROM interventions");
  assert.equal(stored.rows[0].priority, body.request.priority);
  await counts(1, 1);
});
test("identical data with distinct keys represents two intentions", async () => {
  await Promise.all([post(urls[0], randomUUID()), post(urls[1], randomUUID())]);
  await counts(2, 2);
});
test("missing/invalid key or payload creates nothing", async () => {
  for (const key of [undefined, "", "not-a-uuid"])
    assert.equal((await post(urls[0], key)).status, 400);
  for (const body of [
    {},
    { ...payload, extra: "unexpected" },
    { ...payload, priority: "unknown" },
    { ...payload, description: "x" },
  ])
    assert.equal((await post(urls[0], randomUUID(), body)).status, 400);
  await counts(0, 0);
});
test("pre-commit barrier hides both writes; injected failure rolls back and permits retry", async () => {
  const key = randomUUID();
  const { id } = await control("gates");
  const pending = post(urls[0], key, payload, {
    "X-Lab-Gate": id,
    "X-Lab-Fault": "fail-before-commit",
  });
  await reached(id);
  await counts(0, 0);
  await control(`gates/${id}/release`);
  assert.equal((await pending).status, 503);
  await counts(0, 0);
  assert.equal((await post(urls[1], key)).status, 201);
  await counts(1, 1);
});
test("commit then destroyed HTTP socket leaves durable success for retry", async () => {
  const key = randomUUID();
  await assert.rejects(
    post(urls[0], key, payload, { "X-Lab-Fault": "drop-response" }),
  );
  await counts(1, 1);
  const stored = (await pools[2].query("SELECT response FROM idempotency_keys"))
    .rows[0].response;
  const retry = await post(urls[1], key);
  assert.equal(retry.status, 201);
  assert.deepEqual(await retry.json(), stored);
  await counts(1, 1);
});
test("retention before 24h, explicit purge after 24h and key reuse", async () => {
  const key = randomUUID();
  const body = await (await post(urls[0], key)).json();
  await control("clock", { milliseconds: 23 * 3600000 });
  assert.equal((await control("purge")).purged, 0);
  assert.deepEqual(await (await post(urls[0], key)).json(), body);
  await control("clock", { milliseconds: 2 * 3600000 });
  assert.deepEqual(await (await post(urls[0], key)).json(), body);
  await counts(1, 1);
  assert.equal((await control("purge")).purged, 1);
  await counts(1, 0);
  const next = await (await post(urls[0], key)).json();
  assert.notEqual(next.request.id, body.request.id);
  await counts(2, 1);
});
test("observed lock wait expires with a retryable response then recovers", async () => {
  const key = randomUUID();
  const { id } = await control("gates");
  const first = post(urls[0], key, payload, { "X-Lab-Gate": id });
  await reached(id);
  const pending = post(urls[1], key);
  await until(
    async () =>
      (
        await pools[2].query(
          "SELECT count(*)::int AS n FROM pg_stat_activity WHERE application_name='idempotent-requests-lab' AND wait_event_type='Lock' AND query LIKE 'INSERT INTO idempotency_keys%'",
        )
      ).rows[0].n > 0,
    "database lock wait",
  );
  const busy = await pending;
  assert.equal(busy.status, 503);
  assert.equal(busy.headers.get("retry-after"), "1");
  await counts(0, 0);
  await control(`gates/${id}/release`);
  const accepted = await (await first).json();
  assert.deepEqual(await (await post(urls[1], key)).json(), accepted);
  await counts(1, 1);
});
test("default mode rejects every fault header and hides all demo controls", async () => {
  assert.equal(
    (await (await fetch(`${urls[2]}/config`)).json()).demoEnabled,
    false,
  );
  for (const path of [
    "reset",
    "purge",
    "clock",
    "gates",
    "gates/unknown/release",
  ])
    assert.equal(
      (
        await fetch(`${urls[2]}/demo/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: "DELETE LAB DATA", milliseconds: 1 }),
        })
      ).status,
      404,
    );
  assert.equal((await fetch(`${urls[2]}/demo/gates/unknown`)).status, 404);
  for (const header of ["X-Lab-Fault", "X-Lab-Gate", "X-Lab-Other"])
    assert.equal(
      (
        await post(urls[2], randomUUID(), payload, {
          [header]: "drop-response",
        })
      ).status,
      403,
    );
  await counts(0, 0);
});
test("reset requires an explicit confirmation and invalid controls write nothing", async () => {
  const response = await fetch(`${urls[0]}/demo/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 400);
  assert.equal(
    (await post(urls[0], randomUUID(), payload, { "X-Lab-Fault": "invalid" }))
      .status,
    400,
  );
  await counts(0, 0);
});
async function launch(env = {}) {
  const child = spawn(process.execPath, ["apps/api/dist/main.js"], {
    env: { ...process.env, API_PORT: "0", LOCAL_DEMO: "true", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = new Promise((resolve, reject) => {
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
      const match = output.match(/API ready (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) resolve(match[1]);
    });
    child.on("exit", (code) =>
      reject(new Error(`API exited before ready: ${code}`)),
    );
  });
  return { child, url: await ready };
}
async function stop(child) {
  child.kill("SIGTERM");
  await once(child, "exit");
}
test("API process restart recovers the committed response", async () => {
  let processApi = await launch();
  const key = randomUUID();
  try {
    const body = await (await post(processApi.url, key)).json();
    await stop(processApi.child);
    processApi = await launch();
    assert.deepEqual(await (await post(processApi.url, key)).json(), body);
    await counts(1, 1);
  } finally {
    await stop(processApi.child);
  }
});
test("production disables demo even with explicit local opt-in", async () => {
  const processApi = await launch({ NODE_ENV: "production" });
  try {
    assert.equal(
      (await (await fetch(`${processApi.url}/config`)).json()).demoEnabled,
      false,
    );
    assert.equal(
      (
        await post(processApi.url, randomUUID(), payload, {
          "X-Lab-Fault": "drop-response",
        })
      ).status,
      403,
    );
    await counts(0, 0);
  } finally {
    await stop(processApi.child);
  }
});
