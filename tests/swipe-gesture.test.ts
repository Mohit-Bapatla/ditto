import { test } from "node:test";
import assert from "node:assert/strict";
import { swipeDecision } from "../lib/swipe-gesture";
test("intent respects vertical scrolling, distance, velocity and minimum movement", () => {
  assert.equal(swipeDecision(20, 0, 15, 350), undefined);
  assert.equal(swipeDecision(95, 0, 700, 350), true);
  assert.equal(swipeDecision(-95, 0, 700, 350), false);
  assert.equal(swipeDecision(38, 2, 45, 350), true);
  assert.equal(swipeDecision(38, 2, 300, 350), undefined);
  assert.equal(swipeDecision(120, 180, 50, 350), undefined);
  assert.equal(swipeDecision(-110, 0, 800, 1440), false);
});
