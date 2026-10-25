"use client";
import { CheckCheck, Heart, X } from "lucide-react";
import type { Circle } from "@/lib/types";
import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import {
  SwipeSurface,
  type SwipeHandle,
  type SwipeCommit,
} from "./swipe-surface";
export function GroupVoting({
  circle: c,
  busy,
  act,
  onChat,
}: {
  circle: Circle;
  busy: boolean;
  act: (
    body: unknown,
    message?: string,
    beforePublish?: () => Promise<void>,
  ) => Promise<unknown>;
  onChat: () => void;
}) {
  const control = useRef<SwipeHandle>(null);
  const swipeFocus = useRef(false);
  const progress = useMotionValue(0);
  const scale = useTransform(progress, [0, 1], [0.95, 1]);
  const y = useTransform(progress, [0, 1], [12, 0]);
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
  const cast: SwipeCommit = async (vote, afterSave) => {
    return Boolean(
      await act(
        { type: "vote", circle: c.id, idea: idea.id, vote },
        "Vote saved. Visible to the group after everyone finishes.",
        afterSave,
      ),
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
      <div className="group-stack">
        {remaining[1] && (
          <motion.div
            className="group-preview group-swipe"
            aria-hidden="true"
            inert
            style={{ scale, y }}
          >
            <img src={remaining[1].image} alt="" draggable={false} />
            <div className="group-caption">
              <h2>{remaining[1].title}</h2>
              <p>{remaining[1].category}</p>
            </div>
          </motion.div>
        )}
        <SwipeSurface
          progress={progress}
          controlRef={control}
          focusHandoffRef={swipeFocus}
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
          <span className="group-photo-note">Illustrative photo</span>
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
      </div>
      <div className="vote-buttons">
        <button
          disabled={busy}
          onClick={() => void control.current?.swipe(false)}
        >
          <X size={20} /> Pass
        </button>
        <button
          disabled={busy}
          onClick={() => void control.current?.swipe(true)}
        >
          <Heart size={20} /> Ditto
        </button>
      </div>
      <p className="small muted">
        Swipe, use the buttons, or focus the card and use ← / →.
      </p>
    </section>
  );
}
