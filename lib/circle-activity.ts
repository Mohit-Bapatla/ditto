import { accessibleActivity, addIdea, one, run, requireMember, type Session } from './db';
import { discoveryId } from './discovery-store';
import type { Idea } from './types';

/** Called inside the action transaction. Repeated requests return the same idea. */
export function proposeActivity(s: Session, input: {activity:string;circle:string;suggestedStart?:string;message?:string}) {
  requireMember(s, input.circle);
  const original = accessibleActivity(s, input.activity);
  const sharedId = discoveryId(input.circle, original.id);
  const previous = one("SELECT id FROM ideas WHERE circle_id=? AND (json_extract(data,'$.activityId')=? OR json_extract(data,'$.activityId')=?)", input.circle, sharedId, original.id);
  if (previous) return String(previous.id);
  // A Circle idea is an invitation to decide, never an already scheduled event.
  const shared = {...original, id:sharedId, creator:s.user, visibility:'circle', circle:input.circle, start:''};
  run('INSERT INTO activities VALUES(?,?,?,?)', sharedId, s.owner, s.user, JSON.stringify(shared));
  const ideaId = addIdea(s, input.circle, shared.title, shared.category);
  const row = one('SELECT data FROM ideas WHERE id=?', ideaId)!;
  const idea: Idea = {...JSON.parse(String(row.data)), activityId:sharedId, sourceActivityId:original.id,
    venueData:original.venueData, image:original.image, imageKind:original.customImage ? 'upload' : original.venueData?.image ? 'venue' : undefined,
    suggestedStart:input.suggestedStart, proposerNote:input.message || undefined,
    slot:input.suggestedStart ? `Suggested: ${new Date(input.suggestedStart).toLocaleString('en-US',{timeZone:'America/Chicago',dateStyle:'medium',timeStyle:'short'})} (Austin time)` : undefined,
    notes:[original.description,original.venueData?.address,original.discovery?.timing ? 'Search preference: '+original.discovery.timing : '',...(original.discovery?.constraints || [])].filter(Boolean).join(' · ')};
  run('UPDATE ideas SET data=? WHERE id=?', JSON.stringify(idea), ideaId);
  if(input.message) run('INSERT INTO messages(id,circle_id,user_id,text,created_at,nonce) VALUES(?,?,?,?,?,?)',
    discoveryId(ideaId,'message'),input.circle,s.user,`${original.title}: ${input.message}`,new Date().toISOString(),discoveryId(ideaId,'message-nonce'));
  return ideaId;
}
