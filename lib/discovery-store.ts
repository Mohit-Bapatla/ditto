import { createHash } from 'node:crypto';
import { one, run, transaction, person, type Session } from './db';
import { venueActivity, type DiscoveryIntent } from './discovery-intent';
import type { Venue } from './types';
export function discoveryId(scope: string, place: string) {
  const h=createHash('sha256').update(JSON.stringify([scope,place])).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
export function storeDiscovery(s: Session, venues: Venue[], intent: DiscoveryIntent, explanation: string) {
  return transaction(()=>{
    const ids=venues.map(v=>{
      const aid=discoveryId(s.user,v.id);
      // Repeated searches reuse the same private item and its decisions, without
      // rewriting the details of an already saved suggestion.
      if(!one('SELECT 1 FROM activities WHERE id=?',aid)) {
        const a=venueActivity(v,intent,aid,s.user,person(s.user).demo);
        run('INSERT INTO activities VALUES(?,?,?,?)',aid,s.owner,s.user,JSON.stringify(a));
      }
      return aid;
    });
    const search={ids, query:intent.query, city:intent.city, explanation, intent};
    run('INSERT INTO discovery_searches VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data',s.user,JSON.stringify(search));
    return search;
  });
}
