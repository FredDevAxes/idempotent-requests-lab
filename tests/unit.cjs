const { test } = require("node:test");
const assert = require("node:assert/strict");
const { interventionSchema, keySchema } = require("../packages/contracts");
test("canonical inputs collapse whitespace and normalize Unicode", () => {
  assert.deepEqual(
    interventionSchema.parse({
      site: "  Cafe\u0301  station ",
      description: " Inspect  the pump ",
      priority: "routine",
    }),
    {
      site: "Café station",
      description: "Inspect the pump",
      priority: "routine",
    },
  );
});
test("invalid payloads and keys are rejected", () => {
  for (const value of [
    null,
    {},
    { site: "ab", description: "short", priority: "routine", extra: true },
  ])
    assert.equal(interventionSchema.safeParse(value).success, false);
  for (const key of ["", "arbitrary", "00000000-0000-0000-0000-000000000000"])
    assert.equal(keySchema.safeParse(key).success, false);
});
