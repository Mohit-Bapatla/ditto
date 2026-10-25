import test from "node:test";
import assert from "node:assert/strict";
import { livePlan, type PlanningProviders } from "../lib/planning";
import type { Circle, Idea, Venue } from "../lib/types";
const v: Venue = {
  id: "fixture-place",
  name: "Fixture only bowling",
  address: "Fixture address — not a real recommendation",
  url: "https://example.com",
  source: "fixture",
};
const c = {
  members: [{ name: "Sam", interests: ["Games"], budget: 25 }],
  budget: 25,
  city: "Austin",
  round: { total: 4 },
  constraints: [{ user: "sam", text: "After 5" }],
} as Circle;
const ideas = [
  { id: "i", title: "Bowling", yes: 3, unanimous: false },
] as Idea[];
const deps: PlanningProviders = {
  venues: async () => [v],
  directions: async () => null,
  modelJSON: async (_prompt, context) => {
    assert.equal((context as { matches: { yes: number }[] }).matches[0].yes, 3);
    return {
      title: "Fixture outing",
      explanation:
        "Three of four liked bowling; confirm the fourth member agrees.",
      stops: [
        { venueId: v.id, title: "Bowling", duration: 60, note: "Check cost" },
      ],
    };
  },
};
test("itinerary orchestration uses actual majority votes and only provider venues", async () => {
  const p = await livePlan(c, ideas, "2026-10-26T00:00:00Z", "flexible", deps);
  assert.equal(p.stops[0].venue?.id, v.id);
  assert.equal(p.stops[0].drive, undefined);
  assert.match(p.explanation, /Three of four/);
});
test("empty venues, hallucinated IDs, invalid durations and unfilled template fail safely", async () => {
  await assert.rejects(
    livePlan(c, ideas, "x", "flexible", { ...deps, venues: async () => [] }),
    /No verified venues/,
  );
  await assert.rejects(
    livePlan(c, ideas, "x", "dinner", deps),
    /both template/,
  );
  await assert.rejects(
    livePlan(c, ideas, "x", "flexible", {
      ...deps,
      modelJSON: async () => ({
        title: "x",
        explanation: "x",
        stops: [{ venueId: "invented", title: "x", duration: 60, note: "" }],
      }),
    }),
    /unverified/,
  );
});
