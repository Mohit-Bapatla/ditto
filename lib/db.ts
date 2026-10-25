import {
  presentationActivities,
  presentationCircles,
  presentationEnabled,
  presentationVersion,
} from "./presentation-fixtures";
import { liveProvidersEnabled } from "./provider-policy";
import { PublicError } from "./errors";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { match, canJoin } from "./domain";
import {
  photos,
  type Person,
  type Activity,
  type Idea,
  type Circle,
  type Plan,
  type State,
} from "./types";
const path = resolve(
  /* turbopackIgnore: true */ process.env.DATABASE_PATH || "data/ditto.sqlite",
);
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const globalDb = globalThis as unknown as { dittoDb?: DatabaseSync };
export const db = globalDb.dittoDb ?? new DatabaseSync(path);
globalDb.dittoDb = db;
db.exec("PRAGMA busy_timeout=5000");
db.exec(readFileSync(resolve("database/schema.sql"), "utf8"));
type Row = Record<string, string | number>;
export const all = (sql: string, ...args: SQLInputValue[]) =>
  db.prepare(sql).all(...args) as Row[];
export const one = (sql: string, ...args: SQLInputValue[]) =>
  db.prepare(sql).get(...args) as Row | undefined;
export const run = (sql: string, ...args: SQLInputValue[]) =>
  db.prepare(sql).run(...args);
