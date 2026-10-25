import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "ditto-test-"));
process.env.DATABASE_PATH = join(dir, "test.sqlite");
const d = await import("../lib/db");
test.after(() => {
  d.db.close();
  rmSync(dir, { recursive: true, force: true });
});
test("swipes persist, repeat writes are idempotent, interest is not attendance", () => {
  const s = d.createSession();
  const aid = d.state(s).activities[0].id;
  d.transaction(() => {
    d.swipe(s, aid, "yes");
    d.swipe(s, aid, "yes");
  });
  assert.equal(d.state(s).activities[0].status, "interested");
  assert.equal(d.state(s).activities[0].attending, 0);
  assert.equal(
    d.all("SELECT * FROM swipes WHERE user_id=? AND activity_id=?", s.user, aid)
      .length,
    1,
  );
  assert.equal(d.state(d.session(s.id)!).activities[0].swipe, "yes");
});
test("cross-sandbox Circle and activity access are denied", () => {
  const a = d.createSession(),
    b = d.createSession();
  const state = d.state(a);
  assert.throws(() => d.requireMember(b, state.circles[0].id));
  assert.throws(() => d.accessibleActivity(b, state.activities[0].id));
  assert.ok(!d.state(b).circles.some((c) => c.id === state.circles[0].id));
});
test("independent votes stay private, duplicates rejected, unanimous results correct", () => {
  const s = d.createSession();
  const c = d.state(s).circles[0];
  d.transaction(() => d.startRound(s, c.id, "everyone"));
  d.transaction(() => d.vote(s, c.id, c.ideas[0].id, true));
  assert.throws(() =>
    d.transaction(() => d.vote(s, c.id, c.ideas[0].id, false)),
  );
  assert.equal(d.circleState(s, c.id).ideas[0].yes, undefined);
  const other = { ...s, user: c.members.find(m => m.id !== s.user)!.id };
  assert.equal(d.circleState(other, c.id).ideas[0].vote, undefined);
  for (const m of c.members)
    for (const [i, idea] of c.ideas.entries()) {
      if (m.id === s.user && i === 0) continue;
      d.transaction(() =>
        d.vote({ ...s, user: m.id }, c.id, idea.id, i < 2 || m.id === s.user),
      );
    }
  const result = d.circleState(s, c.id);
  assert.equal(result.round?.complete, true);
  assert.equal(result.ideas.filter((i) => i.unanimous).length, 2);
  assert.equal(result.ideas.filter((i) => i.matched).length, 2);
});
test("round freezes ideas and members; unfinished round cannot be replaced", () => {
  const s = d.createSession();
  const c = d.state(s).circles[0];
  d.transaction(() => d.startRound(s, c.id, "majority"));
  const extra = d.addIdea(s, c.id, "Late idea", "Food");
  assert.throws(() => d.transaction(() => d.vote(s, c.id, extra, true)));
  assert.throws(() => d.transaction(() => d.startRound(s, c.id, "everyone")));
  const outsider = d.createSession();
  d.run("INSERT INTO members VALUES(?,?)", c.id, outsider.user);
  assert.throws(() =>
    d.transaction(() =>
      d.vote({ ...s, user: outsider.user }, c.id, c.ideas[0].id, true),
    ),
  );
});
test("actual capacity check rejects overflow, repeated join and withdrawal are safe", () => {
  const s = d.createSession();
  const a = d.state(s).activities[0];
  a.capacity = 2;
  d.run("UPDATE activities SET data=? WHERE id=?", JSON.stringify(a), a.id);
  const members = d.state(s).circles[0].members.filter((m) => m.id !== s.user);
  d.transaction(() => d.attend(s, a.id));
  d.transaction(() => d.attend(s, a.id));
  d.transaction(() => d.attend({ ...s, user: members[0].id }, a.id));
  assert.throws(() =>
    d.transaction(() => d.attend({ ...s, user: members[1].id }, a.id)),
  );
  assert.equal(d.state(s).activities[0].attending, 2);
  d.transaction(() => d.attend(s, a.id, true));
  assert.equal(d.state(s).activities[0].attending, 1);
});

