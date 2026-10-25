import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, session, state } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  const jar = await cookies();
  let s = session(jar.get("ditto_session")?.value);
  if (!s) {
    s = createSession();
    jar.set("ditto_session", s.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return NextResponse.json(state(s), {
    headers: { "Cache-Control": "no-store" },
  });
}
