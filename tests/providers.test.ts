import test from "node:test";
import assert from "node:assert/strict";
import {
  venues,
  directions,
  modelJSON,
  normalizeVenue,
} from "../lib/providers";
const original = globalThis.fetch;
test.afterEach(() => {
  globalThis.fetch = original;
  process.env.ALLOW_LIVE_PROVIDERS = "false";
});
function setup(body: unknown, status = 200) {
  process.env.ALLOW_LIVE_PROVIDERS = "true";
  process.env.SERPAPI_API_KEY = "fixture-key";
  process.env.MODEL_API_KEY = "fixture-key";
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status });
}
test("disabled adapters cannot send requests, even with credentials", async () => {
  process.env.ALLOW_LIVE_PROVIDERS = "false";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("forbidden");
  };
  await assert.rejects(venues("x", "y"), /paused/);
  await assert.rejects(modelJSON("x", {}), /paused/);
  assert.equal(calls, 0);
});
test("venue fixtures preserve optional fields and hours", async () => {
  setup({
    local_results: [
      {
        place_id: "fixture-venue",
        title: "Fixture Bowling",
        hours: "Closes 10 PM",
        price: "$$",
      },
      { data_id: "fixture-park", title: "Fixture Park" },
      { title: "invalid" },
    ],
  });
  const v = await venues("fixture-valid", "Austin");
  assert.equal(v.length, 2);
  assert.equal(v[0].hours, "Closes 10 PM");
  assert.equal(v[1].latitude, undefined);
  assert.equal(v[1].image, undefined);
  assert.equal(v[1].rating, undefined);
  assert.equal(normalizeVenue({ place_id: "bad", title: 42 }), null);
});
test("empty and invalid place response does not invent venues", async () => {
  setup({ local_results: [] });
  assert.deepEqual(await venues("fixture-empty", "Austin"), []);
  setup({ local_results: "invalid" });
  assert.deepEqual(await venues("fixture-invalid", "Austin"), []);
});
test("provider quota and connection errors are actionable and do not expose credentials", async () => {
  setup({}, 429);
  await assert.rejects(venues("fixture-quota", "Austin"), /unavailable|quota/);
  setup({});
  globalThis.fetch = async () => {
    throw Error("secret network internals");
  };
  await assert.rejects(
    venues("fixture-timeout", "Austin"),
    /timed out or could not connect/,
  );
});
test("directions use returned duration and distance only", async () => {
  setup({
    directions: [
      {
        formatted_duration: "12 min",
        formatted_distance: "3 mi",
        duration: 720,
      },
    ],
  });
  assert.deepEqual(await directions("fixture-a", "fixture-b"), {
    duration: "12 min",
    distance: "3 mi",
    seconds: 720,
  });
  setup({ directions: [{ distance: 12 }] });
  assert.equal(await directions("fixture-c", "fixture-d"), null);
});
test("Muse adapter validates model access and JSON, and does not retry billing", async () => {
  setup({});
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    return new Response(
      JSON.stringify(
        String(url).endsWith("/models")
          ? { data: [{ id: "muse-spark-1.3" }] }
          : {
              choices: [{ message: { content: '{"ok":true}' } }],
              usage: { prompt_tokens: 10, completion_tokens: 10 },
            },
      ),
    );
  };
  assert.deepEqual(await modelJSON("fixture", {}), { ok: true });
  assert.equal(calls, 2);
  calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response("{}", { status: 402 });
  };
  await assert.rejects(modelJSON("fixture", {}), /credits/);
  assert.equal(calls, 1);
  globalThis.fetch = async () =>
    new Response('{"choices":[{"message":{"content":"not JSON"}}]}');
  await assert.rejects(modelJSON("fixture", {}), /invalid JSON/);
});
