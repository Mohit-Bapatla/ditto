PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, owner TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES profiles(id), owner TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS circles(id TEXT PRIMARY KEY, owner TEXT NOT NULL, invite TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS members(circle_id TEXT REFERENCES circles(id), user_id TEXT REFERENCES profiles(id), PRIMARY KEY(circle_id,user_id));
CREATE TABLE IF NOT EXISTS activities(id TEXT PRIMARY KEY, owner TEXT NOT NULL, creator TEXT REFERENCES profiles(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS participation(activity_id TEXT REFERENCES activities(id), user_id TEXT REFERENCES profiles(id), status TEXT CHECK(status IN ('interested','attending','withdrawn')), PRIMARY KEY(activity_id,user_id));
CREATE TABLE IF NOT EXISTS swipes(activity_id TEXT REFERENCES activities(id), user_id TEXT REFERENCES profiles(id), direction TEXT CHECK(direction IN ('yes','no')), PRIMARY KEY(activity_id,user_id));
CREATE TABLE IF NOT EXISTS ideas(id TEXT PRIMARY KEY, circle_id TEXT REFERENCES circles(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rounds(id TEXT PRIMARY KEY, circle_id TEXT REFERENCES circles(id), threshold TEXT CHECK(threshold IN ('everyone','majority')), created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS round_members(round_id TEXT REFERENCES rounds(id), user_id TEXT REFERENCES profiles(id), PRIMARY KEY(round_id,user_id));
CREATE TABLE IF NOT EXISTS round_ideas(round_id TEXT REFERENCES rounds(id), idea_id TEXT REFERENCES ideas(id), PRIMARY KEY(round_id,idea_id));
CREATE TABLE IF NOT EXISTS votes(round_id TEXT, idea_id TEXT, user_id TEXT, vote INTEGER CHECK(vote IN (0,1)), PRIMARY KEY(round_id,idea_id,user_id), FOREIGN KEY(round_id,user_id) REFERENCES round_members(round_id,user_id), FOREIGN KEY(round_id,idea_id) REFERENCES round_ideas(round_id,idea_id));
CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY, circle_id TEXT REFERENCES circles(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS approvals(plan_id TEXT REFERENCES plans(id), user_id TEXT REFERENCES profiles(id), PRIMARY KEY(plan_id,user_id));
CREATE TABLE IF NOT EXISTS rsvps(plan_id TEXT REFERENCES plans(id), user_id TEXT REFERENCES profiles(id), PRIMARY KEY(plan_id,user_id));
CREATE INDEX IF NOT EXISTS ideas_circle ON ideas(circle_id);
CREATE INDEX IF NOT EXISTS rounds_circle ON rounds(circle_id,created_at);
CREATE INDEX IF NOT EXISTS plans_circle ON plans(circle_id);

CREATE TABLE IF NOT EXISTS messages(sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, circle_id TEXT NOT NULL REFERENCES circles(id), user_id TEXT NOT NULL REFERENCES profiles(id), text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 1000), created_at TEXT NOT NULL, nonce TEXT NOT NULL, UNIQUE(user_id,nonce));
CREATE INDEX IF NOT EXISTS messages_circle ON messages(circle_id,sequence);
CREATE TABLE IF NOT EXISTS constraints_by_member(circle_id TEXT REFERENCES circles(id), user_id TEXT REFERENCES profiles(id), text TEXT NOT NULL, PRIMARY KEY(circle_id,user_id));
CREATE TABLE IF NOT EXISTS proposals(id TEXT PRIMARY KEY, circle_id TEXT NOT NULL REFERENCES circles(id), creator TEXT NOT NULL REFERENCES profiles(id), data TEXT NOT NULL, idea_id TEXT REFERENCES ideas(id));
CREATE TABLE IF NOT EXISTS submissions(user_id TEXT REFERENCES profiles(id), nonce TEXT NOT NULL, activity_id TEXT NOT NULL REFERENCES activities(id), PRIMARY KEY(user_id,nonce));

CREATE TABLE IF NOT EXISTS venue_selections(user_id TEXT NOT NULL REFERENCES profiles(id), venue_id TEXT NOT NULL, data TEXT NOT NULL, expires_at INTEGER NOT NULL, PRIMARY KEY(user_id,venue_id));

-- Bounded, durable undo journal. Each operation ID makes retries safe.
CREATE TABLE IF NOT EXISTS decision_history(sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL REFERENCES profiles(id), kind TEXT NOT NULL, target_id TEXT NOT NULL, context_id TEXT NOT NULL DEFAULT '', previous TEXT NOT NULL, applied TEXT NOT NULL, undone INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS decision_history_user ON decision_history(user_id,kind,context_id,sequence);

-- Public demo namespaces are distinct from normal accounts and local showcase data.
CREATE TABLE IF NOT EXISTS demo_sandboxes(id TEXT PRIMARY KEY, owner TEXT UNIQUE NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS demo_usage(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
