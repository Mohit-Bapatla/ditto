import { z } from "zod";
import type { Plan } from "./types";
export function match(yes: number, total: number, threshold: string) {
  return {
    unanimous: total > 0 && yes === total,
    matched:
      total > 0 && (threshold === "everyone" ? yes === total : yes > total / 2),
  };
}
export function canJoin(count: number, capacity: number, already: boolean) {
  return already || count < capacity;
}
export const aiPlanSchema = z.object({
  title: z.string().min(1).max(100),
  explanation: z.string().min(1).max(1200),
  stops: z
    .array(
      z.object({
        venueId: z.string(),
        title: z.string().max(100),
        duration: z.number().int().min(30).max(180),
        note: z.string().max(500),
      }),
    )
    .min(1)
    .max(3),
});
export const intentSchema = z.object({
  queries: z.array(z.string().min(2).max(100)).min(1).max(3),
  explanation: z.string().max(600),
});
export function parsePlan(value: unknown, venueIds: string[]) {
  const plan = aiPlanSchema.parse(value);
  if (plan.stops.some((s) => !venueIds.includes(s.venueId)))
    throw new Error(
      "The model selected an unverified venue. Please try again.",
    );
  return plan;
}
const escapeICS = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export function calendar(plan: Plan) {
  if (plan.status !== "confirmed")
    throw new Error("The group must approve this plan first.");
  const start = new Date(plan.start);
  const end = new Date(
    +start +
      plan.stops.reduce(
        (n, s) => n + s.duration + (s.drive?.seconds || 0) / 60,
        0,
      ) *
        60000,
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ditto//Shared experiences//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${plan.id}@ditto.local`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeICS(plan.title)}`,
    `LOCATION:${escapeICS(plan.stops.map((s) => s.venue?.address || "Venue to be decided").join("; "))}`,
    `DESCRIPTION:${escapeICS(plan.explanation + "\n" + plan.stops.map((s) => `${s.title}: ${s.venue?.name || "Venue to be decided"}. ${s.note}`).join("\n"))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return (
    lines
      .map((line) => {
        let out = "",
          bytes = 0;
        for (const ch of line) {
          const size = Buffer.byteLength(ch);
          if (bytes + size > 74) {
            out += "\r\n ";
            bytes = 1;
          }
          out += ch;
          bytes += size;
        }
        return out;
      })
      .join("\r\n") + "\r\n"
  );
}
