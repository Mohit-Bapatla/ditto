import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, failure, rateLimit, sameOrigin } from "@/lib/http";
import { modelJSON, venues } from "@/lib/providers";
import { discoverPlaces } from "@/lib/discovery-intent";
import { storeDiscovery } from "@/lib/discovery-store";
import { newVenues } from "@/lib/discovery-results";
import { state, run } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const s = await auth();
    rateLimit("places:" + s.owner);
    rateLimit("places:global", 40);
    const b = z
      .object({
        query: z.string().min(2).max(300),
        city: z.string().min(2).max(100),
        natural: z.boolean().optional(),
        deck: z.boolean().default(false),
        budget: z.number().min(0).max(1000).optional(),
        excludeIds: z.array(z.string().max(300)).max(500).default([]),
      })
      .parse(await req.json());
    if (b.natural) rateLimit("discovery-ai:" + s.owner, 3);
    const result = await discoverPlaces(b, {modelJSON, venues});
    const results = newVenues(result.venues, b.excludeIds);
    run("DELETE FROM venue_selections WHERE expires_at < ?", Date.now());
    for (const v of results)
      run(
        "INSERT INTO venue_selections VALUES(?,?,?,?) ON CONFLICT(user_id,venue_id) DO UPDATE SET data=excluded.data, expires_at=excluded.expires_at",
        s.user,
        v.id,
        JSON.stringify(v),
        Date.now() + 1800000,
      );
    return NextResponse.json({
      venues: results,
      explanation: result.explanation,
      intent: result.intent,
      ...(b.deck ? {discovery: storeDiscovery(s, results, result.intent, result.explanation), state: state(s)} : {}),
      source: "SerpApi",
    });
  } catch (e) {
    return failure(e);
  }
}
