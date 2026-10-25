import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activityMetadata} from '../lib/activity-metadata';
import type {Activity} from '../lib/types';
test('optional activity metadata does not invent time, address, cost or distance',()=>{
 const a={city:'Austin',venue:'',start:'',budget:0,budgetKnown:false} as Activity;
 assert.deepEqual(activityMetadata(a),{place:'Austin',date:undefined,cost:undefined,address:undefined});
 assert.equal(activityMetadata({...a,start:'invalid'}).date,undefined);
 const b={...a,budgetKnown:true,budget:15,start:'2026-11-02T00:00:00Z'};
 assert.equal(activityMetadata(b).cost,'Est. $15 / person');
 assert.match(activityMetadata(b).date!,/6:00 PM/);
});