test("durable undo reverses either direction, supports opposite choices and idempotent retries", () => {
  const s = d.createSession(), aid = d.state(s).activities[0].id;
  assert.equal(d.state(s).undoSwipe, undefined);
  for (const direction of ["yes", "no", "yes"]) {
    const op = d.id();
    d.transaction(() => d.swipe(s, aid, direction, op));
    assert.equal(d.state(d.session(s.id)!).undoSwipe?.id, op);
    d.transaction(() => d.undoDecision(s, op));
    d.transaction(() => d.undoDecision(s, op));
    d.transaction(() => d.swipe(s, aid, direction, op)); // delayed original request
    const a = d.state(s).activities.find(a => a.id === aid)!;
    assert.equal(a.swipe, undefined);
    assert.equal(a.status, undefined);
  }
});
test("undo restores previous decision, enforces LIFO and protects changed attendance", () => {
  const s = d.createSession(), [a,b] = d.state(s).activities;
  d.transaction(() => d.swipe(s,a.id,"no"));
  const first = d.state(s).undoSwipe!;
  d.transaction(() => d.swipe(s,b.id,"yes"));
  const second = d.state(s).undoSwipe!;
  assert.throws(() => d.transaction(() => d.undoDecision(s,first.id)), /most recent/);
  const outsider = d.createSession();
  assert.throws(() => d.transaction(() => d.undoDecision(outsider,second.id)), /no longer available/);
  d.transaction(() => d.undoDecision(s,second.id));
  d.transaction(() => d.swipe(s,a.id,"yes"));
  d.transaction(() => d.undoDecision(s,d.state(s).undoSwipe!.id));
  assert.equal(d.state(s).activities.find(x=>x.id===a.id)?.swipe,"no");
  d.transaction(() => d.undoDecision(s,first.id));
  d.transaction(() => d.swipe(s,a.id,"yes"));
  const last = d.state(s).undoSwipe!;
  d.transaction(() => d.attend(s,a.id));
  assert.equal(d.state(s).undoSwipe,undefined);
  assert.throws(() => d.transaction(() => d.undoDecision(s,last.id)), /changed/);
  assert.equal(d.state(s).activities.find(x=>x.id===a.id)?.status,"attending");
});
test("history is bounded and finalized Circle decisions cannot be reversed", () => {
  const s = d.createSession(), a = d.state(s).activities[0];
  for(let i=0;i<45;i++) d.transaction(()=>d.swipe(s,a.id,i%2?"yes":"no"));
  assert.equal(d.all("SELECT * FROM decision_history WHERE user_id=?",s.user).length,40);
  const c = d.state(s).circles[0];
  d.transaction(()=>d.startRound(s,c.id,"everyone"));
  for(const m of c.members) for(const idea of c.ideas) d.transaction(()=>d.vote({...s,user:m.id},c.id,idea.id,true));
  assert.equal(d.circleState(s,c.id).round?.complete,true);
  const last=d.circleState(s,c.id).undoVote!;
  d.transaction(()=>d.undoDecision(s,last.id));
  assert.equal(d.circleState(s,c.id).round?.complete,false);
  assert.equal(d.circleState(s,c.id).ideas[0].matched,undefined);
  d.transaction(()=>d.vote(s,c.id,last.activity,false));
  const current=d.circleState(s,c.id), target=current.undoVote!;
  const plan={id:d.id(),circle:c.id,round:current.round!.id,status:"confirmed",eligible:c.members.map(m=>m.id),stops:[],start:new Date(Date.now()+86400000).toISOString()};
  d.run("INSERT INTO plans VALUES(?,?,?)",plan.id,c.id,JSON.stringify(plan));
  assert.throws(()=>d.transaction(()=>d.undoDecision(s,target.id)),/already has a plan/);
  assert.equal(d.circleState(s,c.id).undoVoteBlocked,true);
});
