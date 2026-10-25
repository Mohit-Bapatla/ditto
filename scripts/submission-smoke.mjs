// Explicit, bounded acceptance: three fresh QA sessions, private Circle/saved activity only.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
if(process.env.RUN_LIVE_SMOKE!=='true')throw Error('Explicit RUN_LIVE_SMOKE=true required. Calls paid providers.');
const base=process.env.TEST_BASE_URL;
if(!base)throw Error('TEST_BASE_URL required');
const rehearsal=process.env.REHEARSAL==='true';
if(rehearsal && !['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Named rehearsal is local-only');
const users=[];const checks=[];
const out=process.env.LIVE_SNAPSHOT||'test-results/submission/sessions.json';
mkdirSync('test-results/submission',{recursive:true});
function save(extra={}){writeFileSync(out,JSON.stringify({base,users:users.map(u=>({cookie:u.cookie,name:u.name})),...extra}),{mode:0o600});}
for(const name of (rehearsal?['Mohit','Paxton','Edwin']:['QA Host','QA Friend One','QA Friend Two'])){
 const r=await fetch(base+'/api/state');assert.equal(r.status,200);const header=r.headers.get('set-cookie');
 if(base.startsWith('https:'))assert.match(header,/; Secure/);
 assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/i);
 const initial=await r.json();assert.equal(initial.circles.length,0,'Fresh production session must not contain fixtures');
 const u={name,cookie:header.split(';')[0],async call(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie:this.cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const d=await r.json();assert.equal(r.status,200,d.error||path);return d;},async act(b){return this.call('/api/action',b);}};
 users.push(u);await u.act({type:'profile',name,city:'Austin, TX',budget:40,interests:['Food','Games']});
 if(rehearsal)await u.act({type:'profilePhoto',photo:'data:image/jpeg;base64,'+readFileSync('data/showcase/media/'+name.toLowerCase()+'.jpg').toString('base64')});
}
const [a,b,c]=users;save();
const photo='data:image/png;base64,'+readFileSync('public/brand/official/app-180.png').toString('base64');
if(!rehearsal)await a.act({type:'profilePhoto',photo});assert.ok((await a.call('/api/state')).user.photo);checks.push('onboarding/profile/photo/secure cookies');
const created=await a.act({type:'circle',name:'QA · submission acceptance',description:'Isolated readiness check; no showcase or real users.',city:'Austin, TX',budget:40});
const cid=created.id,invite=created.state.circles.find(x=>x.id===cid).invite;for(const u of [b,c])await u.act({type:'join',invite});
for(const [u,text] of [[a,'Let’s get coffee and play board games tomorrow after 6 PM in Austin.'],[b,'I’m in. Keep it around $40 per person.'],[c,'Coffee and board games sound good; please check the venue hours.']])await u.act({type:'chat',circle:cid,text,nonce:randomUUID()});
const state=await a.call('/api/state'),messages=state.circles.find(x=>x.id===cid).messages;
const extracted=await a.call('/api/coordination',{circle:cid,kind:'proposal',demo:false,consent:true,messageIds:messages.map(x=>x.id)});
assert.equal(extracted.proposal.source,'meta');assert.ok(extracted.proposal.evidence.length);
await a.act({type:'acceptProposal',proposal:extracted.proposal.id,title:extracted.proposal.title,category:extracted.proposal.category});checks.push('three independent sessions/join/chat/live Muse extraction/accepted idea');
const discovered=await a.call('/api/places',{query:'Coffee and board games in Austin under $40 per person',city:'Austin, TX',natural:true});assert.ok(discovered.venues.length);checks.push('live Muse intent and SerpApi venues');
const custom=await a.act({type:'activity',nonce:randomUUID(),title:'QA private coffee idea',description:'Saved privately for readiness verification.',category:'Food',venue:'Austin',city:'Austin, TX',visibility:'saved',budget:15,capacity:3});
const aid=custom.id;await a.act({type:'swipe',activity:aid,direction:'no',nonce:randomUUID()});
const s=await a.call('/api/state');assert.ok(s.undoSwipe);await a.act({type:'undoSwipe',operation:s.undoSwipe.id});checks.push('private custom activity/swipe/persistent Undo');
save({circle:cid,activity:aid,checks});
// Independent Circle votes are real API writes; no frontend response stubbing.
const circle=(await a.call('/api/state')).circles.find(x=>x.id===cid);const ids=circle.ideas.map(x=>x.id);
await a.act({type:'round',circle:cid,threshold:'everyone'});for(const u of users)for(const idea of ids)await u.act({type:'vote',circle:cid,idea,vote:true});
assert.equal((await a.call('/api/state')).circles.find(x=>x.id===cid).round.complete,true);
const generated=await a.call('/api/plan',{circle:cid,start:new Date(Date.now()+86400000).toISOString(),demo:false,template:'flexible',ideaIds:ids.slice(0,1)});
const plan=generated.plan;assert.equal(plan.source,'meta');assert.ok(plan.stops.every(x=>x.venue?.source==='SerpApi'));checks.push('unanimous real votes/live Muse grounded plan');
for(const u of users)await u.act({type:'approve',plan:plan.id});for(const u of users)await u.act({type:'rsvp',plan:plan.id,going:true});
const confirmed=(await a.call('/api/state')).circles.find(x=>x.id===cid).plans.find(x=>x.id===plan.id);assert.equal(confirmed.status,'confirmed');assert.equal(confirmed.rsvps.length,3);
const ics=await fetch(base+'/api/calendar?id='+plan.id,{headers:{cookie:a.cookie}});assert.equal(ics.status,200);assert.match(await ics.text(),/BEGIN:VCALENDAR/);checks.push('three approvals/three RSVPs/ICS');
save({circle:cid,plan:plan.id,activity:aid,checks});
writeFileSync('test-results/submission/live-results.json',JSON.stringify({base,checks,status:'PASS',venueCount:discovered.venues.length,planSource:plan.source},null,2));console.log(JSON.stringify({status:'PASS',checks,venueCount:discovered.venues.length}));
