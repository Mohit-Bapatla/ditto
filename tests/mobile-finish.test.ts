import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { normalizeProfilePhoto } from "../lib/profile-photo";
import { dayKey, shiftDay, weekDays, agendaTime } from "../lib/agenda";
import { WheelGesture, wheelPixels } from "../lib/wheel-gesture";

test("agenda uses Chicago dates across UTC midnight and DST boundaries", () => {
  assert.equal(dayKey("2026-10-26T01:00:00Z"), "2026-10-25");
  assert.equal(dayKey("2026-11-01T06:30:00Z"), "2026-11-01");
  assert.equal(dayKey("2026-11-01T07:30:00Z"), "2026-11-01");
  assert.equal(agendaTime("2026-11-01T07:30:00Z"), "1:30 AM");
  assert.deepEqual(weekDays("2026-11-01"), [
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]);
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDay("2028-02-28", 1), "2028-02-29");
});
test("wheel normalizes modes and preserves vertical scroll", () => {
  assert.deepEqual(wheelPixels(2, 1, 1, 360), { x: 32, y: 16 });
  assert.equal(wheelPixels(1, 0, 2, 360).x, 240);
  let moves = 0,
    finished = 0;
  const c = new WheelGesture(
    { lastEvent: -Infinity, quietUntil: 0 },
    () => 360,
    () => moves++,
    () => finished++,
  );
  assert.equal(c.input(5, 50, 0, 1000, true), false);
  assert.equal(moves, 0);
  assert.equal(finished, 0);
});
test("wheel tracks progressively and one burst commits only once across keyed cards", () => {
  const gate = { lastEvent: -Infinity, quietUntil: 0 };
  const moves: number[] = [],
    votes: (boolean | undefined)[] = [];
  const c = new WheelGesture(
    gate,
    () => 360,
    (x) => moves.push(x),
    (v) => votes.push(v),
  );
  c.input(40, 1, 0, 1000, true);
  c.input(50, 1, 0, 1020, true);
  assert.deepEqual(moves, [40, 90]);
  assert.deepEqual([...votes], [true], "threshold commits synchronously, before idle");
  c.end(1200);
  assert.deepEqual([...votes], [true]);
  const next = new WheelGesture(
    gate,
    () => 360,
    (x) => moves.push(x),
    (v) => votes.push(v),
  );
  for (let t = 1210; t < 1800; t += 20) next.input(25, 0, 0, t, true);
  next.end(2000);
  assert.deepEqual([...votes], [true]);
  next.input(-100, 0, 0, 2300, true);
  next.end(2480);
  assert.deepEqual([...votes], [true, false]);
});
test("wheel snapback, vertical interruption, disabled state and flick", () => {
  const votes: (boolean | undefined)[] = [];
  const gate = { lastEvent: -Infinity, quietUntil: 0 };
  const c = new WheelGesture(
    gate,
    () => 360,
    () => {},
    (v) => votes.push(v),
  );
  c.input(20, 0, 0, 1000, true);
  c.end(1180);
  assert.deepEqual([...votes], [undefined]);
  c.input(40, 0, 0, 1700, true);
  assert.equal(c.input(0, 40, 0, 1710, true), false);
  assert.deepEqual([...votes], [undefined, undefined]);
  c.input(100, 0, 0, 2200, false);
  c.end(2400);
  assert.equal(votes.length, 2);
  c.input(20, 0, 0, 2900, true);
  c.input(35, 0, 0, 2920, true);
  c.end(3080);
  assert.equal(votes[2], true);
});
test("profile photo strips metadata, resizes, rejects scripts and supports removal", async () => {
  const input = await sharp({
    create: { width: 500, height: 400, channels: 3, background: "#e11d48" },
  })
    .jpeg()
    .withMetadata()
    .toBuffer();
  const result = await normalizeProfilePhoto(
    "data:image/jpeg;base64," + input.toString("base64"),
  );
  assert.ok(result?.startsWith("data:image/jpeg;base64,"));
  const meta = await sharp(
    Buffer.from(result!.split(",")[1], "base64"),
  ).metadata();
  assert.equal(meta.width, 256);
  assert.equal(meta.height, 256);
  assert.equal(meta.exif, undefined);
  assert.equal(await normalizeProfilePhoto(null), null);
  assert.equal(await normalizeProfilePhoto(undefined), undefined);
  await assert.rejects(() =>
    normalizeProfilePhoto("data:image/svg+xml;base64,PHN2Zy8+"),
  );
  await assert.rejects(() =>
    normalizeProfilePhoto("https://example.com/photo.jpg"),
  );
  await assert.rejects(() =>
    normalizeProfilePhoto("data:image/jpeg;base64,YWJj"),
  );
});


