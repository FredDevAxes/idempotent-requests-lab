import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = "http://127.0.0.1:3100";
assert.equal(
  (await (await fetch(`${base}/config`)).json()).demoEnabled,
  true,
  "Start with LOCAL_DEMO=true",
);
const key = randomUUID();
const body = {
  site: "Fictional CLI workshop",
  description: "Inspect the demonstration pump",
  priority: "routine",
};
const send = (extra = {}) =>
  fetch(`${base}/interventions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      ...extra,
    },
    body: JSON.stringify(body),
  });
await assert.rejects(send({ "X-Lab-Fault": "drop-response" }));
const saved = (await (await fetch(`${base}/interventions`)).json()).requests;
const response = await send();
assert.equal(response.status, 201);
const result = await response.json();
assert.ok(saved.some((request) => request.id === result.request.id));
const replay = await send();
assert.equal(replay.status, 201);
assert.deepEqual(await replay.json(), result);
console.log(
  JSON.stringify(
    {
      key,
      requestId: result.request.id,
      lostResponse: true,
      persistedBeforeRetry: true,
      replayStatus: 201,
    },
    null,
    2,
  ),
);
