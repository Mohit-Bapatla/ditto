"use client";
import type { Plan } from "@/lib/types";
export function PlanEditor({
  plan: p,
  act,
}: {
  plan: Plan;
  act: (body: unknown, message?: string) => Promise<unknown>;
}) {
  const local = new Date(
    new Date(p.start).getTime() - new Date(p.start).getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  return (
    <details className="plan-editor">
      <summary>Edit plan · everyone will approve again</summary>
      <form
        key={p.revision || 0}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          await act(
            {
              type: "editPlan",
              plan: p.id,
              revision: p.revision || 0,
              title: f.get("title"),
              start: new Date(String(f.get("start"))).toISOString(),
              stops: p.stops.map((s, i) => ({
                title: f.get(`title${i}`),
                duration: Number(f.get(`duration${i}`)),
                note: f.get(`note${i}`),
              })),
            },
            "Plan revised. Previous approvals and RSVPs cleared.",
          );
        }}
      >
        <label>
          Plan title
          <input name="title" required maxLength={120} defaultValue={p.title} />
        </label>
        <label>
          Start (your local time)
          <input
            type="datetime-local"
            name="start"
            required
            defaultValue={local}
          />
        </label>
        {p.stops.map((s, i) => (
          <fieldset key={i}>
            <legend>Stop {i + 1}</legend>
            <label>
              Activity
              <input required name={`title${i}`} defaultValue={s.title} />
            </label>
            <label>
              Minutes
              <input
                name={`duration${i}`}
                type="number"
                min={30}
                max={180}
                defaultValue={s.duration}
              />
            </label>
            <label>
              Notes
              <textarea
                name={`note${i}`}
                maxLength={500}
                defaultValue={s.note}
              />
            </label>
          </fieldset>
        ))}
        <p className="small muted">
          Changing an activity clears its old venue. Routes must be checked
          again. This also clears every RSVP.
        </p>
        <button className="secondary">Save revision for group review</button>
      </form>
    </details>
  );
}
