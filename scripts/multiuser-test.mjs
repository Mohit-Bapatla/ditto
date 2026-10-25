import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
const base = process.env.TEST_BASE_URL || "http://localhost:3102";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Regression tests require an isolated local test server.");
async function client(name) {
  const r = await fetch(base + "/api/state");
  const cookie = r.headers.get("set-cookie").split(";")[0];
  const c = {
    cookie,
    state: await r.json(),
    async call(path, body, status = 200) {
      const r = await fetch(base + path, {
        method: body ? "POST" : "GET",
        headers: { cookie, Origin: base, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await r.json();
      assert.equal(r.status, status, d.error || path);
      if (d.state) this.state = d.state;
      return d;
    },
    async act(body, status = 200) {
      return this.call("/api/action", body, status);
    },
    async refresh() {
      this.state = await this.call("/api/state");
    },
  };
  await c.act({ type: "profile", name, city: "Austin, TX" });
  assert.deepEqual(c.state.user.interests, []);
  return c;
}
const users = await Promise.all(
  ["Alex", "Jordan", "Maya", "Sam", "Outsider"].map(client),
);
const [a, b, c, d, x] = users;
assert.equal(new Set(users.map((u) => u.cookie)).size, 5);
const { id: cid } = await a.act({
  type: "circle",
  name: "Saturday Crew QA",
  description: "Independent test sessions",
  city: "Austin, TX",
  budget: 30,
});
let circle = a.state.circles.find((c) => c.id === cid);
const invite = circle.invite;
for (const u of [b, c, d]) await u.act({ type: "join", invite });
await b.act({ type: "join", invite });
await a.refresh();
circle = a.state.circles.find((c) => c.id === cid);
assert.equal(circle.members.length, 4);
await x.act({ type: "join", invite: randomUUID() }, 400);
await x.act(
  { type: "chat", circle: cid, text: "Intrusion", nonce: randomUUID() },
  400,
);
assert.ok(!x.state.circles.some((c) => c.id === cid));
const ideas = [];
for (const [i, title] of [
  "Korean BBQ",
  "Bowling",
  "Sunset picnic",
  "Arcade",
].entries())
  ideas.push(
    (
      await users[i].act({
        type: "idea",
        circle: cid,
        title,
        category: i === 0 ? "Food" : i === 2 ? "Outdoors" : "Games",
      })
    ).id,
  );
await a.act({ type: "round", circle: cid, threshold: "majority" });
await x.act({ type: "vote", circle: cid, idea: ideas[0], vote: true }, 400);
for (let ui = 0; ui < 4; ui++)
  for (let ii = 0; ii < 4; ii++) {
    await users[ui].act({
      type: "vote",
      circle: cid,
      idea: ideas[ii],
      vote: ui < [4, 3, 1, 0][ii],
      user: users[(ui + 1) % 4].state.user.id,
      yes: 999,
    });
    if (ui === 0 && ii === 0) {
      assert.equal(
        a.state.circles.find((c) => c.id === cid).ideas[0].yes,
        undefined,
      );
      await a.act(
        { type: "vote", circle: cid, idea: ideas[0], vote: true },
        400,
      );
    }
  }
await a.refresh();
circle = a.state.circles.find((c) => c.id === cid);
assert.equal(circle.round.complete, true);
assert.deepEqual(
  ideas.map((id) => circle.ideas.find((i) => i.id === id).yes),
  [4, 3, 1, 0],
);
assert.equal(circle.ideas.filter((i) => i.unanimous).length, 1);
assert.equal(circle.ideas.filter((i) => i.matched).length, 2);
const texts = [
  "Anyone down for volleyball Saturday?",
  "I'm down.",
  "I can't until 5.",
  "Works for me.",
];
await Promise.all(
  users.slice(0, 4).map((u, i) =>
    u.act({
      type: "chat",
      circle: cid,
      text: texts[i],
      nonce: randomUUID(),
      user: x.state.user.id,
    }),
  ),
);
const nonce = randomUUID();
await a.act({ type: "chat", circle: cid, text: "Under $30 please.", nonce });
await a.act({ type: "chat", circle: cid, text: "Under $30 please.", nonce });
await a.refresh();
circle = a.state.circles.find((c) => c.id === cid);
assert.equal(circle.messages.length, 5);
assert.equal(new Set(circle.messages.slice(0, 4).map((m) => m.user)).size, 4);
assert.deepEqual(
  circle.messages.map((m) => m.sequence),
  circle.messages.map((m) => m.sequence).sort((a, b) => a - b),
);
for (let i = 0; i < 4; i++)
  assert.equal(
    circle.messages.find((m) => m.text === texts[i]).user,
    users[i].state.user.id,
  );
await a.act({ type: "chat", circle: cid, text: " ", nonce: randomUUID() }, 400);
await a.act(
  { type: "chat", circle: cid, text: "x".repeat(1001), nonce: randomUUID() },
  400,
);
await d.act({
  type: "constraints",
  circle: cid,
  text: "After 5 PM, under $30.",
});
const messageIds = circle.messages.map((m) => m.id);
await x.call(
  "/api/coordination",
  { circle: cid, kind: "proposal", demo: true, consent: true, messageIds },
  400,
);
await a.call(
  "/api/coordination",
  { circle: cid, kind: "proposal", demo: true, consent: false, messageIds },
  400,
);
const { proposal } = await a.call("/api/coordination", {
  circle: cid,
  kind: "proposal",
  demo: true,
  consent: true,
  messageIds,
});
assert.equal(proposal.source, "demo");
const added = await b.act({
  type: "acceptProposal",
  proposal: proposal.id,
  title: proposal.title,
  category: proposal.category,
});
const repeated = await b.act({
  type: "acceptProposal",
  proposal: proposal.id,
  title: proposal.title,
  category: proposal.category,
});
assert.equal(added.id, repeated.id);
const synthesis = await a.call("/api/coordination", {
  circle: cid,
  kind: "synthesis",
  demo: true,
  consent: true,
});
assert.equal(synthesis.facts.consensus[0].yes, 4);
assert.equal(synthesis.facts.constraints.length, 1);
const start = new Date(Date.now() + 86400000).toISOString();
const { plan } = await a.call("/api/plan", {
  circle: cid,
  start,
  demo: true,
  template: "dinner",
  ideaIds: ideas.slice(0, 2),
});
assert.equal(plan.stops.length, 2);
assert.ok(plan.why.some((t) => t.includes("3 of 4")));
await a.act({ type: "rsvp", plan: plan.id, going: true }, 400);
await x.act({ type: "approve", plan: plan.id }, 400);
for (const u of users.slice(0, 3))
  await u.act({ type: "approve", plan: plan.id });
await a.refresh();
assert.equal(
  a.state.circles.find((c) => c.id === cid).plans[0].status,
  "proposed",
);
await d.act({ type: "approve", plan: plan.id });
await a.act({ type: "rsvp", plan: plan.id, going: true });
await b.act({
  type: "editPlan",
  plan: plan.id,
  revision: 0,
  title: "Revised dinner and games",
  start,
  stops: plan.stops,
});
await a.refresh();
let p = a.state.circles.find((c) => c.id === cid).plans[0];
assert.equal(p.approvals.length, 0);
assert.equal(p.rsvps.length, 0);
assert.equal(p.revision, 1);
await a.act(
  {
    type: "editPlan",
    plan: plan.id,
    revision: 0,
    title: "Stale edit",
    start,
    stops: plan.stops,
  },
  400,
);
for (const u of users.slice(0, 4))
  await u.act({ type: "approve", plan: plan.id });
await Promise.all(
  users
    .slice(0, 4)
    .map((u) => u.act({ type: "rsvp", plan: plan.id, going: true })),
);
let response = await fetch(base + "/api/calendar?id=" + plan.id, {
  headers: { cookie: a.cookie },
});
assert.equal(response.status, 200);
const ics = await response.text();
assert.match(ics, /BEGIN:VCALENDAR/);
assert.match(ics, /DTSTART:/);
assert.match(ics, /Revised dinner/);
response = await fetch(base + "/api/calendar?id=" + plan.id, {
  headers: { cookie: x.cookie },
});
assert.equal(response.status, 400);
await a.act({ type: "unapprove", plan: plan.id });
await a.refresh();
p = a.state.circles.find((c) => c.id === cid).plans[0];
assert.equal(p.status, "proposed");
assert.equal(p.rsvps.length, 0);
// New round includes the accepted chat proposal; no consensus is fabricated.
await a.act({ type: "round", circle: cid, threshold: "everyone" });
await a.refresh();
const roundIdeas = a.state.circles.find((c) => c.id === cid).round.ideaIds;
for (const u of users.slice(0, 4))
  for (const idea of roundIdeas)
    await u.act({ type: "vote", circle: cid, idea, vote: idea === added.id });
await d.refresh();
assert.deepEqual(
  d.state.circles
    .find((c) => c.id === cid)
    .ideas.filter((i) => i.matched)
    .map((i) => i.id),
  [added.id],
);
await a.act({ type: "round", circle: cid, threshold: "everyone" });
for (const u of users.slice(0, 4))
  for (const idea of roundIdeas)
    await u.act({ type: "vote", circle: cid, idea, vote: false });
await a.refresh();
assert.equal(
  a.state.circles.find((c) => c.id === cid).ideas.filter((i) => i.matched)
    .length,
  0,
);
const event = {
  type: "activity",
  nonce: randomUUID(),
  title: "Public bowling QA",
  description: "Bring socks and confirm the venue.",
  category: "Games",
  venue: "Venue to be decided",
  city: "Austin, TX",
  start,
  capacity: 2,
  budget: 20,
};
const ev = await a.act(event);
assert.equal((await a.act(event)).id, ev.id);
await b.refresh();
assert.ok(b.state.activities.some((a) => a.id === ev.id));
await b.act({ type: "swipe", activity: ev.id, direction: "yes" });
assert.equal(b.state.activities.find((a) => a.id === ev.id).attending, 0);
await c.act({ type: "swipe", activity: ev.id, direction: "no" });
const joins = await Promise.all(
  [b, c, d].map((u) =>
    fetch(base + "/api/action", {
      method: "POST",
      headers: {
        cookie: u.cookie,
        Origin: base,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "attend", activity: ev.id }),
    }),
  ),
);
assert.equal(joins.filter((r) => r.status === 200).length, 2);
await a.refresh();
assert.equal(a.state.activities.find((a) => a.id === ev.id).attending, 2);
await b.act({ type: "cancelActivity", activity: ev.id }, 400);
const edit = {
  type: "editActivity",
  activity: ev.id,
  title: event.title,
  description: event.description,
  venue: event.venue,
  start,
  capacity: 3,
};
await b.act(edit, 400);
await a.act(edit);
for (const u of [b, c, d])
  await u.act({ type: "attend", activity: ev.id, withdraw: true });
await a.act({ type: "cancelActivity", activity: ev.id });
await b.act({ type: "attend", activity: ev.id }, 400);
for (const invalid of [
  { start: "2020-01-01T00:00:00Z" },
  { title: "" },
  { description: "x".repeat(1001) },
  { venue: "x".repeat(201) },
])
  await a.act({ ...event, nonce: randomUUID(), ...invalid }, 400);
await a.refresh();
assert.equal(a.state.activities.find((a) => a.id === ev.id).cancelled, true);
// The legacy pass-only endpoint is constrained; the new operation-based undo handles either direction.
const undoActivity = (
  await a.act({ ...event, nonce: randomUUID(), title: "Undo acceptance" })
).id;
await b.act({ type: "swipe", activity: undoActivity, direction: "no" });
await b.act({ type: "undoPass", activity: undoActivity });
await b.refresh();
assert.equal(
  b.state.activities.find((x) => x.id === undoActivity).swipe,
  undefined,
);
await b.act({ type: "swipe", activity: undoActivity, direction: "yes" });
await b.act({ type: "undoPass", activity: undoActivity }, 400);
await b.refresh();
assert.equal(
  b.state.activities.find((x) => x.id === undoActivity).status,
  "interested",
);
await a.act(
  { ...event, nonce: randomUUID(), venueId: "forged-selection" },
  400,
);
if (process.env.TEST_SAVE_USERS) {
  mkdirSync("test-results", { recursive: true });
  writeFileSync(
    process.env.TEST_SAVE_USERS,
    JSON.stringify({
      base,
      circle: cid,
      users: users.slice(0, 4).map((u) => ({
        cookie: u.cookie,
        id: u.state.user.id,
        name: u.state.user.name,
      })),
      plan: plan.id,
    }),
    { mode: 0o600 },
  );
}
console.log(
  "PASS: four independent users; onboarding, invites, chat order/authorship/privacy/idempotency, exact 4/3/1/0 votes, private reveal, constraints, fixture Autopilot → idea → unanimous match, template planning, revisions/reapproval, RSVP/calendar authorization, public activities, owner controls, concurrent capacity and validation. No live provider calls.",
);
