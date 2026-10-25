// Explicit opt-in only. Creates its own fictional identities; never modifies other users' data.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
if (process.env.RUN_LIVE_SMOKE !== "true")
  throw Error(
    "Live smoke is disabled. Set RUN_LIVE_SMOKE=true only after explicit authorization.",
  );
const base = process.env.TEST_BASE_URL || "http://localhost:3102";
async function client(name) {
  const r = await fetch(base + "/api/state");
  const cookie = r.headers.get("set-cookie").split(";")[0];
  return {
    name,
    cookie,
    async call(path, body) {
      const start = Date.now();
      const r = await fetch(base + path, {
        method: body ? "POST" : "GET",
        headers: { cookie, Origin: base, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      assert.equal(r.status, 200, data.error || "Request failed");
      return { data, latencyMs: Date.now() - start };
    },
    async act(body) {
      return (await this.call("/api/action", body)).data;
    },
  };
}
const users = await Promise.all(["Alex", "Jordan", "Maya", "Sam"].map(client));
const [a, b, c, d] = users;
for (let i = 0; i < 4; i++)
  await users[i].act({
    type: "profile",
    name: users[i].name,
    city: "Austin, TX",
    interests: [
      ["Food", "Games"],
      ["Food"],
      ["Games", "Outdoors"],
      ["Food", "Sports"],
    ][i],
    budget: 30,
  });
const result = await a.act({
  type: "circle",
  name: "Saturday Crew · Live AI",
  description: "Fictional friends testing real group planning.",
  city: "Austin, TX",
  budget: 30,
});
const cid = result.id;
const invite = result.state.circles.find((c) => c.id === cid).invite;
for (const u of [b, c, d]) await u.act({ type: "join", invite });
const ids = [];
for (const [u, title, category] of [
  [a, "Korean BBQ", "Food"],
  [b, "Bowling", "Games"],
])
  ids.push((await u.act({ type: "idea", circle: cid, title, category })).id);
await d.act({
  type: "constraints",
  circle: cid,
  text: "Prefer under $30 per person. If dinner plus bowling costs more, flag it rather than claiming it fits.",
});
await c.act({
  type: "constraints",
  circle: cid,
  text: "Available after 5 PM; confirm the specific date with everyone.",
});
await a.act({ type: "round", circle: cid, threshold: "majority" });
for (let ui = 0; ui < 4; ui++)
  for (let i = 0; i < 2; i++)
    await users[ui].act({
      type: "vote",
      circle: cid,
      idea: ids[i],
      vote: i === 0 || ui < 3,
    });
const generated = await a.call("/api/plan", {
  circle: cid,
  start: new Date(Date.now() + 86400000).toISOString(),
  demo: false,
  template: "dinner",
  ideaIds: ids,
});
const p = generated.data.plan;
assert.equal(p.source, "meta");
assert.equal(p.stops.length, 2);
assert.ok(p.stops.every((s) => s.venue?.id && s.venue.source === "SerpApi"));
assert.ok(p.why.some((x) => x.includes("3 of 4")));
assert.equal(p.status, "proposed");
for (const u of users) await u.act({ type: "approve", plan: p.id });
for (const u of users) await u.act({ type: "rsvp", plan: p.id, going: true });
const refreshed = (await a.call("/api/state")).data;
const confirmed = refreshed.circles
  .find((c) => c.id === cid)
  .plans.find((x) => x.id === p.id);
assert.equal(confirmed.status, "confirmed");
assert.equal(confirmed.rsvps.length, 4);
const calendar = await fetch(base + "/api/calendar?id=" + p.id, {
  headers: { cookie: a.cookie },
});
assert.equal(calendar.status, 200);
assert.match(await calendar.text(), /BEGIN:VCALENDAR/);
console.log(
  JSON.stringify({
    test: "live planning through four approvals, four RSVPs and calendar",
    status: "PASS",
    latencyMs: generated.latencyMs,
    venueCount: p.stops.length,
    verifiedRoutes: p.stops.filter((s) => s.drive).length,
  }),
);
mkdirSync("test-results", { recursive: true });
writeFileSync(
  process.env.LIVE_SNAPSHOT || "test-results/live-sessions.json",
  JSON.stringify({
    base,
    circle: cid,
    plan: p.id,
    users: users.map((u) => ({ cookie: u.cookie, name: u.name })),
  }),
  { mode: 0o600 },
);

if (process.env.LIVE_EXTRA_FLOWS === "true") {
  for (const [u, text] of [
    [a, "We should play volleyball this weekend."],
    [b, "I'm down Saturday."],
    [c, "Saturday after 5 works."],
  ])
    await u.act({ type: "chat", circle: cid, text, nonce: randomUUID() });
  const state = (await a.call("/api/state")).data;
  const messageIds = state.circles
    .find((c) => c.id === cid)
    .messages.map((m) => m.id);
  const extracted = await a.call("/api/coordination", {
    circle: cid,
    kind: "proposal",
    demo: false,
    consent: true,
    messageIds,
  });
  assert.equal(extracted.data.proposal.source, "meta");
  assert.ok(extracted.data.proposal.evidence.length);
  await a.act({
    type: "acceptProposal",
    proposal: extracted.data.proposal.id,
    title: extracted.data.proposal.title,
    category: extracted.data.proposal.category,
  });
  console.log(
    JSON.stringify({
      test: "Muse Spark Social Autopilot extraction and human-approved idea",
      status: "PASS",
      latencyMs: extracted.latencyMs,
    }),
  );
  const discovery = await a.call("/api/places", {
    query:
      "Find something fun for four friends near UT Austin under $30, no alcohol.",
    city: "Austin, TX",
    natural: true,
  });
  assert.ok(discovery.data.venues.length);
  console.log(
    JSON.stringify({
      test: "Muse Spark intent + SerpApi discovery",
      status: "PASS",
      latencyMs: discovery.latencyMs,
      venues: discovery.data.venues.length,
    }),
  );
}
