import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const path = process.env.TEST_SESSION_SNAPSHOT;
if (!path)
  throw new Error(
    "Set TEST_SESSION_SNAPSHOT to the private snapshot produced by test:integration.",
  );
const saved = JSON.parse(readFileSync(path, "utf8"));
for (const user of saved.users) {
  const response = await fetch(saved.base + "/api/state", {
    headers: { cookie: user.cookie },
  });
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("set-cookie"),
    null,
    "Restart must not replace the saved session.",
  );
  const state = await response.json();
  assert.equal(state.user.id, user.id);
  const circle = state.circles.find((c) => c.id === saved.circle);
  assert.ok(circle);
  assert.equal(circle.members.length, 2);
  assert.equal(circle.round.complete, true);
  assert.equal(circle.ideas.find((i) => i.id === saved.idea).unanimous, true);
}
console.log(
  "PASS: both original sessions, shared membership, saved votes and unanimous match survived restart.",
);
