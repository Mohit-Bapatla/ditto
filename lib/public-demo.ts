import { all, one, run, id, transaction, createPresentationSession, seedPresentationPlans, session, type Session } from "./db";
import { demoContext } from "./demo-context";
import { PublicError } from "./errors";
const DAY = 86400000;
export const demoCookie = "ditto_demo";
// Persistent, transactionally reserved quotas survive resets and server restarts.
export function reserveDemoUsage(keys: { key: string; max: number; expires: number }[]) {
  transaction(() => {
    for (const { key, max } of keys) {
      const row = one("SELECT count FROM demo_usage WHERE key=? AND expires_at>?", key, Date.now());
      if (row && Number(row.count) >= max) throw new PublicError("The demo usage limit has been reached. Explore the saved examples or try again later.");
    }
    for (const { key, expires } of keys) run("INSERT INTO demo_usage VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at>? THEN count+1 ELSE 1 END, expires_at=excluded.expires_at", key, expires, Date.now());
  });
}
export function chargeDemoProvider() {
  const ctx = demoContext.getStore();
  if (!ctx) return;
  if (!one("SELECT 1 FROM demo_sandboxes WHERE id=? AND owner=? AND expires_at>?", ctx.sandbox, ctx.session.owner, Date.now())) throw new PublicError("Demo expired. Start a fresh demo.");
  if (process.env.PUBLIC_DEMO_LIVE === "false") throw new PublicError("Live demo requests are paused. Use the labeled sample planner.");
  const day = Math.floor(Date.now() / DAY), minute = Math.floor(Date.now() / 60000);
  reserveDemoUsage([
    { key: `provider:global:${day}`, max: 300, expires: (day + 1) * DAY },
    { key: `provider:${ctx.sandbox}:${day}`, max: 30, expires: (day + 1) * DAY },
    { key: `provider:minute:${ctx.sandbox}:${minute}`, max: 12, expires: (minute + 1) * 60000 },
  ]);
}
export function demoSession(token?: string) {
  const s = session(token);
  if (!s) return;
  const row = one("SELECT id FROM demo_sandboxes WHERE owner=? AND expires_at>?", s.owner, Date.now());
  return row ? { sandbox: String(row.id), session: s } : undefined;
}
// Delete only rows owned by this marked demo namespace, never arbitrary user IDs.
function clearDemo(owner: string) {
  if (!one("SELECT 1 FROM demo_sandboxes WHERE owner=?", owner)) throw new PublicError("Demo not found.");
  const users = "SELECT id FROM profiles WHERE owner=?";
  const circles = "SELECT id FROM circles WHERE owner=?";
  const rounds = `SELECT id FROM rounds WHERE circle_id IN (${circles})`;
  const plans = `SELECT id FROM plans WHERE circle_id IN (${circles})`;
  for (const table of ["approvals", "rsvps"]) run(`DELETE FROM ${table} WHERE plan_id IN (${plans})`, owner);
  run(`DELETE FROM plans WHERE circle_id IN (${circles})`, owner);
  run(`DELETE FROM votes WHERE round_id IN (${rounds})`, owner);
  for (const table of ["round_members", "round_ideas"]) run(`DELETE FROM ${table} WHERE round_id IN (${rounds})`, owner);
  for (const table of ["rounds", "proposals", "messages", "constraints_by_member", "ideas", "members"]) run(`DELETE FROM ${table} WHERE circle_id IN (${circles})`, owner);
  run("DELETE FROM circles WHERE owner=?", owner);
  for (const table of ["swipes", "participation", "submissions", "venue_selections", "decision_history"]) run(`DELETE FROM ${table} WHERE user_id IN (${users})`, owner);
  run("DELETE FROM activities WHERE owner=?", owner);
  run("DELETE FROM sessions WHERE owner=?", owner);
  run("DELETE FROM profiles WHERE owner=?", owner);
}
export function startPublicDemo(existing?: ReturnType<typeof demoSession>, reset = false) {
  if (existing && !reset) return existing;
  const day = Math.floor(Date.now() / DAY);
  reserveDemoUsage([
    { key: `start:global:${day}`, max: 300, expires: (day + 1) * DAY },
    ...(existing ? [{ key: `reset:${existing.sandbox}:${day}`, max: 6, expires: (day + 1) * DAY }] : []),
  ]);
  return transaction(() => {
    // Expired demo graph cleanup is bounded by the global creation quota.
    for (const row of all("SELECT owner,id FROM demo_sandboxes WHERE expires_at<=? LIMIT 20", Date.now())) {
      clearDemo(String(row.owner)); run("DELETE FROM demo_sandboxes WHERE id=?", row.id);
    }
    run("DELETE FROM demo_usage WHERE expires_at<?", Date.now() - DAY);
    if (existing) clearDemo(existing.session.owner);
    const s: Session = createPresentationSession();
    const sandbox = existing?.sandbox || id();
    run("INSERT INTO demo_sandboxes VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at", sandbox, s.owner, Date.now() + DAY);
    seedPresentationPlans(s, true);
    return { sandbox, session: s };
  });
}
