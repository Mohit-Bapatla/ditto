import { whyPlan } from "@/lib/coordination";
import { PublicError } from "@/lib/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, failure, rateLimit, sameOrigin } from "@/lib/http";
import { circleState, id, run, requireMember } from "@/lib/db";
import { modelJSON, venues, directions } from "@/lib/providers";
import { livePlan } from "@/lib/planning";
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
        template: z
          .enum(["flexible", "dinner", "surprise"])
          .default("flexible"),
        ideaIds: z.array(z.string().uuid()).min(1).max(3).optional(),
      })
      .parse(await req.json());
    if (new Date(b.start).getTime() < Date.now())
      throw new PublicError("Choose a future time.");
    const c = circleState(s, b.circle);
    if (!c.round?.complete)
      throw new PublicError("Finish the group round before planning.");
    const matches = b.ideaIds
      ? b.ideaIds
          .map((id) => c.ideas.find((i) => i.id === id && (i.yes || 0) > 0))
          .filter((i): i is NonNullable<typeof i> => !!i)
      : c.ideas.filter((i) => i.matched);
    if (
      b.ideaIds &&
      (matches.length !== b.ideaIds.length ||
        new Set(b.ideaIds).size !== b.ideaIds.length)
    )
      throw new PublicError(
        "Choose distinct ideas with recorded support from the completed round.",
      );
    if (b.template !== "flexible" && matches.length !== 2)
      throw new PublicError("This template needs exactly two supported ideas.");
    if (
      b.template === "dinner" &&
      (!matches.some((i) => i.category === "Food") ||
        !matches.some((i) => i.category !== "Food"))
    )
      throw new PublicError(
        "Choose one Food idea and one activity for Dinner + Activity.",
      );
    if (b.template === "dinner")
      matches.sort(
        (a, b) => Number(b.category === "Food") - Number(a.category === "Food"),
      );
    if (
      b.template === "surprise" &&
      new Set(matches.map((i) => i.category)).size < 2
    )
      throw new PublicError("Choose two different categories for Surprise Us.");
    if (!matches.length)
      throw new PublicError(
        "No matches yet. Try a majority round or add some fresh ideas.",
      );
    let title = "Your next good memory",
      explanation =
        "A manually assembled demo draft from your saved matches. Venues and travel times are not verified. No AI was used.",
      stops: Stop[] = matches.slice(0, 3).map((i) => ({
        title: i.title,
        duration: 90,
        note: "Choose a venue together. Suggested duration; budget and opening hours need checking.",
      }));
    if (!b.demo) {
      if (!process.env.MODEL_API_KEY || !process.env.SERPAPI_API_KEY)
        throw new PublicError(
          "Live planning needs MODEL_API_KEY and SERPAPI_API_KEY. You can create an explicitly labeled demo draft instead.",
        );
      const generated = await livePlan(c, matches, b.start, b.template, {
        modelJSON,
        venues,
        directions,
      });
      title = generated.title;
      explanation = generated.explanation;
      stops = generated.stops;
    }

    requireMember(s, c.id);
    const p: Plan = {
      id: id(),
      circle: c.id,
      title,
      explanation,
      why: whyPlan(c),
      template: b.template,
      revision: 0,
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
