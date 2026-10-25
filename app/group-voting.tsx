"use client";
import { CheckCheck, Heart, X } from "lucide-react";
import type { Circle } from "@/lib/types";
import { SwipeSurface } from "./swipe-surface";
export function GroupVoting({
  circle: c,
  busy,
  act,
  onChat,
}: {
  circle: Circle;
  busy: boolean;
  act: (body: unknown, message?: string) => Promise<unknown>;
  onChat: () => void;
}) {
  const round = c.round!;
  const remaining = c.ideas.filter(
    (i) => round.ideaIds.includes(i.id) && i.vote === undefined,
  );
  const idea = remaining[0];
  if (!idea)
    return (
      <div className="waiting-state" role="status">
        <CheckCheck size={28} />
        <h2>Your votes are in.</h2>
        <p>
          {round.completed} of {round.total} people finished. Matches appear
          when everyone is done.
        </p>
        <button className="secondary" onClick={onChat}>
          Catch up in chat
        </button>
      </div>
    );
  const cast = (vote: boolean) => {
    void act(
      { type: "vote", circle: c.id, idea: idea.id, vote },
      "Vote saved. Visible to the group after everyone finishes.",
    );
  };
  return (
    <section className="group-deck">
      <p className="section-meta">
        YOUR PRIVATE VOTE{" "}
        <span>
          {round.ideaIds.length - remaining.length + 1} / {round.ideaIds.length}
        </span>
      </p>
      <SwipeSurface
        key={idea.id}
        className="group-swipe"
        disabled={busy}
        label={`${idea.title}. Left arrow to pass, right arrow for Ditto.`}
        onSwipe={cast}
      >
        <img
          src={idea.image}
          alt={`${idea.category} inspiration, not a verified venue`}
          draggable={false}
        />
        <div className="group-caption">
          <span className="pill white">{idea.category}</span>
          <h2>{idea.title}</h2>
          <p>{idea.notes || "Would you be up for this?"}</p>
          <span className="small">
            Suggested by{" "}
            {c.members.find((m) => m.id === idea.creator)?.name || "a member"}
          </span>
        </div>
      </SwipeSurface>
      <div className="vote-buttons">
        <button disabled={busy} onClick={() => cast(false)}>
          <X size={20} /> Pass
        </button>
        <button disabled={busy} onClick={() => cast(true)}>
          <Heart size={20} /> Ditto
        </button>
      </div>
      <p className="small muted">
        Swipe, use the buttons, or focus the card and use ← / →.
      </p>
    </section>
  );
}
