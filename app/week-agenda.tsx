"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import type { State, Plan, Activity } from "@/lib/types";
import {
  agendaTime,
  agendaTimeZone,
  dayKey,
  shiftDay,
  weekDays,
} from "@/lib/agenda";
import { ActivityPhoto } from "./activity-photo";
export function WeekAgenda({
  data,
  now,
  renderPlan,
  onActivity,
  onCreate,
}: {
  data: State;
  now: number;
  renderPlan: (p: Plan) => ReactNode;
  onActivity: (a: Activity) => void;
  onCreate: () => void;
}) {
  const [selected, setSelected] = useState(() => dayKey(now));
  const today = dayKey(now),
    days = weekDays(selected);
  const plans = data.circles.flatMap((circle) =>
    circle.plans.map((plan) => ({ plan, circle })),
  );
  const activities = data.activities.filter(
    (a) => a.status === "interested" || a.status === "attending",
  );
  const selectedPlans = plans
    .filter(({ plan }) => dayKey(plan.start) === selected)
    .sort((a, b) => a.plan.start.localeCompare(b.plan.start));
  const selectedActivities = activities
    .filter((a) => dayKey(a.start) === selected)
    .sort((a, b) => a.start.localeCompare(b.start));
  const month = new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
  return (
    <section className="week-agenda" aria-label="Seven-day agenda">
      <div className="agenda-heading">
        <h2>{month}</h2>
        <button className="text-link" onClick={() => setSelected(today)}>
          Today
        </button>
        <div className="week-actions">
          <button
            className="icon-btn"
            aria-label="Previous week"
            onClick={() => setSelected(shiftDay(selected, -7))}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            className="icon-btn"
            aria-label="Next week"
            onClick={() => setSelected(shiftDay(selected, 7))}
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
      <div className="week-strip" role="group" aria-label="Select a day">
        {days.map((day) => {
          const date = new Date(`${day}T12:00:00Z`),
            label = date.toLocaleDateString("en-US", {
              timeZone: "UTC",
              weekday: "long",
              month: "long",
              day: "numeric",
            });
          const confirmed = plans.some(
            ({ plan }) =>
              dayKey(plan.start) === day && plan.status === "confirmed",
          );
          const rsvp = activities.some(a => dayKey(a.start) === day && a.status === "attending" && !a.cancelled);
          const pending =
            plans.some(
              ({ plan }) =>
                dayKey(plan.start) === day && plan.status !== "confirmed",
            ) || activities.some((a) => dayKey(a.start) === day && a.status === "interested" && !a.cancelled);
          return (
            <button
              key={day}
              aria-label={`${label}${day === today ? ", today" : ""}${confirmed ? ", group approved" : ""}${rsvp ? ", you RSVP’d" : ""}${pending ? ", tentative activity" : ""}`}
              aria-pressed={selected === day}
              className={day === today ? "is-today" : ""}
              onClick={() => setSelected(day)}
            >
              <span>
                {date
                  .toLocaleDateString("en-US", {
                    timeZone: "UTC",
                    weekday: "short",
                  })
                  .slice(0, 1)}
              </span>
              <strong>{date.getUTCDate()}</strong>
              <i
                className={
                  confirmed || rsvp
                    ? "agenda-dot confirmed"
                    : pending
                      ? "agenda-dot pending"
                      : "agenda-dot"
                }
              />
            </button>
          );
        })}
      </div>
      <div className="agenda-legend">
        <span>
          <i className="agenda-dot confirmed" />
          Approved / RSVP
        </span>
        <span>
          <i className="agenda-dot pending" />
          Proposed / interest
        </span>
        <span>{agendaTimeZone}</span>
      </div>
      <div className="agenda-day-heading">
        <h3>
          {selected === today
            ? "Today"
            : new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-US", {
                timeZone: "UTC",
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
        </h3>
        <button className="text-link" onClick={onCreate}>
          <Plus size={17} />
          Start a plan
        </button>
      </div>
      <div className="day-agenda" aria-live="polite">
        {selectedPlans.map(({ plan, circle }) => {
          const venue = plan.stops.find((s) => s.venue)?.venue;
          const image =
            venue?.image ||
            circle.ideas.find((i) =>
              plan.stops.some((s) => s.title === i.title),
            )?.image ||
            circle.ideas[0]?.image ||
            "";
          return (
            <details key={plan.id} className="agenda-plan">
              <summary>
                <span className="agenda-photo">
                  <ActivityPhoto
                    src={image}
                    alt={venue?.image ? venue.name : "Activity inspiration"}
                  />
                </span>
                <span className="agenda-description">
                  <span className={`agenda-status ${plan.status}`}>
                    {plan.status === "confirmed"
                      ? "Group approved"
                      : "Awaiting approval"}
                  </span>
                  <strong>{plan.title}</strong>
                  <span>
                    {agendaTime(plan.start)} ·{" "}
                    {venue?.name || "Venue to be decided"}
                  </span>
                  <small>With {circle.members.filter(member => plan.eligible.includes(member.id)).map(member => member.name).join(", ")}</small>
                  <small>
                    {circle.name} · {plan.approvals.length}/
                    {plan.eligible.length} approved · {plan.rsvps.length} RSVP
                    {plan.rsvps.length === 1 ? "" : "s"}
                  </small>
                </span>
                <ChevronDown size={18} />
              </summary>
              {renderPlan(plan)}
            </details>
          );
        })}
        {selectedActivities.map((activity) => (
          <button
            className="agenda-activity"
            key={activity.id}
            onClick={() => onActivity(activity)}
          >
            <span className="agenda-photo">
              <ActivityPhoto
                src={activity.image}
                alt={activity.venueData?.name || "Activity inspiration"}
              />
            </span>
            <span className="agenda-description">
              <span className="agenda-status proposed">
                {activity.cancelled
                  ? "Canceled"
                  : activity.status === "attending"
                    ? "You RSVP’d"
                    : "Interested · not a commitment"}
              </span>
              <strong>{activity.title}</strong>
              <span>
                {activity.fixture
                  ? "Illustrative time"
                  : agendaTime(activity.start)}{" "}
                · {activity.fixture?.area || activity.venue}
              </span>
              <small>
                {activity.host ? `With ${activity.host}` : "Community activity"}
              </small>
            </span>
            <ArrowRight size={17} />
          </button>
        ))}
        {!selectedPlans.length && !selectedActivities.length && (
          <div className="agenda-empty">
            <CalendarDays size={24} />
            <div>
              <strong>A little room for something good.</strong>
              <p>
                No saved activities or plans on this day. Start with your
                Circle.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
