import assert from 'node:assert/strict';
import sharp from 'sharp';
const base = process.env.TEST_BASE_URL || 'http://localhost:3109';
if (!['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw Error('Use an isolated local test server.');
async function client() {
 const r=await fetch(base+'/api/state');
 const cookie=r.headers.get('set-cookie').split(';')[0];
 return {state:await r.json(),async call(body,status=200){
  const r=await fetch(base+(body?'/api/action':'/api/state'),{method:body?'POST':'GET',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const d=await r.json();assert.equal(r.status,status,d.error);if(r.ok)this.state=d.state||d;return d;
 }};
}
const a=await client(), b=await client();
const original=a.state.user.id;
const bytes=await sharp({create:{width:500,height:600,channels:3,background:'#c42d51'}}).jpeg().withMetadata().toBuffer();
const photo='data:image/jpeg;base64,'+bytes.toString('base64');
await a.call({type:'profilePhoto',photo});
assert.equal(a.state.user.id,original,'Changing picture must preserve demo identity and memberships');
assert.match(a.state.user.photo,/^data:image\/jpeg;base64,/);
const persisted=a.state.user.photo;
await a.call();assert.equal(a.state.user.photo,persisted);
assert.ok(!JSON.stringify(b.state).includes(persisted),'Other sandbox must not receive this photo');
await a.call({type:'profilePhoto',photo:'data:image/svg+xml;base64,PHN2Zz4='},400);
assert.equal(a.state.user.photo,persisted);
await a.call({type:'profilePhoto',photo:null});assert.equal(a.state.user.photo,null);
await a.call({type:'profile',name:'Photo QA',city:'Austin, TX',photo});
assert.notEqual(a.state.user.id,original);
const {id}=await a.call({type:'circle',name:'Photo Circle',description:'Profile visibility QA',city:'Austin, TX',budget:20});
const circle=a.state.circles.find(c=>c.id===id);
await b.call({type:'profile',name:'Second Photo QA',city:'Austin, TX'});
await b.call({type:'join',invite:circle.invite});
assert.equal(b.state.circles.find(c=>c.id===id).members.find(m=>m.id===a.state.user.id).photo,a.state.user.photo);
console.log('PASS: photo save/read/remove, stable demo identity, personal profile upload, rejected SVG, cross-sandbox privacy, shared Circle visibility.');
