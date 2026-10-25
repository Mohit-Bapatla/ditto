// Exercises only the explicit local showcase. Run showcase:reset afterwards to restore the demo baseline.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {writeFileSync,readFileSync} from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://localhost:3120';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const snapshot='/tmp/ditto-showcase-verification.json';
async function client(cookie){
 const r=await fetch(base+'/api/state',{headers:cookie?{cookie}:{}});assert.equal(r.status,200);let state=await r.json();assert.equal(state.showcase,true,'Not a showcase server; refusing test mutations.');
 cookie||=r.headers.get('set-cookie').split(';')[0];
 return {cookie,get state(){return state},async call(path,body,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,status,d.error);if(d.state)state=d.state;else if(path==='/api/state')state=d;return d;}};
}
const fingerprint=s=>createHash('sha256').update(JSON.stringify({user:s.user,activities:s.activities,circles:s.circles})).digest('hex');
if(process.argv.includes('--restart')){
 const saved=JSON.parse(readFileSync(snapshot));const a=await client(saved.cookie);assert.equal(fingerprint(a.state),saved.fingerprint);console.log('PASS: exact showcase profile, photos, activity state, custom activity, votes, approvals and plans survived restart.');process.exit(0);
}
const a=await client(),b=await client(),c=await client();assert.equal(a.state.user.id,b.state.user.id);assert.notEqual(a.cookie,b.cookie);
assert.equal(a.state.activities.length,36);assert.equal(a.state.circles.length,4);assert.equal(a.state.demoUsers.length,3);
assert.equal(a.state.circles.flatMap(c=>c.plans).filter(p=>p.status==='confirmed').length,2);
assert.ok(a.state.demoUsers.every(p=>p.photo?.startsWith('data:image/jpeg;base64,')));
assert.ok(a.state.activities.every(a=>Date.parse(a.start)>Date.now()));
const initialIds=a.state.activities.map(a=>a.id);
const people=a.state.demoUsers,edwin=people.find(p=>p.name==='Edwin'),paxton=people.find(p=>p.name==='Paxton');
await b.call('/api/action',{type:'switch',user:paxton.id});await c.call('/api/action',{type:'switch',user:edwin.id});
assert.equal((await a.call('/api/state')).user.name,'Mohit','separate browser switches must not change the first identity');
const activity=a.state.activities.find(a=>!a.swipe);
await a.call('/api/action',{type:'swipe',activity:activity.id,direction:'yes',nonce:randomUUID()});
await a.call('/api/action',{type:'undoSwipe',operation:a.state.undoSwipe.id});
await a.call('/api/action',{type:'swipe',activity:activity.id,direction:'no',nonce:randomUUID()});
await a.call('/api/action',{type:'undoSwipe',operation:a.state.undoSwipe.id});
const circle=a.state.circles.find(c=>c.name==='Weekend Crew');
for(const person of [a,b])for(const [i,idea]of circle.ideas.entries())await person.call('/api/action',{type:'vote',circle:circle.id,idea:idea.id,vote:i===0});
assert.equal(a.state.circles.find(c=>c.id===circle.id).round.completed,2);
await a.call('/api/state');assert.equal(a.state.circles.find(c=>c.id===circle.id).round.completed,3);
const planned=await a.call('/api/plan',{circle:circle.id,start:new Date(Date.now()+86400000*2).toISOString(),demo:true});
for(const person of [a,b,c])await person.call('/api/action',{type:'approve',plan:planned.plan.id});
await a.call('/api/state');assert.equal(a.state.circles.find(c=>c.id===circle.id).plans.find(p=>p.id===planned.plan.id).status,'confirmed');
const ics=await fetch(base+'/api/calendar?id='+planned.plan.id,{headers:{cookie:a.cookie}});assert.equal(ics.status,200);assert.match(await ics.text(),/BEGIN:VEVENT/);
const custom=await a.call('/api/action',{type:'activity',title:'Showcase custom picnic',description:'Choose the details together',category:'Outdoors',city:'Austin, TX',visibility:'circle',circle:circle.id,nonce:randomUUID()});
assert.ok((await b.call('/api/state')).activities.some(x=>x.id===custom.id));
await c.call('/api/action',{type:'profile',name:'Isolated personal test',city:'Austin, TX'});
const personal=c.state.user.id;
await a.call('/api/action',{type:'switch',user:personal},400);
assert.ok(!a.state.demoUsers.some(p=>p.id===personal));
await c.call('/api/action',{type:'switch',user:randomUUID()},400);
await a.call('/api/state');assert.ok(initialIds.every(id=>a.state.activities.some(a=>a.id===id)));
writeFileSync(snapshot,JSON.stringify({cookie:a.cookie,fingerprint:fingerprint(a.state)}),{mode:0o600});
console.log('PASS: stable shared showcase, distinct sessions, three original photos, two approved baseline plans, both Undo directions, independent switching, real voting/consensus, planning/approvals/ICS, shared custom activity and rejection of real-account switching.');
