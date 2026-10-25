import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
process.env.DATABASE_PATH = ":memory:";
process.env.DITTO_SHOWCASE = "0";
const db = await import("../lib/db");
const demo = await import("../lib/public-demo");
const { demoContext } = await import("../lib/demo-context");
test("consented sample photos repair existing demos without touching accounts or replacing photos", () => {
  const directory = mkdtempSync(join(tmpdir(), "ditto-demo-photos-"));
  const a = demo.startPublicDemo();
  const original = db.state(a.session);
  assert.ok(original.demoUsers.every(p => !p.photo));
  process.env.PUBLIC_DEMO_PHOTO_DIR = directory;
  try {
    writeFileSync(join(directory, "mohit.jpg"), "sample-jpeg");
    demo.demoSession(a.session.id);
    const repaired = db.state(a.session);
    assert.equal(repaired.demoUsers.find(p => p.name === "Mohit")?.photo, "data:image/jpeg;base64," + Buffer.from("sample-jpeg").toString("base64"));
    assert.ok(repaired.demoUsers.filter(p => p.name !== "Mohit").every(p => !p.photo));
    writeFileSync(join(directory, "mohit.jpg"), "replacement");
    demo.demoSession(a.session.id);
    assert.equal(db.state(a.session).user.photo, repaired.user.photo);
    assert.equal(db.state(a.session).activities.length, original.activities.length);
  } finally {
    delete process.env.PUBLIC_DEMO_PHOTO_DIR;
    rmSync(directory, {recursive:true,force:true});
  }
});
test("public demo namespaces, resets, expiry and durable budgets are isolated", () => {
  const a = demo.startPublicDemo(), b = demo.startPublicDemo();
  const first = db.state(a.session), other = db.state(b.session);
  assert.equal(first.activities.length,36); assert.equal(first.circles.length,4);
  assert.deepEqual(first.demoUsers.map(p=>p.name).sort(),["Edwin","Mohit","Paxton"]);
  assert.ok(first.circles.flatMap(c=>c.plans).every(p=>Date.parse(p.start)>Date.now()));
  assert.throws(()=>db.accessibleActivity(a.session,other.activities[0].id));
  assert.throws(()=>db.requireMember(a.session,other.circles[0].id));
  db.swipe(a.session,first.activities[0].id,"yes");
  assert.equal(db.state(b.session).activities[0].swipe,other.activities[0].swipe);
  demoContext.run(a,()=>demo.chargeDemoProvider());
  const usage=db.all("SELECT * FROM demo_usage WHERE key LIKE ?",`provider:${a.sandbox}:%`);
  const reset=demo.startPublicDemo(a,true);
  assert.equal(reset.sandbox,a.sandbox);assert.notEqual(reset.session.owner,a.session.owner);
  assert.equal(db.session(a.session.id),undefined);
  assert.equal(db.state(b.session).circles[0].id,other.circles[0].id);
  assert.deepEqual(db.all("SELECT * FROM demo_usage WHERE key LIKE ?",`provider:${a.sandbox}:%`),usage);
  assert.throws(()=>demoContext.run(a,()=>demo.chargeDemoProvider()),/expired/);
  const day=Math.floor(Date.now()/86400000);
  db.run("UPDATE demo_usage SET count=30 WHERE key=?",`provider:${reset.sandbox}:${day}`);
  assert.throws(()=>demoContext.run(reset,()=>demo.chargeDemoProvider()),/limit/);
  // Normal sessions cannot see any demo activity, even if its JSON is tampered non-demo.
  process.env.DITTO_DEMO_SEED="false";
  const real=db.createSession(); const item=db.state(reset.session).activities[0];
  db.run("UPDATE activities SET data=? WHERE id=?",JSON.stringify({...item,demo:false,visibility:"public"}),item.id);
  assert.throws(()=>db.accessibleActivity(real,item.id));
  assert.equal(db.state(real).activities.length,0);
  db.run("UPDATE demo_sandboxes SET expires_at=0 WHERE id=?",reset.sandbox);
  assert.equal(demo.demoSession(reset.session.id),undefined);
  demo.startPublicDemo();
  assert.equal(db.session(reset.session.id),undefined);
  assert.ok(db.session(real.id));assert.ok(db.session(b.session.id));
});
