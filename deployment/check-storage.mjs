import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
const db = new DatabaseSync(process.env.DATABASE_PATH);
db.exec("PRAGMA busy_timeout=5000");
db.exec(readFileSync("/app/database/schema.sql", "utf8"));
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
