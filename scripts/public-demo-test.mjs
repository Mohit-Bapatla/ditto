import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const live=process.env.LIVE_DEMO==='true';
const base=process.env.TEST_BASE_URL||'http://localhost:3126';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('This regression creates test records; use an isolated local database.');
async function client(demo=false){return {cookie:'',demo,async call(path,body,expected=200){const r=await fetch(base+(demo?'/api/demo/':'/api/')+path,{method:body?'POST':'GET',headers:{cookie:this.cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const cookie=r.headers.get('set-cookie');if(cookie)this.cookie=cookie.split(';')[0];const d=await r.json();assert.equal(r.status,expected,d.error||path);return d;}};}
const real=await client();await real.call('state');await real.call('action',{type:'profile',name:'Real isolation control',city:'Austin',budget:40});const realState=await real.call('state');const realId=realState.user.id;
const realCircle=await real.call('action',{type:'circle',name:'Private real Circle',description:'Isolation control',city:'Austin',budget:40});
const realActivity=await real.call('action',{type:'activity',title:'Real public activity',description:'Isolation check',category:'Food',city:'Austin',visibility:'public',nonce:randomUUID()});
const a=await client(true),b=await client(true);await a.call('state',undefined,401);
let sa=(await a.call('start',{})).state,sb=(await b.call('start',{})).state;
assert.equal(sa.activities.length,36);assert.equal(sa.circles.length,4);assert.equal(sa.demoUsers.length,3);assert.ok(sa.publicDemo);assert.ok(sa.circles.flatMap(c=>c.plans).every(p=>Date.parse(p.start)>Date.now()));
assert.notEqual(sa.user.id,sb.user.id);assert.ok(!sa.activities.some(x=>x.id===realActivity.id));
const stable=await a.call('start',{});assert.equal(stable.state.user.id,sa.user.id);
await a.call('action',{type:'switch',user:sb.user.id},400);
await a.call('action',{type:'swipe',activity:sb.activities[0].id,direction:'yes'},400);
await a.call('action',{type:'swipe',activity:realActivity.id,direction:'yes'},400);
await real.call('action',{type:'swipe',activity:sa.activities[0].id,direction:'yes'},400);
await a.call('action',{type:'join',invite:realCircle.state.circles[0].invite},400);
await real.call('action',{type:'join',invite:sa.circles[0].invite},400);
await a.call('action',{type:'profile',name:'Escape',city:'Austin'},400);
const activity=sa.activities[0];await a.call('action',{type:'swipe',activity:activity.id,direction:'yes',nonce:randomUUID()});sa=await a.call('state');assert.equal(sa.activities.find(x=>x.id===activity.id).swipe,'yes');await a.call('action',{type:'undoSwipe',operation:sa.undoSwipe.id});assert.equal((await a.call('state')).activities.find(x=>x.id===activity.id).swipe,activity.swipe);
const custom=await a.call('action',{type:'activity',title:'Demo only custom',description:'Private demo action',category:'Games',city:'Austin',visibility:'public',nonce:randomUUID()});assert.ok(custom.id);assert.ok(!(await real.call('state')).activities.some(x=>x.id===custom.id));assert.ok(!(await b.call('state')).activities.some(x=>x.id===custom.id));
const created=await a.call('action',{type:'circle',name:'My demo Circle',description:'Judge exercise',city:'Austin',budget:30});assert.ok(created.state.circles.find(c=>c.id===created.id).demo);
const c=sa.circles[0];await a.call('action',{type:'chat',circle:c.id,text:live?'Coffee and board games tomorrow after 6 PM in Austin, around $40 each?':'Anyone down for volleyball Saturday?',nonce:randomUUID()});sa=await a.call('state');const messages=sa.circles.find(x=>x.id===c.id).messages;
const extracted=await a.call('coordination',{circle:c.id,kind:'proposal',demo:!live,consent:true,messageIds:[messages.at(-1).id]});assert.equal(extracted.proposal.source,live?'meta':'demo');if(live){const places=await a.call('places',{query:'coffee and board games',city:'Austin',natural:true});assert.ok(places.venues.length);}
await a.call('action',{type:'acceptProposal',proposal:extracted.proposal.id,title:extracted.proposal.title,category:extracted.proposal.category});
sa=await a.call('state');const ideas=sa.circles.find(x=>x.id===c.id).ideas;
for(const user of sa.demoUsers){await a.call('action',{type:'switch',user:user.id});const own=(await a.call('state')).circles.find(x=>x.id===c.id);for(const idea of own.ideas.filter(i=>own.round.ideaIds.includes(i.id)&&i.vote===undefined))await a.call('action',{type:'vote',circle:c.id,idea:idea.id,vote:true});}
assert.equal((await a.call('state')).circles.find(x=>x.id===c.id).round.complete,true);
const p=(await a.call('plan',{circle:c.id,start:new Date(Date.now()+86400000).toISOString(),demo:!live,ideaIds:[ideas[0].id]})).plan;
assert.equal(p.source,live?'meta':'demo');
for(const user of sa.demoUsers){await a.call('action',{type:'switch',user:user.id});await a.call('action',{type:'approve',plan:p.id});}
sa=await a.call('state');assert.equal(sa.circles.find(x=>x.id===c.id).plans.find(x=>x.id===p.id).status,'confirmed');await a.call('action',{type:'rsvp',plan:p.id,going:true});
await a.call('calendar?id='+p.id,undefined,400);
const forged=await fetch(base+'/api/action',{method:'POST',headers:{cookie:a.cookie.replace('ditto_demo=','ditto_session='),Origin:base,'Content-Type':'application/json'},body:JSON.stringify({type:'switch',user:sa.demoUsers[0].id})});assert.equal(forged.status,400);
const wrongOrigin=await fetch(base+'/api/demo/reset',{method:'POST',headers:{cookie:a.cookie,Origin:'https://evil.example'}});assert.equal(wrongOrigin.status,400);
const bBefore=await b.call('state');const oldCookie=a.cookie;const reset=(await a.call('reset',{})).state;assert.equal(reset.activities.length,36);assert.equal(reset.circles.length,4);assert.notEqual(reset.user.id,sa.user.id);assert.deepEqual(await b.call('state'),bBefore);
assert.equal((await real.call('state')).user.id,realId);assert.ok((await real.call('state')).circles.find(c=>c.id===realCircle.id));
const stale=await fetch(base+'/api/demo/state',{headers:{cookie:oldCookie}});assert.equal(stale.status,401);
writeFileSync('/tmp/ditto-public-demo-persistence.json',JSON.stringify({base,users:[{cookie:a.cookie,id:reset.user.id,demo:true},{cookie:b.cookie,id:sb.user.id,demo:true},{cookie:real.cookie,id:realId,demo:false}]}),{mode:0o600});
console.log(live?'LIVE: real Muse Spark and SerpApi mode':'SAMPLE: no provider calls');
console.log('PASS: fresh independent demos, no real-session mixing, 36 activities/4 Circles, roles, chat, extraction, swipes/Undo, custom activity, votes/consensus, approvals/RSVP, blocked export, reset isolation, stale sessions and CSRF. Provider mode is explicitly checked; see LIVE_DEMO invocation.');
