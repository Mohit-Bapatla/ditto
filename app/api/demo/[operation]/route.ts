import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { demoContext } from "@/lib/demo-context";
import { demoCookie, demoSession, startPublicDemo, reserveDemoUsage } from "@/lib/public-demo";
import { state } from "@/lib/db";
import { sameOrigin, failure } from "@/lib/http";
import { secureCookie } from "@/lib/security";
import { PublicError } from "@/lib/errors";
import { POST as action } from "../../action/route";
import { POST as plan } from "../../plan/route";
import { POST as coordination } from "../../coordination/route";
import { POST as places } from "../../places/route";
import { POST as directions } from "../../directions/route";
export const runtime = "nodejs";
type Context = { params: Promise<{ operation: string }> };
const handlers: Record<string, (req: NextRequest) => Promise<NextResponse>> = { action, plan, coordination, places, directions };
export async function GET(req: NextRequest, context: Context) {
  try {
    const { operation } = await context.params;
    if (operation !== "state") throw new PublicError("Calendar export and external invitations are unavailable in the demo.");
    const ctx = demoSession((await cookies()).get(demoCookie)?.value);
    if (!ctx) return NextResponse.json({ error: "Start your demo to explore." }, { status: 401 });
    return NextResponse.json(state(ctx.session), { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return failure(e); }
}
export async function POST(req: NextRequest, context: Context) {
  try {
    sameOrigin(req);
    const { operation } = await context.params;
    const jar = await cookies();
    let ctx = demoSession(jar.get(demoCookie)?.value);
    if (operation === "start" || operation === "reset") {
      if (operation === "reset" && !ctx) throw new PublicError("Demo expired. Start a new demo.");
      ctx = startPublicDemo(ctx, operation === "reset");
      jar.set(demoCookie, ctx.session.id, { httpOnly: true, secure: secureCookie(), sameSite: "lax", path: "/api/demo", maxAge: 86400 });
      return NextResponse.json({ state: state(ctx.session) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!ctx) throw new PublicError("Demo expired. Return to /demo to start again.");
    const day = Math.floor(Date.now() / 86400000);
    reserveDemoUsage([{key:`actions:${ctx.sandbox}:${day}`,max:300,expires:(day+1)*86400000},{key:`actions:global:${day}`,max:12000,expires:(day+1)*86400000}]);
    const handler = handlers[operation];
    if (!handler) throw new PublicError("This action is unavailable in the demo.");
    return await demoContext.run(ctx, () => handler(req));
  } catch (e) { return failure(e); }
}
