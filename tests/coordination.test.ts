import test from "node:test";
import assert from "node:assert/strict";
import {
  fixtureProposal,
  validateProposal,
  groupFacts,
  synthesize,
} from "../lib/coordination";
import type { Circle, ChatMessage } from "../lib/types";
const messages: ChatMessage[] = [
  {
    id: "m1",
    sequence: 1,
    user: "alex",
    name: "Alex",
    avatar: "A",
    text: "Anyone down for volleyball Saturday?",
    createdAt: "2026-10-25T01:00:00Z",
  },
  {
    id: "m2",
    sequence: 2,
    user: "maya",
    name: "Maya",
    avatar: "M",
    text: "I can't until 5.",
    createdAt: "2026-10-25T01:01:00Z",
  },
];
test("sample extraction cites actual selected evidence and does not invent attendees", () => {
  const p = fixtureProposal(messages);
  assert.equal(p.title, "Saturday volleyball");
  assert.match(p.timing, /after 5/);
  assert.equal(p.evidence.length, 2);
  assert.ok(!("attendees" in p));
  assert.throws(() => fixtureProposal([]));
  assert.throws(() =>
    validateProposal(
      { ...p, evidence: [{ messageId: "m1", quote: "Everyone agrees" }] },
      messages,
    ),
  );
  assert.throws(() =>
    validateProposal(
      {
        ...p,
        evidence: [{ messageId: "another-circle", quote: messages[0].text }],
      },
      messages,
    ),
  );
});
const c = {
  city: "Austin",
  budget: 25,
  members: [],
  constraints: [],
  round: { complete: true, total: 4, ideaIds: ["a", "b", "c", "d"] },
  ideas: [
    { id: "a", title: "Dinner", yes: 4, unanimous: true, matched: true },
    { id: "b", title: "Bowling", yes: 3, matched: true },
    { id: "c", title: "Hike", yes: 1 },
    { id: "d", title: "Arcade", yes: 0 },
  ],
} as unknown as Circle;
test("group intelligence distinguishes unanimous, majority, minority and no support", () => {
  assert.deepEqual(
    groupFacts(c).consensus.map((i) => i.kind),
    ["unanimous", "majority", "minority", "no support"],
  );
  assert.equal(
    groupFacts({ ...c, round: { ...c.round!, complete: false } }).consensus
      .length,
    0,
  );
});
test("synthesis orchestration accepts only actual idea IDs and never changes votes", async () => {
  const before = JSON.stringify(c);
  const out = await synthesize(c, async (prompt, context) => {
    assert.match(prompt, /untrusted/);
    assert.ok(context);
    return {
      suggestions: [
        {
          ideaIds: ["a", "b"],
          rationale: "Dinner then bowling",
          tradeoff: "One member did not support bowling",
        },
      ],
      unresolved: ["Confirm availability"],
    };
  });
  assert.equal(out.suggestions.length, 1);
  assert.equal(JSON.stringify(c), before);
  await assert.rejects(
    synthesize(c, async () => ({
      suggestions: [{ ideaIds: ["invented"], rationale: "x", tradeoff: "" }],
      unresolved: [],
    })),
    /unknown idea/,
  );
});
