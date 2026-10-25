// Local-only recovery. Copy the original SQLite snapshot; never overwrite a DB.
import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const [sourceArg, owner] = process.argv.slice(2);
assert.ok(sourceArg && owner, 'Usage: node scripts/restore-presentation.mjs ORIGINAL_SQLITE OWNER_ID');
assert.ok(!process.env.RAILWAY_ENVIRONMENT_ID && !process.env.VERCEL, 'Local recovery only.');
const target = resolve('data/ditto-presentation.sqlite');
const config = resolve('data/presentation-recovery.json');
const names = ['Mohit', 'Edwin', 'Paxton'];
function inspect(db) {
  const people = db.prepare('SELECT data FROM profiles WHERE owner=?').all(owner).map(r=>JSON.parse(r.data));
  assert.ok(names.every(n=>people.some(p=>p.name===n && p.demo)), 'Original sample identities are required.');
  const activities = db.prepare('SELECT data FROM activities WHERE owner=?').all(owner).map(r=>JSON.parse(r.data));
  assert.equal(activities.filter(a=>a.fixture).length,36,'Expected original 36-activity fixture.');
  const circles = db.prepare('SELECT data FROM circles WHERE owner=?').all(owner).map(r=>JSON.parse(r.data));
  assert.ok(['Weekend Crew','Build Break','After Hours','Side Quests'].every(n=>circles.some(c=>c.name===n)));
  return {profiles:people.map(p=>({name:p.name,photoPresent:!!p.photo})),activities:activities.length,circles:circles.length};
}
const source = new DatabaseSync(resolve(sourceArg), {readOnly:true});
inspect(source);
mkdirSync('data',{recursive:true,mode:0o700});
if (existsSync(config)) assert.equal(JSON.parse(readFileSync(config,'utf8')).owner,owner,'Refusing to replace a different recovery configuration.');
if (!existsSync(target)) {
  // SQLite backup includes committed WAL contents; plain file copying would not.
  await backup(source,target);
  chmodSync(target,0o600);
}
source.close();
const restored = new DatabaseSync(target,{readOnly:true});
const result = inspect(restored);
restored.close();
if (!existsSync(config)) writeFileSync(config,JSON.stringify({owner,source:resolve(sourceArg),restoredAt:new Date().toISOString()},null,2)+'\n',{mode:0o600,flag:'wx'});
console.log(JSON.stringify({database:target,...result,existingRecordsPreserved:true},null,2));
console.log('Run npm run dev:presentation. Fresh local sessions reopen Mohit in this existing sample group.');
