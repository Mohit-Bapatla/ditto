import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, statSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
test("additive deployment migration preserves existing data and makes one private backup", () => {
  const dir = mkdtempSync(join(tmpdir(), "ditto-migration-"));
  try {
    const path = join(dir, "ditto.sqlite");
    let db = new DatabaseSync(path);
    db.exec(
      "CREATE TABLE profiles(id TEXT PRIMARY KEY,owner TEXT NOT NULL,data TEXT NOT NULL); INSERT INTO profiles VALUES('existing','owner','{}');",
    );
    db.close();
    for (let i = 0; i < 2; i++)
      execFileSync(process.execPath, ["deployment/check-storage.mjs"], {
        env: { ...process.env, DATABASE_PATH: path },
      });
    db = new DatabaseSync(path);
    assert.equal(db.prepare("SELECT count(*) n FROM profiles").get()!.n, 1);
    assert.ok(
      db.prepare("SELECT 1 FROM sqlite_master WHERE name='messages'").get(),
    );
    db.close();
    const backups = readdirSync(join(dir, "backups"));
    assert.equal(backups.length, 1);
    const backup = join(dir, "backups", backups[0]);
    assert.equal(statSync(backup).mode & 0o777, 0o600);
    db = new DatabaseSync(backup);
    assert.equal(db.prepare("PRAGMA quick_check").get()!.quick_check, "ok");
    assert.equal(db.prepare("SELECT count(*) n FROM profiles").get()!.n, 1);
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
