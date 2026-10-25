import type { Venue } from "./types";
/** Providers/cache can repeat a venue. Existing decisions must never be recycled as new. */
export function newVenues(results: Venue[], excluded: string[]) {
  const seen = new Set(excluded);
  return results.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
}
