import { NextRequest, NextResponse } from "next/server";
import { PublicError } from "@/lib/errors";
import { z } from "zod";
import { auth, sameOrigin, failure, rateLimit } from "@/lib/http";
import { circleState, id, run } from "@/lib/db";
import { modelJSON } from "@/lib/providers";
import {
  AUTOPILOT_PROMPT,
  fixtureProposal,
  validateProposal,
  groupFacts,
  synthesize,
} from "@/lib/coordination";
const schema = z.object({
  circle: z.string().uuid(),
  kind: z.enum(["proposal", "synthesis"]),
  demo: z.boolean().default(true),
  consent: z.literal(true),
  messageIds: z.array(z.string().uuid()).max(20).optional(),
});
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const s = await auth();
    rateLimit("coordination:" + s.owner, 15);
    const b = schema.parse(await req.json());
    const c = circleState(s, b.circle);
    if (b.kind === "synthesis") {
      const facts = groupFacts(c);
      if (b.demo)
        return NextResponse.json({
          source: "demo",
          facts,
          suggestions: facts.consensus
            .filter((i) => i.yes > 0)
            .slice(0, 2)
            .map((i) => ({
              ideaIds: [i.id],
              rationale:
                "Manual review option based on recorded votes; no AI inference.",
              tradeoff:
                i.kind === "unanimous"
                  ? "Still needs plan approval."
                  : "Some members did not vote yes. Ask before committing.",
            })),
          unresolved: facts.unresolved,
        });
      return NextResponse.json({
        source: "meta",
        facts,
        ...(await synthesize(c, modelJSON)),
      });
    }
    // Only explicitly selected messages, bounded to this authorized Circle.
    const messages = c.messages.filter((m) => b.messageIds?.includes(m.id));
    if (!messages.length || messages.length !== new Set(b.messageIds).size)
      throw new Error("Invalid selection");
    const p = b.demo
      ? fixtureProposal(messages)
      : validateProposal(
          await modelJSON(AUTOPILOT_PROMPT, { messages }),
          messages,
        );
    const proposal = { ...p, source: b.demo ? "demo" : "meta", id: id() };
    run(
      "INSERT INTO proposals(id,circle_id,creator,data) VALUES(?,?,?,?)",
      proposal.id,
      c.id,
      s.user,
      JSON.stringify(proposal),
    );
    return NextResponse.json({ proposal });
  } catch (e) {
    return failure(
      e instanceof z.ZodError
        ? new PublicError(
            "Suggestion format was invalid (" +
              e.issues.map((i) => i.path.join(".")).join(", ") +
              "). Please retry or review manually.",
          )
        : e,
    );
  }
}
