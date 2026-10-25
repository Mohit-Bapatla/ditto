import { ArrowUpRight, MessageCircle, Users, CalendarDays } from "lucide-react";
import {
  categories,
  type Activity,
  type Circle,
  type State,
} from "@/lib/types";
import { ActivityPhoto } from "./activity-photo";
import { Avatar } from "./profile-photo";

export function CirclePreview({
  circle,
  onOpen,
}: {
  circle: Circle;
  onOpen: (id: string) => void;
}) {
  return (
    <button className="context-row" onClick={() => onOpen(circle.id)}>
      <span className="context-thumb">
        <ActivityPhoto
          key={circle.ideas[0]?.image}
          src={circle.ideas[0]?.image || ""}
          alt="Activity inspiration"
        />
      </span>
      <span>
        <strong>{circle.name}</strong>
        <small>
          {circle.round && !circle.round.complete
            ? `${circle.round.completed}/${circle.round.total} finished voting`
            : `${circle.ideas.length} ideas to explore`}
        </small>
      </span>
      <ArrowUpRight size={16} aria-hidden="true" />
    </button>
  );
}
export function DiscoveryBrowse({
  data,
  category,
  onCategory,
  onFilters,
  onCircle,
  onActivity,
}: {
  data: State;
  category: string;
  onCategory: (value: string) => void;
  onFilters: () => void;
  onCircle: (id: string) => void;
  onActivity: (activity: Activity) => void;
}) {
  // Popularity uses actual attendance only. Without it, use a neutral editorial heading.
  const popular = data.activities
    .filter((a) => !a.cancelled && !a.expired)
    .sort((a, b) => b.attending - a.attending)
    .slice(0, 3);
  return (
    <aside className="discovery-browse" aria-label="Browse activities">
      <section>
        <div className="rail-heading">
          <h2>Find your thing</h2>
          <button onClick={onFilters}>Filters</button>
        </div>
        <div className="browse-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              aria-pressed={category === cat}
              onClick={() => onCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>Your Circles</h2>
        {data.circles.length ? (
          data.circles.map((c) => (
            <CirclePreview key={c.id} circle={c} onOpen={onCircle} />
          ))
        ) : (
          <p className="muted">Create a Circle to start choosing together.</p>
        )}
      </section>
      <section>
        <h2>
          {popular.some((a) => a.attending > 0)
            ? "Popular activities"
            : "Worth a look"}
        </h2>
        {popular.map((a) => (
          <button
            className="context-row"
            key={a.id}
            onClick={() => onActivity(a)}
          >
            <span className="context-thumb">
              <ActivityPhoto src={a.image} alt={`${a.category} inspiration`} />
            </span>
            <span>
              <strong>{a.title}</strong>
              <small>
                {a.attending > 0 ? `${a.attending} going · ` : ""}
                {a.budget === 0
                  ? "No activity budget"
                  : `$${a.budget} ${a.fixture ? "allowance" : "budget"}`}
              </small>
            </span>
          </button>
        ))}
      </section>
    </aside>
  );
}
export function DiscoverySocial({
  data,
  now,
  onCircle,
  onPlans,
  onChat,
}: {
  data: State;
  now: number;
  onCircle: (id: string) => void;
  onPlans: () => void;
  onChat: (id: string) => void;
}) {
  const messages = data.circles
    .flatMap((circle) =>
      circle.messages.map((message) => ({ circle, message })),
    )
    .sort((a, b) => b.message.createdAt.localeCompare(a.message.createdAt))
    .slice(0, 2);
  const active = data.circles
    .filter((c) => c.round && !c.round.complete)
    .slice(0, 2);
  const upcoming = data.circles
    .flatMap((c) => c.plans)
    .filter(
      (p) => p.status === "confirmed" && new Date(p.start).getTime() > now,
    );
  return (
    <aside className="discovery-social" aria-label="Your people and plans">
      <section>
        <h2>In your Circles</h2>
        <p className="rail-intro">The conversation behind the next plan.</p>
        {messages.length ? (
          messages.map(({ circle, message }) => (
            <button
              className="social-message"
              key={message.id}
              onClick={() => onChat(circle.id)}
            >
              <span className="social-avatar"><Avatar person={circle.members.find(member => member.id === message.user) || {name:message.name}}/></span>
              <span>
                <strong>
                  {message.name} <small>in {circle.name}</small>
                </strong>
                <p>{message.text}</p>
                <small>
                  {new Date(message.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · Open Circle
                </small>
              </span>
            </button>
          ))
        ) : (
          <p className="rail-empty">
            <MessageCircle size={20} />
            Your Circle conversations will appear here.
          </p>
        )}
      </section>
      <section>
        <h2>Decide together</h2>
        {active.length ? (
          active.map((c) => (
            <CirclePreview key={c.id} circle={c} onOpen={onCircle} />
          ))
        ) : (
          <p className="rail-empty">
            <Users size={20} />
            No open rounds. Add an idea to a Circle.
          </p>
        )}
      </section>
      <section className="next-plan">
        <CalendarDays size={23} />
        <h2>Next on the calendar</h2>
        <p>
          {upcoming.length
            ? `${upcoming.length} group-approved ${upcoming.length === 1 ? "plan" : "plans"} to look forward to.`
            : "Nothing confirmed yet. Your saved activities are a good place to start."}
        </p>
        <button className="text-link" onClick={onPlans}>
          Open your plans <ArrowUpRight size={16} />
        </button>
      </section>
    </aside>
  );
}
