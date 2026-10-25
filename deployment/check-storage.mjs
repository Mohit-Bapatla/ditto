import { DatabaseSync, backup } from "node:sqlite";
import { readFileSync, mkdirSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
const db = new DatabaseSync(process.env.DATABASE_PATH);
db.exec("PRAGMA busy_timeout=5000");
// Preserve a consistent rollback copy before the first additive coordination migration.
if (
  db.prepare("SELECT 1 FROM sqlite_master WHERE name='profiles'").get() &&
  !db.prepare("SELECT 1 FROM sqlite_master WHERE name='messages'").get()
) {
  const folder = join(dirname(process.env.DATABASE_PATH), "backups");
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const destination = join(folder, `before-coordination-${Date.now()}.sqlite`);
  await backup(db, destination);
  chmodSync(destination, 0o600);
  console.log(
    "Pre-migration SQLite backup saved privately on the persistent volume.",
  );
}
db.exec(
  readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8"),
);
// Force a real transactional write without leaving artificial application data.
db.exec(
  "BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS _ditto_write_probe(ok INTEGER); INSERT INTO _ditto_write_probe VALUES(1); ROLLBACK;",
);
const result = db.prepare("PRAGMA quick_check").get();
if (result.quick_check !== "ok")
  throw new Error(
    "Database integrity check failed. Restore a verified backup.",
  );
db.close();
console.log(
  "Ditto storage ready; database integrity and write access verified.",
);