test("wheel resets velocity between bursts and cancels when disabled mid-drag", () => {
  const votes: (boolean | undefined)[] = [];
  const c = new WheelGesture({lastEvent:-Infinity,quietUntil:0}, () => 360, () => {}, v => votes.push(v));
  c.input(20,0,0,1000,true);
  c.input(35,0,0,1020,true);
  c.end(1180);
  for(let i=0;i<16;i++) c.input(2,0,0,1800+i*30,true);
  c.end(2460);
  assert.deepEqual([...votes], [true,undefined]);
  c.input(60,0,0,3000,true);
  c.input(30,0,0,3020,false);
  c.end(3200);
  assert.deepEqual([...votes], [true,undefined,undefined]);
  assert.equal(c.dragging,false);
});

test("accepted wheel travel releases immediately and ignores momentum/opposite tails", () => {
  const votes: (boolean | undefined)[] = [];
  const gate = {lastEvent: -Infinity, quietUntil: 0};
  const c = new WheelGesture(gate, () => 390, () => {}, v => votes.push(v));
  for (let n = 0; n < 5; n++) c.input(20, 0, 0, 1000 + n * 70, true);
  assert.deepEqual(votes, [true]); // No idle timeout has elapsed.
  for (let n = 0; n < 20; n++) c.input(n % 2 ? -25 : 25, 0, 0, 1300 + n * 30, true);
  assert.deepEqual(votes, [true]);
  c.input(-20,0,0,2400,true); c.input(-35,0,0,2420,true);
  assert.deepEqual(votes,[true,false]);
});

test("opposite-direction reversal below threshold follows current intention", () => {
  const votes: (boolean | undefined)[] = [];
  const c = new WheelGesture({lastEvent:-Infinity,quietUntil:0},()=>390,()=>{},v=>votes.push(v));
  c.input(25,0,0,1000,true); c.input(-20,0,0,1100,true);
  c.input(-40,0,0,1200,true); c.input(-70,0,0,1300,true);
  assert.deepEqual(votes,[false]);
});

test("fresh acceleration after a short pause escapes momentum quarantine",()=>{
 const gate={lastEvent:1000,quietUntil:1220,lastDelta:3};const votes:(boolean|undefined)[]=[];
 const c=new WheelGesture(gate,()=>390,()=>{},v=>votes.push(v));
 c.input(18,0,0,1100,true);c.input(80,0,0,1120,true);
 assert.deepEqual(votes,[true]);
});

test("new acceleration after decaying momentum works without waiting for complete wheel silence",()=>{
 const gate={lastEvent:-Infinity,quietUntil:0,lastDelta:0};const votes:(boolean|undefined)[]=[];
 const c=new WheelGesture(gate,()=>390,()=>{},v=>votes.push(v));
 c.input(110,0,0,1000,true);c.discard(1000);
 for(const [time,delta] of [[1050,40],[1100,20],[1150,6],[1200,3]]) c.input(delta,0,0,time,true);
 c.input(15,0,0,1220,true);c.input(85,0,0,1240,true);
 assert.deepEqual(votes,[true,true]);
});
