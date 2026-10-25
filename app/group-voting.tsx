"use client";
import { CheckCheck, Heart, X, Undo2, ArrowUpRight } from "lucide-react";
import type { Activity, Circle } from "@/lib/types";
import { useRef, useState } from "react";
import { useSwipeDeck } from "./use-swipe-deck";
import { ActivityMetadata } from "./activity-metadata";
import { Avatar } from "./profile-photo";
import { ActivityPhoto } from "./activity-photo";
import { motion, useMotionValue, useTransform } from "motion/react";
import {
  SwipeSurface,
  type SwipeHandle,
  type SwipeCommit,
} from "./swipe-surface";
export function GroupVoting({
  circle: c,
  activities = [],
  onDetails,
  busy,
  act,
  onChat,
}: {
  circle: Circle;
  activities?: Activity[];
  onDetails?: (activity: Activity) => void;
  busy: boolean;
  act: (
    body: unknown,
    message?: string,
    beforePublish?: () => Promise<void>,
  ) => Promise<unknown>;
  onChat: () => void;
}) {
  const {wheelGate, wheelTarget} = useSwipeDeck();
  const [details, setDetails] = useState(false);
  const control = useRef<SwipeHandle>(null);
  const swipeFocus = useRef(false);
  const progress = useMotionValue(0);
  const scale = useTransform(progress, [0, 1], [0.98, 1]);
  const y = useTransform(progress, [0, 1], [5, 0]);
  const round = c.round!;
  const remaining = c.ideas.filter(
    (i) => round.ideaIds.includes(i.id) && i.vote === undefined,
  );
  const idea = remaining[0];
  const activity = activities.find(a => a.id === idea?.activityId);
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
    <section className="group-voting-layout">
      <aside className="voting-context" aria-label="Circle voting progress">
        <h2>Decide together</h2>
        <div className="voting-members">{c.members.map(member => <span key={member.id}><Avatar person={member}/>{member.name}</span>)}</div>
        <p><strong>{round.completed} of {round.total}</strong> members finished</p>
        <p className="small muted">Your choices stay private until everyone finishes. {round.threshold === "everyone" ? "A match needs everyone’s yes." : "A majority makes a match."}</p>
      </aside>
      <div className="group-deck">
      <p className="section-meta">
        Your private vote{" "}
        <span>
          {round.ideaIds.length - remaining.length + 1} / {round.ideaIds.length}
        </span>
      </p>
      <div className="group-stack" ref={wheelTarget}>
        {remaining[1] && (
          <motion.div
            className="group-preview group-swipe"
            aria-hidden="true"
            inert
            style={{ scale, y }}
          >
            <ActivityPhoto
              key={remaining[1].id}
              src={remaining[1].image}
              alt="Activity inspiration"
            />
            <div
              className={`group-caption ${remaining[1].title.length > 70 ? "long-title" : ""}`}
            >
              <h2>{remaining[1].title}</h2>
              <p>{remaining[1].category}</p>
            </div>
          </motion.div>
        )}
        <SwipeSurface
          wheelGate={wheelGate}
          wheelTarget={wheelTarget}
          progress={progress}
          controlRef={control}
          focusHandoffRef={swipeFocus}
          key={idea.id}
          className="group-swipe"
          disabled={busy}
          label={`${idea.title}. Left arrow to pass, right arrow for Ditto.`}
          onSwipe={cast}
        >
          <ActivityPhoto
            key={idea.id}
            src={idea.image}
            alt={idea.imageKind ? idea.title : `${idea.category} inspiration, not a verified venue`}
          />
          <span className="group-photo-note">{idea.imageKind === "upload" ? "Activity photo" : idea.imageKind === "venue" ? "Venue photo" : "Illustrative photo"}</span>
          <div
            className={`group-caption ${idea.title.length > 70 ? "long-title" : ""}`}
          >
            <span className="pill white">{idea.category}</span>
            <h2>{idea.title}</h2>
            {activity ? <ActivityMetadata activity={activity}/> : <p>{idea.slot || "Choose the details together"}</p>}
            <div className="group-card-footer"><span className="small">
              <span className="inline-avatar"><Avatar person={c.members.find(m => m.id === idea.creator) || {name:"Member"}}/></span> Suggested by{" "}
              {c.members.find((m) => m.id === idea.creator)?.name || "a member"}
            </span>
            <button className="group-details" onClick={() => { if (activity && onDetails) onDetails(activity); else setDetails(v => !v); }} aria-label="View activity details">Details <ArrowUpRight size={16}/></button>
            </div>
          </div>
        </SwipeSurface>
      </div>
      <div className="vote-buttons">
        <button className="group-undo-button" aria-label="Undo last swipe" title="Undo last swipe" disabled={busy || !c.undoVote || c.undoVoteBlocked} onClick={() => c.undoVote && act({type: "undoSwipe", operation: c.undoVote.id}, "Vote undone. Choose again.")}><Undo2 size={18}/><span>Undo</span></button>
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
      <p className="small muted">Drag or swipe horizontally with two fingers. You can also use ← / →.</p>
      {details && <div className="idea-details" role="region" aria-label="Activity details"><h3>{idea.title}</h3><p>{idea.notes || "No additional details yet."}</p>{idea.slot && <p>{idea.slot}</p>}<p>Venue and cost to decide together.</p><button className="text-button" onClick={() => setDetails(false)}>Close details</button></div>}
      </div>
    </section>
  );
}
