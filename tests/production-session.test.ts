import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "ditto-production-session-"));
process.env.DATABASE_PATH = join(dir, "test.sqlite");
Object.assign(process.env, { NODE_ENV: "production" });
delete process.env.DITTO_DEMO_SEED;
const d = await import("../lib/db");
test.after(() => { d.db.close(); rmSync(dir, { recursive: true, force: true }); });
test("production sessions do not seed fictional friends or plans and preserve existing data", () => {
  const a = d.createSession();
  const c = d.createCircle(a, "Existing real Circle", "Keep this", "Austin, TX", 20, false);
  const b = d.createSession();
  assert.equal(d.state(b).user.name, "You");
  assert.equal(d.state(b).circles.length, 0);
  assert.equal(d.all("SELECT * FROM profiles WHERE owner=?", b.owner).length, 1);
  assert.equal(d.all("SELECT * FROM activities WHERE owner=?", b.owner).length, 0);
  assert.ok(d.state(a).circles.some(x => x.id === c));
});
test("production demo content requires explicit opt-in", () => {
  process.env.DITTO_DEMO_SEED = "true";
  const s = d.createSession();
  assert.equal(d.all("SELECT * FROM profiles WHERE owner=?", s.owner).length, 4);
  assert.ok(d.state(s).activities.length > 0);
  delete process.env.DITTO_DEMO_SEED;
});
