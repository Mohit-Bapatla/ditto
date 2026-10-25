import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
const base = process.env.TEST_BASE_URL || "http://localhost:3102";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error(
    "Run regression tests against an isolated local database; use the opt-in live smoke for public acceptance.",
  );
const origin = process.env.TEST_ORIGIN || new URL(base).origin;
async function client() {
  const res = await fetch(base + "/api/state");
  assert.equal(res.status, 200);
  let state = await res.json();
  const header = res.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  if (base.startsWith("https:") || process.env.EXPECT_SECURE_COOKIE === "true")
    assert.match(header, /; Secure/i);
  assert.match(res.headers.get("cache-control"), /no-store/);
  const cookie = header.split(";")[0];
  return {
    cookie,
    get state() {
      return state;
    },
    async call(path, body, expected = 200) {
      const r = await fetch(base + path, {
        method: body ? "POST" : "GET",
        headers: {
          cookie,
          ...(body
            ? { "Content-Type": "application/json", Origin: origin }
            : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      assert.equal(r.status, expected, data.error || "Unexpected HTTP status");
      if (data.state) state = data.state;
      return data;
    },
    async raw(path) {
      return fetch(base + path, { headers: { cookie } });
    },
  };
}
const a = await client(),
  b = await client();
let circle = a.state.circles[0];
assert.notEqual(circle.id, b.state.circles[0].id);
await b.call("/api/action", { type: "switch", user: a.state.user.id }, 400);
await b.call(
  "/api/action",
  { type: "round", circle: circle.id, threshold: "everyone" },
  400,
);
const activity = a.state.activities.find(
  (a) => a.demo && !a.cancelled && !a.expired,
);
assert.ok(activity);
await a.call("/api/action", {
  type: "swipe",
  activity: activity.id,
  direction: "yes",
});
assert.equal(
  a.state.activities.find((i) => i.id === activity.id).status,
  "interested",
);
await a.call("/api/action", { type: "attend", activity: activity.id });
assert.equal(a.state.activities.find((i) => i.id === activity.id).attending, 1);
await a.call("/api/action", {
  type: "round",
  circle: circle.id,
  threshold: "everyone",
});
for (const [mi, member] of circle.members.entries()) {
  await a.call("/api/action", { type: "switch", user: member.id });
  for (const [i, idea] of circle.ideas.entries()) {
    await a.call("/api/action", {
      type: "vote",
      circle: circle.id,
      idea: idea.id,
      vote: i < 2 || mi === 0,
    });
    if (mi === 0 && i === 0) {
      assert.equal(a.state.circles[0].ideas[0].yes, undefined);
      await a.call(
        "/api/action",
        { type: "vote", circle: circle.id, idea: idea.id, vote: true },
        400,
      );
    }
  }
}
circle = a.state.circles[0];
assert.equal(circle.round.complete, true);
assert.equal(circle.ideas.filter((i) => i.matched).length, 2);
const { plan } = await a.call("/api/plan", {
  circle: circle.id,
  start: new Date(Date.now() + 86400000).toISOString(),
  demo: true,
});
assert.equal(plan.source, "demo");
assert.equal((await a.raw("/api/calendar?id=" + plan.id)).status, 400);
for (const member of circle.members) {
  await a.call("/api/action", { type: "switch", user: member.id });
  await a.call("/api/action", { type: "approve", plan: plan.id });
}
assert.equal(a.state.circles[0].plans[0].status, "confirmed");
await a.call("/api/action", { type: "rsvp", plan: plan.id, going: true });
const cal = await a.raw("/api/calendar?id=" + plan.id);
assert.equal(cal.status, 200);
assert.match(await cal.text(), /BEGIN:VCALENDAR/);
assert.equal((await b.raw("/api/calendar?id=" + plan.id)).status, 400);
for (const [client, name] of [
  [a, "Test Taylor"],
  [b, "Test Riley"],
])
  await client.call("/api/action", {
    type: "profile",
    name,
    avatar: "🌵",
    city: "Austin, TX",
    interests: ["Food"],
    budget: 40,
  });
const created = await a.call("/api/action", {
  type: "circle",
  name: "Integration test Circle",
  description: "Two independent browser sessions",
  city: "Austin, TX",
  budget: 40,
});
const shared = a.state.circles.find((c) => c.id === created.id);
await b.call("/api/action", { type: "join", invite: shared.invite });
assert.ok(b.state.circles.some((c) => c.id === shared.id));
await a.call("/api/action", {
  type: "idea",
  circle: shared.id,
  title: "Dinner",
  category: "Food",
});
await a.call("/api/action", {
  type: "round",
  circle: shared.id,
  threshold: "everyone",
});
const idea = a.state.circles.find((c) => c.id === shared.id).ideas[0];
await a.call("/api/action", {
  type: "vote",
  circle: shared.id,
  idea: idea.id,
  vote: true,
});
await b.call("/api/action", {
  type: "vote",
  circle: shared.id,
  idea: idea.id,
  vote: true,
});
assert.equal(
  b.state.circles.find((c) => c.id === shared.id).ideas[0].unanimous,
  true,
);
console.log(
  "PASS: isolated sessions, permissions, persisted interest/attendance, independent private votes, duplicate rejection, match reveal, plan approval, RSVP, ICS authorization, personal profiles, cross-session invites and collaborative voting.",
);

const csrf = await fetch(base + "/api/action", {
  method: "POST",
  headers: {
    cookie: a.cookie,
    "Content-Type": "application/json",
    Origin: "https://invalid.example",
  },
  body: JSON.stringify({ type: "resetDeck" }),
});
assert.equal(csrf.status, 400);
const health = await fetch(base + "/api/health");
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: "ok" });
for (const path of [
  "/.env",
  "/.env.local",
  "/data/ditto.sqlite",
  "/database/schema.sql",
])
  assert.equal((await fetch(base + path)).status, 404);
if (process.env.TEST_SESSION_SNAPSHOT) {
  const path = process.env.TEST_SESSION_SNAPSHOT;
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(
    path,
    JSON.stringify({
      base,
      users: [
        { cookie: a.cookie, id: a.state.user.id },
        { cookie: b.cookie, id: b.state.user.id },
      ],
      circle: shared.id,
      idea: idea.id,
    }),
    { mode: 0o600 },
  );
  console.log(
    "Saved private restart verification snapshot (cookies not printed).",
  );
}
console.log(
  "PASS: cookie flags, no-store state, health, cross-origin rejection, and sensitive file URL checks.",
);
