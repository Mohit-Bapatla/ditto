import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, failure, rateLimit, sameOrigin } from "@/lib/http";
import { modelJSON, venues } from "@/lib/providers";
import { intentSchema } from "@/lib/domain";
import { newVenues } from "@/lib/discovery-results";
import { person, run } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const s = await auth();
    rateLimit("places:" + s.owner);
    const b = z
      .object({
        query: z.string().min(2).max(300),
        city: z.string().min(2).max(100),
        natural: z.boolean().optional(),
        excludeIds: z.array(z.string().max(300)).max(500).default([]),
      })
      .parse(await req.json());
    let queries = [b.query],
      explanation = "Live Google Maps results, powered by SerpApi.";
    if (b.natural) {
      const intent = intentSchema.parse(
        await modelJSON(
          "Interpret this person’s activity request. Return {queries: string[] (1–2 short Maps search phrases), explanation: string, timing: string, constraints: string[]}. Extract stated timing, budgets and restrictions; do not invent missing details. Respect their budget and interests; do not claim prices or availability are verified.",
          { request: b.query, city: b.city, profile: person(s.user) },
        ),
      );
      queries = intent.queries.slice(0, 2);
      explanation =
        intent.explanation +
        (intent.timing ? ` Timing requested: ${intent.timing}.` : "") +
        (intent.constraints?.length
          ? ` Constraints: ${intent.constraints.join("; ")}.`
          : "");
    }
    const results = (
      await Promise.all(queries.map((q) => venues(q, b.city)))
    ).flat();
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
      venues: newVenues(results, b.excludeIds),
      explanation,
      source: "SerpApi",
    });
  } catch (e) {
    return failure(e);
  }
}
