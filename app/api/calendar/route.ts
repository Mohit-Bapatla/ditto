import { NextRequest, NextResponse } from "next/server";
import { auth, failure } from "@/lib/http";
import { one, requireMember, planState } from "@/lib/db";
import { calendar } from "@/lib/domain";
export async function GET(req: NextRequest) {
  try {
    const s = await auth();
    const row = one(
      "SELECT * FROM plans WHERE id=?",
      req.nextUrl.searchParams.get("id") || "",
    );
    if (!row) throw new Error("Plan not found.");
    requireMember(s, String(row.circle_id));
    return new NextResponse(calendar(planState(row)), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ditto-hangout.ics"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