export const id = () => randomUUID();
const parse = <T>(r: Row) => JSON.parse(String(r.data)) as T;
export type Session = { id: string; user: string; owner: string };
export function transaction<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const v = fn();
    db.exec("COMMIT");
    return v;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function session(token: string | undefined): Session | undefined {
  const r = token && one("SELECT * FROM sessions WHERE id=?", token);
  return r
    ? { id: String(r.id), user: String(r.user_id), owner: String(r.owner) }
    : undefined;
}
export function person(user: string): Person {
  const r = one("SELECT data FROM profiles WHERE id=?", user);
  if (!r) throw new PublicError("Profile not found.");
  return parse<Person>(r);
}
export function createSession(): Session {
  return transaction(() => {
    if (presentationEnabled(process.env, path))
      return createPresentationSession();
    // Production visitors get only their own anonymous profile. Demo friends,
    // activities and Circles require explicit opt-in; existing data is untouched.
    if (process.env.DITTO_DEMO_SEED !== "true" &&
        (process.env.NODE_ENV === "production" || process.env.DITTO_DEMO_SEED === "false")) {
      const s = { id: id(), user: id(), owner: id() };
      const profile: Person = {
        id: s.user, name: "You", avatar: "", city: "Austin, TX",
        interests: [], budget: 40, demo: true,
      };
      run("INSERT INTO profiles VALUES(?,?,?)", s.user, s.owner, JSON.stringify(profile));
      run("INSERT INTO sessions(id,user_id,owner) VALUES(?,?,?)", s.id, s.user, s.owner);
      return s;
    }
    const owner = id(),
      token = id();
    const users = ["Alex", "Jordan", "Maya", "Sam"].map((name, i) => ({
      id: id(),
      name,
      avatar: ["🪻", "🍊", "🌻", "🌊"][i],
      city: "Austin, TX",
      interests: [
        ["Outdoors", "Food"],
        ["Sports", "Games"],
        ["Arts", "Food"],
        ["Fitness", "Music"],
      ][i],
      budget: 40,
      demo: true,
    }));
    for (const p of users)
      run("INSERT INTO profiles VALUES(?,?,?)", p.id, owner, JSON.stringify(p));
    run(
      "INSERT INTO sessions(id,user_id,owner) VALUES(?,?,?)",
      token,
      users[0].id,
      owner,
    );
    const s = { id: token, user: users[0].id, owner };
    const c = createCircle(
      s,
      "Weekend Crew",
      "Good people. Better weekends.",
      "Austin, TX",
      40,
      true,
    );
    for (const p of users.slice(1))
      run("INSERT INTO members VALUES(?,?)", c, p.id);
    ["Korean BBQ", "Bowling", "Escape room", "Sunset picnic"].forEach(
      (title, i) =>
        addIdea(
          s,
          c,
          title,
          ["Food", "Games", "Games", "Outdoors"][i],
          users[i].id,
        ),
    );
    const titles = [
      "A little golden hour, a lot of good company",
      "Rally, laugh, repeat.",
      "Good food. New friends.",
      "Game on, phones down.",
      "Take the scenic route.",
      "Your new climbing crew",
    ];
    const cats = ["Outdoors", "Sports", "Food", "Games", "Outdoors", "Fitness"];
    const venues = [
      "Zilker Metropolitan Park",
      "Meeting spot to be decided",
      "Venue to be decided",
      "Venue to be decided",
      "Lady Bird Lake trail",
      "Venue to be decided",
    ];
    titles.forEach((title, i) => {
      const a: Omit<Activity, "attending"> = {
        id: id(),
        creator: users[i % 4].id,
        title,
        description: [
          "A sunset picnic with a few new faces. Bring a blanket, your favorite snack, and absolutely no small-talk agenda.",
          "A friendly hit around. All levels welcome. Bring a racket if you have one; we’ll work out the details together.",
          "Let’s find our next favorite dinner spot. Come hungry and bring a recommendation.",
          "A little friendly competition and a lot of laughs. We’ll pick a place together.",
          "An easy walk, a good conversation, and a fresh perspective.",
          "First-timers and regulars welcome. Let’s pick a gym and try something new.",
        ][i],
        category: cats[i],
        image: photos[cats[i]],
        venue: venues[i],
        city: "Austin, TX",
        start: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        capacity: 8,
        budget: [0, 10, 25, 20, 0, 25][i],
        tags:
          i === 0
            ? ["Easygoing", "New friends welcome"]
            : ["All levels", "Meet new people"],
        demo: true,
      };
      run(
        "INSERT INTO activities VALUES(?,?,?,?)",
        a.id,
        owner,
        a.creator,
        JSON.stringify(a),
      );
    });
    return s;
  });
}
/** Each browser gets its own owner namespace; fixture values are stable, auth IDs are not. */
function createPresentationSession(): Session {
  const owner = id();
  const users: Person[] = ["Mohit", "Edwin", "Paxton"].map((name, i) => ({
    id: id(),
    name,
    avatar: ["M", "E", "P"][i],
    city: "Austin, TX",
    interests: [
      ["Sports", "Food", "Games"],
      ["Fitness", "Games", "Food"],
      ["Outdoors", "Arts", "Music"],
    ][i],
    budget: [25, 30, 20][i],
    demo: true,
  }));
  users.forEach((p) =>
    run("INSERT INTO profiles VALUES(?,?,?)", p.id, owner, JSON.stringify(p)),
  );
  const s = { id: id(), user: users[0].id, owner };
  run(
    "INSERT INTO sessions(id,user_id,owner) VALUES(?,?,?)",
    s.id,
    s.user,
    owner,
  );
  const anchor = new Date();
  anchor.setUTCHours(23, 0, 0, 0);
  const activities = presentationActivities.map(
    ([title, category, area, budget, capacity, image, description], i) => {
      const activity = {
        id: id(),
        creator: users[i % 3].id,
        title,
        category,
        venue: `${area} · choose a venue together`,
        city: "Austin, TX",
        budget,
        capacity,
        image: `/activities/${image}.webp`,
        description,
        start: new Date(+anchor + ((i % 12) + 1) * 86400000).toISOString(),
        tags: ["All levels welcome", "Choose a time together"],
        demo: true,
        fixture: {
          version: presentationVersion,
          index: i,
          area,
          schedule: "illustrative",
          cost: "planning allowance",
          image: "representative",
        },
      };
      run(
        "INSERT INTO activities VALUES(?,?,?,?)",
        activity.id,
        owner,
        activity.creator,
        JSON.stringify(activity),
      );
      return activity;
    },
  );
  // Seed saved interests only, never attendance, approval or RSVP.
  [2, 5, 14, 18].forEach((i) => swipe(s, activities[i].id, "yes"));
  presentationCircles.forEach((fixture, ci) => {
    const cid = createCircle(
      s,
      fixture.name,
      fixture.description,
      "Austin, TX",
      30,
      true,
    );
    users
      .slice(1)
      .forEach((p) => run("INSERT INTO members VALUES(?,?)", cid, p.id));
    fixture.picks.forEach((ai, ii) => {
      const a = activities[ai];
      const idea = {
        id: id(),
        title: a.title,
        category: a.category,
        image: a.image,
        creator: users[ii % 3].id,
      };
      run(
        "INSERT INTO ideas VALUES(?,?,?)",
        idea.id,
        cid,
        JSON.stringify(idea),
      );
    });
    startRound(s, cid, "everyone");
    const ideas = circleState(s, cid).ideas;
    // One completed sample perspective; everyone else's votes stay private.
    ideas.forEach((idea, i) =>
      vote({ ...s, user: users[1].id }, cid, idea.id, i !== 3),
    );
    const text = [
      "Pickleball or tacos? Add your vote and let’s choose together.",
      "Chess and coffee sounds like a good project break.",
      "Karaoke or bowling? I’m adding both so we can vote.",
      "Anyone up for a low-key hike? Let’s compare ideas.",
    ][ci];
    run(
      "INSERT INTO messages(id,circle_id,user_id,text,created_at,nonce) VALUES(?,?,?,?,?,?)",
      id(),
      cid,
      users[(ci % 2) + 1].id,
      text,
      new Date(+anchor - (ci + 1) * 3600000 - 86400000).toISOString(),
      id(),
    );
    if (ci === 1) {
      const pid = id();
      const plan: Plan = {
        id: pid,
        circle: cid,
        title: "Coffee, chess, and a proper break",
        explanation:
          "A sample proposal to review together. Timing and venues are illustrative; review the details before approving.",
        start: activities[2].start,
        stops: [
          {
            title: "Chess and coffee",
            duration: 90,
            note: "Choose a café together; illustrative $10 allowance.",
          },
        ],
        source: "demo",
        status: "proposed",
        approvals: [],
        eligible: users.map((p) => p.id),
        rsvps: [],
      };
      run("INSERT INTO plans VALUES(?,?,?)", pid, cid, JSON.stringify(plan));
    }
  });
  return s;
}
export function requireMember(s: Session, circle: string) {
  if (
    !one(
      "SELECT 1 FROM members WHERE circle_id=? AND user_id=?",
      circle,
      s.user,
    )
  )
    throw new PublicError("Circle not found or membership required.");
  const c = one("SELECT * FROM circles WHERE id=?", circle)!;
  if (parse<{ demo: boolean }>(c).demo && c.owner !== s.owner)
    throw new PublicError("Demo Circle is private to its sandbox.");
  return c;
}
export function createCircle(
  s: Session,
  name: string,
  description: string,
  city: string,
  budget: number,
  demo = false,
) {
  const cid = id();
  run(
    "INSERT INTO circles VALUES(?,?,?,?)",
    cid,
    s.owner,
    id(),
    JSON.stringify({ id: cid, name, description, city, budget, demo }),
  );
  run("INSERT INTO members VALUES(?,?)", cid, s.user);
  return cid;
}
export function addIdea(
  s: Session,
  circle: string,
  title: string,
  category: string,
  creator = s.user,
) {
  requireMember(s, circle);
  const idea = {
    id: id(),
    title,
    category,
    creator,
    image: photos[category] || photos.Outdoors,
  };
  run("INSERT INTO ideas VALUES(?,?,?)", idea.id, circle, JSON.stringify(idea));
  return idea.id;
}
export function startRound(s: Session, circle: string, threshold: string) {
  requireMember(s, circle);
  const current = circleState(s, circle).round;
  if (current && !current.complete)
    throw new PublicError("Finish the current round before starting another.");
  const ideas = all("SELECT id FROM ideas WHERE circle_id=?", circle);
  if (!ideas.length) throw new PublicError("Add an idea first.");
  const rid = id();
  run("INSERT INTO rounds VALUES(?,?,?,?)", rid, circle, threshold, Date.now());
  for (const r of ideas) run("INSERT INTO round_ideas VALUES(?,?)", rid, r.id);
  for (const m of all("SELECT user_id FROM members WHERE circle_id=?", circle))
    run("INSERT INTO round_members VALUES(?,?)", rid, m.user_id);
  return rid;
}
export function vote(s: Session, circle: string, idea: string, value: boolean) {
  requireMember(s, circle);
  const c = circleState(s, circle);
  if (!c.round || c.round.complete)
    throw new PublicError("No active voting round.");
  if (
    !one(
      "SELECT 1 FROM round_members WHERE round_id=? AND user_id=?",
      c.round.id,
      s.user,
    )
  )
    throw new PublicError(
      "You joined after this round started. Join the next round.",
    );
  if (!c.round.ideaIds.includes(idea))
    throw new PublicError("This idea is not in the round.");
  if (
    one(
      "SELECT 1 FROM votes WHERE round_id=? AND idea_id=? AND user_id=?",
      c.round.id,
      idea,
      s.user,
    )
  )
    throw new PublicError("You already voted on this idea.");
  run(
    "INSERT INTO votes VALUES(?,?,?,?)",
    c.round.id,
    idea,
    s.user,
    value ? 1 : 0,
  );
}
export function accessibleActivity(s: Session, aid: string) {
  const r = one("SELECT * FROM activities WHERE id=?", aid);
  if (!r) throw new PublicError("Activity not found.");
  const a = parse<Activity>(r);
  if (a.demo && r.owner !== s.owner)
    throw new PublicError("Activity not found.");
  return a;
}
export function swipe(s: Session, aid: string, direction: string) {
  accessibleActivity(s, aid);
  run(
    "INSERT INTO swipes VALUES(?,?,?) ON CONFLICT(activity_id,user_id) DO UPDATE SET direction=excluded.direction",
    aid,
    s.user,
    direction,
  );
  if (direction === "yes")
    run(
      "INSERT INTO participation VALUES(?,?,'interested') ON CONFLICT(activity_id,user_id) DO UPDATE SET status=CASE WHEN status='attending' THEN status ELSE 'interested' END",
      aid,
      s.user,
    );
}
export function attend(s: Session, aid: string, withdraw = false) {
  const a = accessibleActivity(s, aid);
  if (!withdraw && (a.cancelled || new Date(a.start).getTime() <= Date.now()))
    throw new PublicError("This activity is cancelled or has already started.");
  const count = Number(
    one(
      "SELECT count(*) n FROM participation WHERE activity_id=? AND status='attending'",
      aid,
    )!.n,
  );
  const already = one(
    "SELECT 1 FROM participation WHERE activity_id=? AND user_id=? AND status='attending'",
    aid,
    s.user,
  );
  if (!withdraw && !canJoin(count, a.capacity, !!already))
    throw new PublicError("This activity is full.");
  run(
    "INSERT INTO participation VALUES(?,?,?) ON CONFLICT(activity_id,user_id) DO UPDATE SET status=excluded.status",
    aid,
    s.user,
    withdraw ? "withdrawn" : "attending",
  );
}
export function planState(row: Row): Plan {
  const p = parse<Plan>(row);
  p.approvals = all("SELECT user_id FROM approvals WHERE plan_id=?", p.id).map(
    (r) => String(r.user_id),
  );
  p.rsvps = all("SELECT user_id FROM rsvps WHERE plan_id=?", p.id).map((r) =>
    String(r.user_id),
  );
  p.status =
    p.eligible.length > 0 && p.eligible.every((u) => p.approvals.includes(u))
      ? "confirmed"
      : "proposed";
  return p;
}
export function circleState(s: Session, cid: string): Circle {
  const row = requireMember(s, cid);
  const c = { ...parse<Circle>(row), invite: String(row.invite) };
  c.members = all(
    "SELECT p.data FROM profiles p JOIN members m ON m.user_id=p.id WHERE m.circle_id=?",
    cid,
  ).map((r) => parse<Person>(r));
  c.ideas = all("SELECT data FROM ideas WHERE circle_id=?", cid).map((r) =>
    parse<Idea>(r),
  );
  c.messages = all(
    "SELECT * FROM (SELECT * FROM messages WHERE circle_id=? ORDER BY sequence DESC LIMIT 100) ORDER BY sequence",
    cid,
  ).map((r) => ({
    id: String(r.id),
    sequence: Number(r.sequence),
    user: String(r.user_id),
    name: person(String(r.user_id)).name,
    avatar: person(String(r.user_id)).avatar,
    text: String(r.text),
    createdAt: String(r.created_at),
  }));
  c.constraints = all(
    "SELECT user_id, text FROM constraints_by_member WHERE circle_id=?",
    cid,
  ).map((r) => ({ user: String(r.user_id), text: String(r.text) }));
  c.plans = all("SELECT * FROM plans WHERE circle_id=?", cid).map(planState);
  const r = one(
    "SELECT * FROM rounds WHERE circle_id=? ORDER BY created_at DESC LIMIT 1",
    cid,
  );
  if (r) {
    const members = all(
      "SELECT user_id FROM round_members WHERE round_id=?",
      r.id,
    );
    const ideaIds = all(
      "SELECT idea_id FROM round_ideas WHERE round_id=?",
      r.id,
    ).map((a) => String(a.idea_id));
    const votes = all("SELECT * FROM votes WHERE round_id=?", r.id);
    const completed = members.filter(
      (m) =>
        votes.filter((v) => v.user_id === m.user_id).length === ideaIds.length,
    ).length;
    const complete = completed === members.length;
    c.round = {
      id: String(r.id),
      threshold: String(r.threshold),
      complete,
      completed,
      total: members.length,
      ideaIds,
    };
    c.ideas = c.ideas.map((i) => {
      const own = votes.find((v) => v.idea_id === i.id && v.user_id === s.user);
      const yes = votes.filter(
        (v) => v.idea_id === i.id && v.vote === 1,
      ).length;
      return {
        ...i,
        ...(own ? { vote: own.vote === 1 } : {}),
        ...(complete && ideaIds.includes(i.id)
          ? { yes, ...match(yes, members.length, String(r.threshold)) }
          : {}),
      };
    });
  }
  return c;
}
// Persistent, isolated presentation plans. Never runs against a deployed/live database.
function seedPresentationPlans(s: Session) {
  if (!presentationEnabled(process.env, path)) return;
  const circles = all("SELECT * FROM circles WHERE owner=? ORDER BY rowid", s.owner);
  if (!circles.length || one("SELECT 1 FROM plans p JOIN circles c ON c.id=p.circle_id WHERE c.owner=? AND json_extract(p.data, '$.template')='presentation-polish-v1'", s.owner)) return;
  const activities = all("SELECT data FROM activities WHERE owner=?", s.owner).map(r => parse<Activity>(r));
  if (!activities.some(a => a.fixture)) return;
  const old = all("SELECT p.* FROM plans p JOIN circles c ON c.id=p.circle_id WHERE c.owner=?", s.owner);
  old.forEach(row => { const p = parse<Plan>(row); if (p.title === "Coffee, chess, and a proper break" && p.source === "demo") { p.explanation = "Bring a board, grab a coffee, and make time for a proper catch-up."; p.stops.forEach(stop => { stop.note = "Hyde Park. Bring a board and choose a café together."; }); run("UPDATE plans SET data=? WHERE id=?", JSON.stringify(p),p.id); } });
  const picks = ["Pickleball doubles", "Bouldering session", "Arcade night", "Sunset hike"];
  const anchor = new Date();
  anchor.setUTCHours(23, 0, 0, 0);
  circles.slice(0,4).forEach((row, index) => {
    const cid = String(row.id), a = activities.find(a => a.title === picks[index]);
    if (!a) return;
    const eligible = all("SELECT user_id FROM members WHERE circle_id=?", cid).map(r => String(r.user_id));
    const pid = id();
    const plan: Plan = { id:pid, circle:cid, title:a.title, explanation:a.description,
      start:new Date(+anchor + (index + 1) * 86400000).toISOString(),
      stops:[{title:a.title, duration:90, note:`${a.fixture?.area || a.city}. ${a.description}`}],
      source:"demo", template:"presentation-polish-v1", status:"proposed", approvals:[], eligible, rsvps:[] };
    run("INSERT INTO plans VALUES(?,?,?)",pid,cid,JSON.stringify(plan));
    // Explicit sample commitments; regular users' plans and approvals are untouched.
    const approved = index === 0 ? eligible : eligible.slice(0,1);
    approved.forEach(uid => run("INSERT INTO approvals VALUES(?,?)",pid,uid));
    if (index === 0) eligible.forEach(uid => run("INSERT INTO rsvps VALUES(?,?)",pid,uid));
  });
}
export function state(s: Session): State {
  seedPresentationPlans(s);
  return {
    user: person(s.user),
    demoUsers: all("SELECT data FROM profiles WHERE owner=?", s.owner).map(
      (r) => parse<Person>(r),
    ),
    circles: all("SELECT circle_id FROM members WHERE user_id=?", s.user).map(
      (r) => circleState(s, String(r.circle_id)),
    ),
    activities: all("SELECT * FROM activities ORDER BY rowid DESC")
      .filter((r) => !parse<Activity>(r).demo || r.owner === s.owner)
      .map((r) => {
        const a = parse<Activity>(r);
        return {
          ...a,
          expired: new Date(a.start).getTime() <= Date.now(),
          host: person(a.creator).name,
          hostPhoto: person(a.creator).photo,
          attending: Number(
            one(
              "SELECT count(*) n FROM participation WHERE activity_id=? AND status='attending'",
              a.id,
            )!.n,
          ),
          status: one(
            "SELECT status FROM participation WHERE activity_id=? AND user_id=?",
            a.id,
            s.user,
          )?.status as string | undefined,
          swipe: one(
            "SELECT direction FROM swipes WHERE activity_id=? AND user_id=?",
            a.id,
            s.user,
          )?.direction as string | undefined,
        };
      })
      .reverse(),
    integrations: {
      live: liveProvidersEnabled(),
      meta: !!process.env.MODEL_API_KEY,
      serpapi: !!process.env.SERPAPI_API_KEY,
    },
  };
}
