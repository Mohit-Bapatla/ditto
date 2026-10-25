import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { prepareShowcase, showcaseDate } from '../lib/showcase-fixtures';
import { showcaseId, showcaseOwner, assertShowcaseEnvironment } from '../lib/showcase-policy';
import { presentationActivities } from '../lib/presentation-fixtures';
function root() {
 const r=mkdtempSync(join(tmpdir(),'ditto-showcase-test-'));
 mkdirSync(join(r,'database'));copyFileSync('database/schema.sql',join(r,'database/schema.sql'));
 mkdirSync(join(r,'public/activities'),{recursive:true});
 for(const a of presentationActivities)writeFileSync(join(r,`public/activities/${a[5]}.webp`),'fixture');
 return r;
}
test('showcase seed/reset is deterministic, backed up, persistent, date-aware and isolated',async()=>{
 const r=root(),now=new Date('2026-10-25T04:30:00Z'); // Still Oct 24 in Austin.
 assert.equal(showcaseDate(now,1),'2026-10-25T23:00:00.000Z');
 assert.equal(showcaseDate(new Date('2026-11-01T15:00:00Z'),1),'2026-11-03T00:00:00.000Z');
 const first=await prepareShowcase(r,'seed',now,{});
 const db=new DatabaseSync(first.path);
 const counts=()=>['profiles','circles','activities','rounds','votes','plans','approvals'].map(t=>db.prepare(`SELECT count(*) n FROM ${t}`).get()!.n);
 const ids=()=>db.prepare('SELECT id FROM profiles ORDER BY id').all();
 const initial=counts(),people=ids();assert.deepEqual(initial.slice(0,3),[3,4,45]);
 const plans=db.prepare('SELECT id,data FROM plans').all();assert.equal(plans.length,4);
 assert.equal(plans.filter(p=>db.prepare('SELECT count(*) n FROM approvals WHERE plan_id=?').get(p.id)!.n===3).length,2);
 for(const p of plans){const plan=JSON.parse(String(p.data));assert.ok(Date.parse(plan.start)>+now);assert.equal(db.prepare('SELECT count(*) n FROM votes WHERE round_id=? AND vote=1').get(plan.round)!.n,3);}
 const user=showcaseId('person:Mohit'),photo='data:image/jpeg;base64,dGVzdA==';
 const profile=JSON.parse(String(db.prepare('SELECT data FROM profiles WHERE id=?').get(user)!.data));profile.photo=photo;db.prepare('UPDATE profiles SET data=? WHERE id=?').run(JSON.stringify(profile),user);
 const a=db.prepare('SELECT id,data FROM activities LIMIT 1').get()!;const edited=JSON.parse(String(a.data));edited.start='2030-01-01T00:00:00Z';db.prepare('UPDATE activities SET data=? WHERE id=?').run(JSON.stringify(edited),a.id);
 await prepareShowcase(r,'seed',now,{});assert.deepEqual(counts(),initial);assert.deepEqual(ids(),people);
 const future=new Date('2027-02-01T15:00:00Z');await prepareShowcase(r,'seed',future,{});
 assert.equal(JSON.parse(String(db.prepare('SELECT data FROM activities WHERE id=?').get(a.id)!.data)).start,edited.start);
 assert.ok(db.prepare('SELECT data FROM activities').all().every(r=>{const a=JSON.parse(String(r.data));return a.discovery || Date.parse(a.start)>+future;}));
 db.prepare('INSERT INTO activities VALUES(?,?,?,?)').run(showcaseId('custom-test'),showcaseOwner,user,JSON.stringify({...edited,id:showcaseId('custom-test'),title:'Custom test'}));
 db.close();
 const reopened=new DatabaseSync(first.path);assert.equal(reopened.prepare('SELECT count(*) n FROM activities').get()!.n,46);reopened.close();
 const reset=await prepareShowcase(r,'reset',future,{});assert.ok(reset.backupPath);
 const restored=new DatabaseSync(first.path),saved=new DatabaseSync(reset.backupPath!);
 assert.equal(saved.prepare('SELECT count(*) n FROM activities').get()!.n,46);
 assert.equal(restored.prepare('SELECT count(*) n FROM activities').get()!.n,45);
 assert.deepEqual(restored.prepare('SELECT id FROM profiles ORDER BY id').all(),people);
 assert.equal(JSON.parse(String(restored.prepare('SELECT data FROM profiles WHERE id=?').get(user)!.data)).photo,photo);
 assert.equal(restored.prepare('PRAGMA foreign_key_check').all().length,0);
 saved.close();restored.close();
 writeFileSync(join(r,'data/showcase/server.pid'),String(process.pid));
 await assert.rejects(prepareShowcase(r,'reset',future,{}),/Stop npm run showcase/);
});
test('showcase fails closed for production, foreign databases, unknown versions and symlinks',async()=>{
 const r=root();
 for(const env of [{NODE_ENV:'production'},{RAILWAY_ENVIRONMENT_ID:'prod'},{VERCEL:'1'},{CI:'true'},{ALLOW_LIVE_PROVIDERS:'true'},{DATABASE_PATH:'/data/ditto.sqlite'},{PUBLIC_ORIGIN:'https://example.com'}])assert.throws(()=>assertShowcaseEnvironment(env,r),/refused/);
 const path=assertShowcaseEnvironment({},r);mkdirSync(join(r,'data/showcase'),{recursive:true});
 let db=new DatabaseSync(path);db.exec('CREATE TABLE real_data(value TEXT)');db.close();
 await assert.rejects(prepareShowcase(r,'reset',new Date(),{}),/Unrecognized/);
 db=new DatabaseSync(path);db.exec("CREATE TABLE showcase_meta(key TEXT,value TEXT);INSERT INTO showcase_meta VALUES('version','999'),('owner','other')");db.close();
 await assert.rejects(prepareShowcase(r,'seed',new Date(),{}),/Unknown showcase/);
 const s=root();symlinkSync(join(r,'data'),join(s,'data'));
 await assert.rejects(prepareShowcase(s,'reset',new Date(),{}),/symlinked/);
});
