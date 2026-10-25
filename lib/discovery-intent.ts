import { intentSchema } from './domain';
import type { Activity, Venue } from './types';

export type DiscoveryIntent = { query: string; city: string; timing?: string; constraints: string[]; budgetLimit?: number; interpretedBy: 'user' | 'Muse Spark' };
export type SearchProviders = { modelJSON: (prompt: string, context: unknown) => Promise<unknown>; venues: (query: string, city: string) => Promise<Venue[]> };
export async function discoverPlaces(input: {query: string; city: string; natural?: boolean; budget?: number}, providers: SearchProviders) {
  let queries = [input.query];
  const intent: DiscoveryIntent = {query: input.query, city: input.city, constraints: [], budgetLimit: input.budget, interpretedBy: 'user'};
  let explanation = 'Place listings from SerpApi. Hours and prices need checking with the venue.';
  if (input.natural) {
    const parsed = intentSchema.parse(await providers.modelJSON('Interpret this activity request. Return {queries: string[] (1–2 short Google Maps search phrases including any requested neighborhood), explanation: string, timing: string, budgetLimit?: number (only when stated), constraints: string[]}. Extract stated timing, budget, location and activity preferences. Do not invent details, venue events, prices or availability. Use location words from the request in search phrases. Selected city is the search region.', {query:input.query,city:input.city,budget:input.budget}));
    queries = parsed.queries.slice(0,2);
    Object.assign(intent, {timing: parsed.timing, budgetLimit: parsed.budgetLimit ?? input.budget, constraints: parsed.constraints || [], interpretedBy: 'Muse Spark'});
    explanation = parsed.explanation;
  }
  const results = (await Promise.all(queries.map(q => providers.venues(q,input.city)))).flat();
  const seen = new Set<string>();
  return {intent, explanation, venues: results.filter(v => {if(seen.has(v.id)) return false; seen.add(v.id); return true;})};
}
export function venueActivity(venue: Venue, intent: DiscoveryIntent, id: string, creator: string, demo: boolean): Activity {
  // A suggestion, never an assertion that this venue hosts an official event.
  const q = intent.query.toLowerCase();
  const [verb, category] = /boulder|climb/.test(q) ? ['Bouldering at','Sports'] : /pickleball|badminton/.test(q) ? ['Play at','Sports'] : /bowl/.test(q) ? ['Bowling at','Games'] : /coffee|café|cafe/.test(q) ? ['Coffee at','Food'] : /food|restaurant|dinner/.test(q) ? ['Eat at','Food'] : /park|hik/.test(q) ? ['Explore','Outdoors'] : ['Visit', 'Outdoors'];
  return {id, creator, title: `${verb} ${venue.name}`, category, description: `An idea to explore together, not an official venue event. Your request: ${intent.query}`, city:intent.city, venue:venue.name, venueData:venue, image:venue.image || '', start:'', capacity:0, budget:0, budgetKnown:false, tags:[], demo, attending:0, visibility:'saved', discovery:{kind:'venue',...intent}};
}
export function approximateMiles(origin: {latitude:number;longitude:number}, v: Venue) {
  if(v.latitude === undefined || v.longitude === undefined) return undefined;
  const rad = Math.PI/180, dLat=(v.latitude-origin.latitude)*rad, dLng=(v.longitude-origin.longitude)*rad;
  const a=Math.sin(dLat/2)**2+Math.cos(origin.latitude*rad)*Math.cos(v.latitude*rad)*Math.sin(dLng/2)**2;
  return 3958.8*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
