import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverPlaces, venueActivity, approximateMiles } from '../lib/discovery-intent';
import { activityMetadata } from '../lib/activity-metadata';
import type { Venue } from '../lib/types';
const venue:Venue={id:'verified-id',name:'Test Climbing Place',url:'https://www.google.com/maps/search/?api=1&query=Test',source:'SerpApi'};
test('basic category searches bypass AI, deduplicate places and retain absent fields',async()=>{
 let calls=0;
 const r=await discoverPlaces({query:'Bouldering',city:'Austin'},{modelJSON:async()=>{throw Error('AI must not run');},venues:async()=>{calls++;return[venue,venue];}});
 assert.equal(calls,1);assert.equal(r.venues.length,1);
 const a=venueActivity(venue,r.intent,'item','creator',false);
 assert.equal(a.visibility,'saved');assert.equal(a.start,'');assert.equal(a.capacity,0);assert.equal(a.attending,0);assert.equal(a.image,'');assert.equal(a.budgetKnown,false);
 assert.equal(activityMetadata(a).cost,undefined);assert.equal(activityMetadata(a).date,undefined);
 assert.equal(a.venueData?.rating,undefined);assert.equal(a.publishedEvent,undefined);
});
test('natural intent is bounded to two searches and separates meetup time from hours',async()=>{
 const calls:string[]=[];
 const r=await discoverPlaces({query:'Indoor climbing under $20 Saturday',city:'Austin',natural:true,budget:20},{modelJSON:async()=>({queries:['bouldering near UT Austin','indoor climbing','never used'],explanation:'Indoor options',timing:'Saturday',constraints:['Under $20; price needs checking']}),venues:async q=>{calls.push(q);return[{...venue,hours:'Closes 9 PM',price:'$$'}];}});
 assert.equal(calls.length,2);assert.equal(r.venues.length,1);assert.equal(r.intent.interpretedBy,'Muse Spark');assert.equal(r.intent.budgetLimit,20);
 const a=venueActivity(r.venues[0],r.intent,'item','creator',false);
 assert.equal(a.start,'');assert.equal(a.venueData?.hours,'Closes 9 PM');assert.equal(activityMetadata(a).date,'Suggested: Saturday');assert.equal(activityMetadata(a).cost,'$$');
});
test('empty and failed providers never fabricate alternatives',async()=>{
 const provider={modelJSON:async()=>({}),venues:async()=>[]};
 assert.deepEqual((await discoverPlaces({query:'nothing',city:'Austin'},provider)).venues,[]);
 await assert.rejects(discoverPlaces({query:'broken',city:'Austin'},{...provider,venues:async()=>{throw Error('over quota');}}),/over quota/);
 await assert.rejects(discoverPlaces({query:'bad AI',city:'Austin',natural:true},provider));
});
test('coffee chess request does not assert a hosted chess event; distance needs coordinates',()=>{
 const a=venueActivity(venue,{query:'coffee shops where we could play chess',city:'Austin',constraints:[],interpretedBy:'user'},'item','creator',false);
 assert.match(a.title,/Coffee at/);assert.match(a.description,/not an official venue event/);
 assert.equal(approximateMiles({latitude:30,longitude:-97},venue),undefined);
 assert.equal(approximateMiles({latitude:30,longitude:-97},{...venue,latitude:30,longitude:-97}),0);
});
