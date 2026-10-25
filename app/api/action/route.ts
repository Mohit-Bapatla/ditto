import { normalizeProfilePhoto } from "@/lib/profile-photo";
import { PublicError } from "@/lib/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, sameOrigin, failure, rateLimit } from "@/lib/http";
import {
  one,
  run,
  id,
  person,
  state,
  transaction,
  createCircle,
  addIdea,
  startRound,
  vote,
  swipe,
  attend,
  requireMember,
  planState,
  accessibleActivity,
} from "@/lib/db";
import { photos, type Venue } from "@/lib/types";
const str = z.string().trim().min(1).max(200);
const uuid = z.string().uuid();
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("switch"), user: uuid }),
  z.object({ type: z.literal("profilePhoto"), photo: z.string().max(180000).nullable() }),
  z.object({
    type: z.literal("profile"),
    name: str,
    avatar: z.string().max(10).default(""),
    photo: z.string().max(180000).nullable().optional(),
    city: str,
    interests: z.array(str).max(12).default([]),
    budget: z.number().min(0).max(1000).default(40),
  }),
  z.object({
    type: z.literal("circle"),
    name: str,
    description: z.string().max(500),
    city: str,
    budget: z.number().min(0).max(1000),
  }),
  z.object({ type: z.literal("join"), invite: uuid }),
  z.object({
    type: z.literal("idea"),
    circle: uuid,
    title: str,
    category: str,
  }),
  z.object({
    type: z.literal("round"),
    circle: uuid,
    threshold: z.enum(["everyone", "majority"]),
  }),
  z.object({
    type: z.literal("vote"),
    circle: uuid,
    idea: uuid,
    vote: z.boolean(),
  }),
  z.object({
    type: z.literal("swipe"),
    activity: uuid,
    direction: z.enum(["yes", "no"]),
  }),
  z.object({
    type: z.literal("attend"),
    activity: uuid,
    withdraw: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("activity"),
    nonce: uuid.optional(),
    title: str,
    description: z.string().trim().min(1).max(1000),
    category: str,
    venue: str,
    venueId: z.string().max(300).optional(),
    city: str,
    start: z.iso.datetime(),
    capacity: z.number().int().min(2).max(100),
    budget: z.number().min(0).max(1000),
  }),
  z.object({ type: z.literal("approve"), plan: uuid }),
  z.object({ type: z.literal("rsvp"), plan: uuid, going: z.boolean() }),
  z.object({
    type: z.literal("chat"),
    circle: uuid,
    text: z.string().trim().min(1).max(1000),
    nonce: uuid,
  }),
  z.object({
    type: z.literal("constraints"),
    circle: uuid,
    text: z.string().trim().max(500),
  }),
  z.object({
    type: z.literal("acceptProposal"),
    timing: z.string().max(160).optional(),
    proposal: uuid,
    title: str,
    category: str,
  }),
  z.object({ type: z.literal("cancelActivity"), activity: uuid }),
  z.object({
    type: z.literal("editActivity"),
    activity: uuid,
    title: str,
    description: z.string().trim().min(1).max(1000),
    venue: str,
    start: z.iso.datetime(),
    capacity: z.number().int().min(2).max(100),
  }),
  z.object({
    type: z.literal("editPlan"),
    plan: uuid,
    revision: z.number().int().min(0),
    title: str,
    start: z.iso.datetime(),
    stops: z
      .array(
        z.object({
          title: str,
          duration: z.number().int().min(30).max(180),
          note: z.string().max(500),
        }),
      )
      .min(1)
      .max(3),
  }),
  z.object({ type: z.literal("unapprove"), plan: uuid }),
  z.object({ type: z.literal("resetDeck") }),
  z.object({ type: z.literal("undoPass"), activity: uuid }),
]);
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const s = await auth();
    rateLimit("action:" + s.owner, 120);
    const b = schema.parse(await req.json());
    let resultId: string | undefined;
    const photo =
      b.type === "profile" || b.type === "profilePhoto" ? await normalizeProfilePhoto(b.photo) : undefined;
    transaction(() => {
      switch (b.type) {
        case "chat": {
          requireMember(s, b.circle);
          const previous = one(
            "SELECT circle_id,id FROM messages WHERE user_id=? AND nonce=?",
            s.user,
            b.nonce,
          );
          if (previous && previous.circle_id !== b.circle)
            throw new PublicError("Message retry belongs to another Circle.");
          resultId = previous ? String(previous.id) : id();
          if (!previous)
            run(
              "INSERT INTO messages(id,circle_id,user_id,text,created_at,nonce) VALUES(?,?,?,?,?,?)",
              resultId,
              b.circle,
              s.user,
              b.text,
              new Date().toISOString(),
              b.nonce,
            );
          break;
        }
        case "constraints":
          requireMember(s, b.circle);
          run(
            "INSERT INTO constraints_by_member VALUES(?,?,?) ON CONFLICT(circle_id,user_id) DO UPDATE SET text=excluded.text",
            b.circle,
            s.user,
            b.text,
          );
          break;
        case "acceptProposal": {
          const row = one("SELECT * FROM proposals WHERE id=?", b.proposal);
          if (!row) throw new PublicError("Proposal not found.");
          requireMember(s, String(row.circle_id));
          if (row.idea_id) {
            resultId = String(row.idea_id);
            break;
          }
          resultId = addIdea(s, String(row.circle_id), b.title, b.category);
          const proposal = JSON.parse(String(row.data));
          const ideaRow = one("SELECT data FROM ideas WHERE id=?", resultId)!;
          const idea = {
            ...JSON.parse(String(ideaRow.data)),
            notes: [b.timing ?? proposal.timing, ...proposal.uncertainty]
              .filter(Boolean)
              .join(" · "),
          };
          run(
            "UPDATE ideas SET data=? WHERE id=?",
            JSON.stringify(idea),
            resultId,
          );
          run(
            "UPDATE proposals SET idea_id=? WHERE id=?",
            resultId,
            b.proposal,
          );
          break;
        }
        case "editActivity":
        case "cancelActivity": {
          const a = accessibleActivity(s, b.activity);
          if (a.creator !== s.user)
            throw new PublicError("Only the host can change this activity.");
          if (b.type === "cancelActivity") a.cancelled = true;
          else {
            if (a.cancelled)
              throw new PublicError("Cancelled activities cannot be edited.");
            if (new Date(b.start).getTime() <= Date.now())
              throw new PublicError("Choose a future date.");
            const count = Number(
              one(
                "SELECT count(*) n FROM participation WHERE activity_id=? AND status='attending'",
                a.id,
              )!.n,
            );
            if (b.capacity < count)
              throw new PublicError(
                "Capacity cannot be below existing attendance.",
              );
            if (b.venue !== a.venue) {
              delete a.venueData;
              a.image = photos[a.category] || photos.Outdoors;
            }
            Object.assign(a, {
              title: b.title,
              description: b.description,
              venue: b.venue,
              start: b.start,
              capacity: b.capacity,
            });
          }
          run(
            "UPDATE activities SET data=? WHERE id=?",
            JSON.stringify(a),
            a.id,
          );
          break;
        }
        case "editPlan": {
          const row = one("SELECT * FROM plans WHERE id=?", b.plan);
          if (!row) throw new PublicError("Plan not found.");
          requireMember(s, String(row.circle_id));
          const p = planState(row);
          if (!p.eligible.includes(s.user))
            throw new PublicError(
              "Only the original participants can revise this plan.",
            );
          if ((p.revision || 0) !== b.revision)
            throw new PublicError("This plan changed. Refresh before editing.");
          if (new Date(b.start).getTime() <= Date.now())
            throw new PublicError("Choose a future date.");
          p.title = b.title;
          p.start = b.start;
          p.revision = (p.revision || 0) + 1;
          // Changed activities must not inherit stale verified venues or routes.
          p.stops = b.stops.map((stop, i) => ({
            ...stop,
            ...(p.stops[i]?.title === stop.title
              ? { venue: p.stops[i].venue }
              : {}),
          }));
          run("UPDATE plans SET data=? WHERE id=?", JSON.stringify(p), p.id);
          run("DELETE FROM approvals WHERE plan_id=?", p.id);
          run("DELETE FROM rsvps WHERE plan_id=?", p.id);
          break;
        }
        case "switch": {
          if (
            !one(
              "SELECT 1 FROM profiles WHERE id=? AND owner=?",
              b.user,
              s.owner,
            )
          )
            throw new PublicError(
              "You can only switch identities in your own sandbox.",
            );
          run("UPDATE sessions SET user_id=? WHERE id=?", b.user, s.id);
          s.user = b.user;
          break;
        }
        case "profilePhoto": {
          const p = person(s.user);
          run("UPDATE profiles SET data=? WHERE id=?", JSON.stringify({...p,photo:photo || null}), p.id);
          break;
        }
        case "profile": {
          let p = person(s.user);
          if (p.demo) {
            p = { ...p, id: id(), demo: false };
            run(
              "INSERT INTO profiles VALUES(?,?,?)",
              p.id,
              s.owner,
              JSON.stringify(p),
            );
            s.user = p.id;
            run("UPDATE sessions SET user_id=? WHERE id=?", p.id, s.id);
          }
          const data = {
            ...p,
            name: b.name,
            avatar: b.avatar || b.name.slice(0, 1).toUpperCase(),
            ...(photo !== undefined ? { photo: photo || null } : {}),
            city: b.city,
            interests: b.interests,
            budget: b.budget,
          };
          run(
            "UPDATE profiles SET data=? WHERE id=?",
            JSON.stringify(data),
            p.id,
          );
          break;
        }
        case "circle": {
          if (person(s.user).demo)
            throw new PublicError(
              "Save your personal profile first to create a shared Circle.",
            );
          resultId = createCircle(s, b.name, b.description, b.city, b.budget);
          break;
        }
        case "join": {
          if (person(s.user).demo)
            throw new PublicError(
              "Save your personal profile before joining a shared Circle.",
            );
          const c = one("SELECT * FROM circles WHERE invite=?", b.invite);
          if (!c || JSON.parse(String(c.data)).demo)
            throw new PublicError(
              "This invite is invalid or belongs to a private demo.",
            );
          run("INSERT OR IGNORE INTO members VALUES(?,?)", c.id, s.user);
          resultId = String(c.id);
          break;
        }
        case "idea":
          resultId = addIdea(s, b.circle, b.title, b.category);
          break;
        case "round":
          resultId = startRound(s, b.circle, b.threshold);
          break;
        case "vote":
          vote(s, b.circle, b.idea, b.vote);
          break;
        case "undoPass": {
          accessibleActivity(s, b.activity);
          const saved = one(
            "SELECT direction FROM swipes WHERE activity_id=? AND user_id=?",
            b.activity,
            s.user,
          );
          if (saved?.direction !== "no")
            throw new PublicError(
              "Only a passed activity can be undone. Your attendance is unchanged.",
            );
          run(
            "DELETE FROM swipes WHERE activity_id=? AND user_id=? AND direction='no'",
            b.activity,
            s.user,
          );
          break;
        }
        case "swipe":
          swipe(s, b.activity, b.direction);
          break;
        case "attend":
          attend(s, b.activity, b.withdraw);
          break;
        case "activity": {
          if (b.nonce) {
            const previous = one(
              "SELECT activity_id FROM submissions WHERE user_id=? AND nonce=?",
              s.user,
              b.nonce,
            );
            if (previous) {
              resultId = String(previous.activity_id);
              break;
            }
          }

          if (new Date(b.start).getTime() < Date.now())
            throw new PublicError("Choose a future date.");
          let selectedVenue: Venue | undefined;
          if (b.venueId) {
            const cached = one(
              "SELECT data FROM venue_selections WHERE user_id=? AND venue_id=? AND expires_at>?",
              s.user,
              b.venueId,
              Date.now(),
            );
            if (!cached)
              throw new PublicError(
                "This place selection expired. Search and select it again.",
              );
            selectedVenue = JSON.parse(String(cached.data)) as Venue;
          }
          const a = {
            ...b,
            ...(selectedVenue
              ? {
                  venue:
                    selectedVenue.name +
                    (selectedVenue.address ? ", " + selectedVenue.address : ""),
                  venueData: selectedVenue,
                }
              : {}),
            id: id(),
            creator: s.user,
            image:
              selectedVenue?.image || photos[b.category] || photos.Outdoors,
            tags: ["New friends welcome"],
            demo: person(s.user).demo,
          };
          run(
            "INSERT INTO activities VALUES(?,?,?,?)",
            a.id,
            s.owner,
            s.user,
            JSON.stringify(a),
          );
          if (b.nonce)
            run("INSERT INTO submissions VALUES(?,?,?)", s.user, b.nonce, a.id);
          resultId = a.id;
          break;
        }
        case "unapprove":
        case "approve":
        case "rsvp": {
          const row = one("SELECT * FROM plans WHERE id=?", b.plan);
          if (!row) throw new PublicError("Plan not found.");
          requireMember(s, String(row.circle_id));
          const p = planState(row);
          if (!p.eligible.includes(s.user))
            throw new PublicError("You joined after this plan was proposed.");
          if (b.type === "unapprove") {
            run(
              "DELETE FROM approvals WHERE plan_id=? AND user_id=?",
              b.plan,
              s.user,
            );
            run("DELETE FROM rsvps WHERE plan_id=?", b.plan);
          } else if (b.type === "approve")
            run("INSERT OR IGNORE INTO approvals VALUES(?,?)", b.plan, s.user);
          else {
            if (p.status !== "confirmed")
              throw new PublicError("The plan is still awaiting approval.");
            if (b.going)
              run("INSERT OR IGNORE INTO rsvps VALUES(?,?)", b.plan, s.user);
            else
              run(
                "DELETE FROM rsvps WHERE plan_id=? AND user_id=?",
                b.plan,
                s.user,
              );
          }
          break;
        }
        case "resetDeck":
          run("DELETE FROM swipes WHERE user_id=?", s.user);
          break;
      }
    });
    return NextResponse.json({ state: state(s), id: resultId });
  } catch (e) {
    return failure(e);
  }
}
