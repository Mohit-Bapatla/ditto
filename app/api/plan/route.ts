import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, failure, rateLimit, sameOrigin } from "@/lib/http";
import { circleState, id, run, requireMember } from "@/lib/db";
import { modelJSON, venues, directions } from "@/lib/providers";
import { parsePlan } from "@/lib/domain";
import type { Plan, Stop } from "@/lib/types";
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const s = await auth();
    rateLimit("plan:" + s.owner, 5);
    const b = z
      .object({
        circle: z.string().uuid(),
        start: z.iso.datetime(),
        demo: z.boolean().default(false),
      })
      .parse(await req.json());
    if (new Date(b.start).getTime() < Date.now())
      throw new Error("Choose a future time.");
    const c = circleState(s, b.circle);
    if (!c.round?.complete)
      throw new Error("Finish the group round before planning.");
    const matches = c.ideas.filter((i) => i.matched);
    if (!matches.length)
      throw new Error(
        "No matches yet. Try a majority round or add some fresh ideas.",
      );
    let title = "Your next good memory",
      explanation =
        "A manually assembled demo draft from your saved matches. Venues and travel times are not verified. No AI was used.",
      stops: Stop[] = matches
        .slice(0, 3)
        .map((i) => ({
          title: i.title,
          duration: 90,
          note: "Choose a venue together. Suggested duration; budget and opening hours need checking.",
        }));
    if (!b.demo) {
      if (!process.env.MODEL_API_KEY || !process.env.SERPAPI_API_KEY)
        throw new Error(
          "Live planning needs MODEL_API_KEY and SERPAPI_API_KEY. You can create an explicitly labeled demo draft instead.",
        );
      const found = (
        await Promise.all(
          matches.slice(0, 3).map((i) => venues(i.title, c.city)),
        )
      ).flat();
      if (!found.length)
        throw new Error("No verified venues found. Try different ideas.");
      const generated = parsePlan(
        await modelJSON(
          "Create a group outing from these saved matches and verified venues. Return {title,explanation,stops:[{venueId,title,duration (minutes,30–180),note}]}. Use only supplied venue IDs. Respect budget and explicit votes. Do not claim opening hours or reservations are confirmed. Explain estimated costs as estimates. Include 1–3 stops. The proposed start is a preference, not confirmed availability.",
          {
            members: c.members.map((m) => ({
              name: m.name,
              interests: m.interests,
              budget: m.budget,
            })),
            budget: c.budget,
            matches: matches.map((i) => ({
              title: i.title,
              yes: i.yes,
              unanimous: i.unanimous,
            })),
            threshold: c.round.threshold,
            city: c.city,
            start: b.start,
            venues: found,
          },
        ),
        found.map((v) => v.id),
      );
      title = generated.title;
      explanation = generated.explanation;
      stops = generated.stops.map((stop) => ({
        title: stop.title,
        venue: found.find((v) => v.id === stop.venueId),
        duration: stop.duration,
        note: stop.note,
      }));
      for (let i = 1; i < stops.length; i++) {
        const from = stops[i - 1].venue?.address,
          to = stops[i].venue?.address;
        if (from && to) {
          try {
            const route = await directions(from, to);
            if (route) stops[i].drive = route;
          } catch {
            /* A missing route must not become a fabricated travel time. */
          }
        }
      }
    }
    requireMember(s, c.id);
    const p: Plan = {
      id: id(),
      circle: c.id,
      title,
      explanation,
      start: b.start,
      stops,
      source: b.demo ? "demo" : "meta",
      status: "proposed",
      approvals: [],
      eligible: c.members.map((m) => m.id),
      rsvps: [],
    };
    run("INSERT INTO plans VALUES(?,?,?)", p.id, c.id, JSON.stringify(p));
    return NextResponse.json({ plan: p });
  } catch (e) {
    return failure(e);
  }
}
