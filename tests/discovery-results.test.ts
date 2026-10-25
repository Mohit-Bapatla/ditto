import test from "node:test";
import assert from "node:assert/strict";
import { newVenues } from "../lib/discovery-results";
import type { Venue } from "../lib/types";
test("find more excludes seen venues and provider duplicates without fabricating results",()=>{
 const venues=[{id:"seen",name:"Already seen"},{id:"new",name:"New place"},{id:"new",name:"Duplicate"}] as Venue[];
 assert.deepEqual(newVenues(venues,["seen"]).map(v=>v.id),["new"]);
 assert.deepEqual(newVenues(venues,["seen","new"]),[]);
 assert.deepEqual(newVenues([],[]),[]);
});
