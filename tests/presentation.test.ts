import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  presentationActivities,
  presentationEnabled,
} from "../lib/presentation-fixtures";

test("presentation fixtures require explicit isolated local storage", () => {
  assert.equal(presentationEnabled({}, "/tmp/production.sqlite"), false);
  assert.throws(() =>
    presentationEnabled(
      { DITTO_PRESENTATION_FIXTURES: "1" },
      "/tmp/production.sqlite",
    ),
  );
  assert.throws(() =>
    presentationEnabled(
      {
        DITTO_PRESENTATION_FIXTURES: "1",
        RAILWAY_ENVIRONMENT_ID: "production",
      },
      "/tmp/ditto-presentation.sqlite",
    ),
  );
  assert.throws(() =>
    presentationEnabled(
      {
        DITTO_PRESENTATION_FIXTURES: "1",
        PUBLIC_ORIGIN: "https://example.com",
      },
      "/tmp/ditto-presentation.sqlite",
    ),
  );
  assert.equal(
    presentationEnabled(
      { DITTO_PRESENTATION_FIXTURES: "1" },
      "/tmp/ditto-presentation.sqlite",
    ),
    true,
  );
  assert.equal(presentationActivities.length, 36);
});

test("presentation sessions preserve privacy, persistence and honest commitments", async () => {
  process.env.DATABASE_PATH = join(
    mkdtempSync(join(tmpdir(), "ditto-fixtures-")),
    "ditto-presentation.sqlite",
  );
  process.env.DITTO_PRESENTATION_FIXTURES = "1";
  const db = await import("../lib/db");
  const first = db.createSession(),
    second = db.createSession();
  const a = db.state(first),
    b = db.state(second);
  assert.deepEqual(
    a.demoUsers.map((p) => p.name),
    ["Mohit", "Edwin", "Paxton"],
  );
  assert.equal(a.activities.length, 36);
  assert.equal(a.circles.length, 4);
  assert.deepEqual(
    a.activities.map((a) => a.title),
    b.activities.map((a) => a.title),
  );
  assert.ok(
    a.activities.every(
      (activity) =>
        activity.demo && activity.fixture && activity.attending === 0,
    ),
  );
  assert.ok(
    a.circles.every(
      (c) =>
        c.members.length === 3 &&
        c.round?.completed === 1 &&
        c.ideas.every((i) => i.yes === undefined),
    ),
  );
  const plans = a.circles.flatMap(c => c.plans);
  assert.equal(plans.length, 5);
  const confirmed = plans.filter(p => p.status === "confirmed");
  assert.equal(confirmed.length, 1);
  assert.equal(confirmed[0].title, "Pickleball doubles");
  assert.deepEqual(confirmed[0].approvals.slice().sort(), confirmed[0].eligible.slice().sort());
  assert.equal(confirmed[0].rsvps.length, 3);
  assert.ok(plans.every(p => Date.parse(p.start) > Date.now()));
  assert.deepEqual(db.state(first).circles.flatMap(c => c.plans).map(p => [p.id,p.start]), plans.map(p => [p.id,p.start]), "repeat reads must not duplicate or reschedule plans");
  const host = a.demoUsers[0];
  db.run("UPDATE profiles SET data=? WHERE id=?",JSON.stringify({...host,photo:"data:image/jpeg;base64,test"}),host.id);
  assert.ok(db.state(first).activities.filter(a => a.creator === host.id).every(a => a.hostPhoto === "data:image/jpeg;base64,test"));
  assert.ok(db.state(second).activities.every(a => !a.hostPhoto));
  assert.ok(
    !b.activities.some((activity) =>
      a.activities.some((a) => a.id === activity.id),
    ),
  );
  assert.throws(() => db.requireMember(second, a.circles[0].id));
  assert.throws(() => db.swipe(second, a.activities[0].id, "yes"));
  db.swipe(first, a.activities[0].id, "yes");
  assert.equal(
    db.state(db.session(first.id)!).activities[0].status,
    "interested",
  );
  assert.equal(db.state(second).activities[0].status, undefined);
  // Normal mode retains the existing default seed and cannot see owner-scoped fixtures.
  delete process.env.DITTO_PRESENTATION_FIXTURES;
  const normal = db.state(db.createSession());
  assert.equal(normal.activities.length, 6);
  assert.equal(normal.demoUsers.length, 4);
  assert.ok(normal.activities.every((a) => !a.fixture));
});
