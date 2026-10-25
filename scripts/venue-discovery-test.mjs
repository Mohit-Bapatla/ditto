// Local-only HTTP acceptance. Provider orchestration is mocked separately in unit tests.
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
const base=process.env.TEST_BASE_URL, path=process.env.TEST_DATABASE_PATH;
assert.ok(base && ['localhost','127.0.0.1'].includes(new URL(base).hostname));
assert.ok(path?.startsWith('/tmp/ditto-venue-regression'), 'Only the disposable venue regression DB is allowed');
async function client(name){
 const r=await fetch(base+'/api/state'),cookie=r.headers.get('set-cookie').split(';')[0];let state=await r.json();
 async function call(route,body,status=200){const r=await fetch(base+route,{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await r.json();assert.equal(r.status,status,data.error);if(data.state)state=data.state;else if(route==='/api/state')state=data;return data;}
 const act=(b,status)=>call('/api/action',b,status);await act({type:'profile',name,city:'Austin',budget:25});return {cookie,act,call,get state(){return state;}};
}
const users=await Promise.all(['Venue Alex','Venue Blake','Venue Casey'].map(client)),[a,b,c]=users,outsider=await client('Venue outsider');
const db=new DatabaseSync(path);db.exec('PRAGMA busy_timeout=5000');
const owner=db.prepare('SELECT owner FROM profiles WHERE id=?').get(a.state.user.id).owner;
const aid=randomUUID(),venue={id:'mock-place-stable',name:'Test venue — fixture only',address:'Test address',source:'fixture',url:'https://example.com',hours:'Fixture hours',provenance:{retrievedAt:new Date().toISOString(),query:'coffee',city:'Austin',cached:true}};
const activity={id:aid,creator:a.state.user.id,title:'Coffee at test venue',category:'Food',description:'A suggested outing',city:'Austin',venue:venue.name,venueData:venue,image:'',start:'',capacity:0,budget:0,budgetKnown:false,tags:[],demo:false,visibility:'saved',discovery:{kind:'venue',query:'coffee tomorrow',city:'Austin',timing:'tomorrow',constraints:['under $25'],interpretedBy:'user'}};
db.prepare('INSERT INTO activities VALUES(?,?,?,?)').run(aid,owner,a.state.user.id,JSON.stringify(activity));
await a.act({type:'swipe',activity:aid,direction:'yes',nonce:randomUUID()});assert.equal(a.state.activities.find(x=>x.id===aid).status,'interested');
const op=a.state.undoSwipe.id;await a.call('/api/state');await a.act({type:'undoSwipe',operation:op});assert.equal(a.state.activities.find(x=>x.id===aid).swipe,undefined);
await a.act({type:'swipe',activity:aid,direction:'no'});await a.act({type:'undoSwipe',operation:a.state.undoSwipe.id});await a.act({type:'swipe',activity:aid,direction:'yes'});
assert.equal((await b.call('/api/state')).activities.some(x=>x.id===aid),false);
const cr=await a.act({type:'circle',name:'Venue acceptance',description:'Disposable QA',city:'Austin',budget:25}),circle=a.state.circles.find(x=>x.id===cr.id);
for(const u of [b,c])await u.act({type:'join',invite:circle.invite});
await outsider.act({type:'proposeVenue',activity:aid,circle:circle.id},400);
const proposed=await a.act({type:'proposeVenue',activity:aid,circle:circle.id});assert.equal((await a.act({type:'proposeVenue',activity:aid,circle:circle.id})).id,proposed.id);
const idea=a.state.circles.find(x=>x.id===circle.id).ideas.find(x=>x.id===proposed.id);assert.notEqual(idea.activityId,aid);assert.equal(idea.venueData.id,venue.id);
await b.call('/api/state');assert.ok(b.state.activities.some(x=>x.id===idea.activityId));assert.ok(!b.state.activities.some(x=>x.id===aid));
await a.act({type:'round',circle:circle.id,threshold:'everyone'});
for(const u of users)await u.act({type:'vote',circle:circle.id,idea:idea.id,vote:true});
await a.call('/api/state');assert.equal(a.state.circles.find(x=>x.id===circle.id).ideas.find(x=>x.id===idea.id).unanimous,true);
const p=await a.call('/api/plan',{circle:circle.id,demo:true,start:new Date(Date.now()+172800000).toISOString()});assert.equal(p.plan.stops[0].venue.id,venue.id);
for(const u of users)await u.act({type:'approve',plan:p.plan.id});await b.act({type:'rsvp',plan:p.plan.id,going:true});
const fresh=await a.call('/api/state');assert.equal(fresh.circles.find(x=>x.id===circle.id).plans.find(x=>x.id===p.plan.id).status,'confirmed');
const ics=await fetch(base+'/api/calendar?id='+p.plan.id,{headers:{cookie:a.cookie}});assert.equal(ics.status,200);assert.match(await ics.text(),/BEGIN:VCALENDAR/);
assert.equal((await fetch(base+'/api/calendar?id='+p.plan.id,{headers:{cookie:outsider.cookie}})).status,400);
db.close();console.log('PASS: private saved venue, +/- Undo, refresh, idempotent Circle proposal, shared venue identity, three independent voters, approvals, RSVP, venue-preserving plan and authorized calendar export.');
