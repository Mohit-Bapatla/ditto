import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_PATH=':memory:';
process.env.DITTO_SHOWCASE='0';
const db=await import('../lib/db');
const {proposeActivity}=await import('../lib/circle-activity');
function propose(s:Parameters<typeof proposeActivity>[0],i:Parameters<typeof proposeActivity>[1]){return db.transaction(()=>proposeActivity(s,i));}
test('all activity sources reuse Circle ideas, preserve venue metadata, and never fabricate consensus',()=>{
 const s=db.createPresentationSession(),state=db.state(s),circle=state.circles[0];
 const other=db.createPresentationSession();
 for(const [index,kind] of ['ordinary','venue','Muse Spark','custom','saved'].entries()){
  const source={...state.activities[index+20],id:db.id(),creator:s.user,discovery:kind==='venue'||kind==='Muse Spark'?{kind:'venue',interpretedBy:kind,constraints:[]}:undefined,customImage:kind==='custom',visibility:kind==='saved'?'saved':'public',venueData:kind==='venue'||kind==='Muse Spark'?{id:'venue-'+kind,name:'Actual venue reference',address:'123 Example St',url:'https://maps.google.com/?q=venue',source:'SerpApi',image:'https://example.com/photo.jpg'}:undefined};
  db.run('INSERT INTO activities VALUES(?,?,?,?)',source.id,s.owner,s.user,JSON.stringify(source));
  const before=db.state(s).circles[0];
  const suggestedStart=index%2?new Date(Date.now()+86400000).toISOString():undefined;
  const input={circle:circle.id,activity:source.id,suggestedStart,message:'Let’s try this'};
  assert.throws(()=>propose(other,input),/member|access|Circle/i);
  const ideaId=propose(s,input);assert.equal(propose(s,input),ideaId);
  const after=db.state(s).circles[0],idea=after.ideas.find(i=>i.id===ideaId)!;
  assert.deepEqual(idea.venueData,source.venueData);assert.equal(idea.image,source.image);
  assert.equal(idea.suggestedStart,suggestedStart);assert.equal(idea.proposerNote,input.message);
  assert.equal(idea.creator,s.user);assert.equal(idea.vote,undefined);
  assert.deepEqual(after.round,before.round);assert.deepEqual(after.plans,before.plans);
  const shared=db.accessibleActivity(s,idea.activityId!);assert.equal(shared.start,'');
  assert.equal(db.all('SELECT * FROM messages WHERE circle_id=? AND user_id=? AND text=?',circle.id,s.user,`${source.title}: ${input.message}`).length,1);
 }
});
test('no venue or suggested time is required; existing sample ideas are not duplicated',()=>{
 const s=db.createPresentationSession(),c=db.state(s).circles[0],a=db.state(s).activities[22];
 const id=propose(s,{activity:a.id,circle:c.id});const idea=db.state(s).circles[0].ideas.find(i=>i.id===id)!;
 assert.equal(idea.suggestedStart,undefined);assert.equal(idea.venueData,undefined);
 assert.equal(propose(s,{activity:a.id,circle:c.id}),id);
});
