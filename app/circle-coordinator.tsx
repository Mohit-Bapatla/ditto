"use client";
import { useState, useRef, useEffect } from "react";
import type { Circle } from "@/lib/types";
import { categories } from "@/lib/types";
import { groupFacts } from "@/lib/coordination";
import { Avatar } from "./profile-photo";
type Proposal = {
  id: string;
  title: string;
  category: string;
  timing: string;
  uncertainty: string[];
  evidence: { messageId: string; quote: string }[];
  source: string;
};
type Suggestion = { ideaIds: string[]; rationale: string; tradeoff: string };
export function CircleCoordinator({
  circle: c,
  user,
  live,
  act,
  onPlaces,
}: {
  circle: Circle;
  user: string;
  live: boolean;
  act: (body: unknown, message?: string) => Promise<unknown>;
  onPlaces: (query: string) => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const latestMessageId = c.messages.at(-1)?.id;
  useEffect(() => {
    if (nearBottom.current && log.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [latestMessageId]);
  const [text, setText] = useState("");
  const [nonce, setNonce] = useState(() => crypto.randomUUID());
  const [selected, setSelected] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [proposal, setProposal] = useState<Proposal>();
  const [suggestions, setSuggestions] = useState<Suggestion[]>();
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const facts = groupFacts(c);
  async function coordinate(kind: string, demo: boolean) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/coordination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circle: c.id,
          kind,
          demo,
          consent,
          messageIds: selected,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.proposal) setProposal(d.proposal);
      else {
        setSuggestions(d.suggestions);
        setSource(d.source);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="coordination-grid">
      <section className="plan-card chat-panel">
        <h2>Your group chat</h2>
        <p className="muted small">
          Private to this Circle · updates every five seconds · showing the
          latest 100 messages.
        </p>
        <div className="chat-tools">
          <span>{c.members.length} people · private</span>
          <button
            type="button"
            aria-pressed={selecting}
            onClick={() => setSelecting(!selecting)}
          >
            {selecting ? "Done selecting" : "Select messages for a plan"}
          </button>
        </div>
        <div
          ref={log}
          onScroll={(e) => {
            nearBottom.current =
              e.currentTarget.scrollHeight -
                e.currentTarget.scrollTop -
                e.currentTarget.clientHeight <
              60;
          }}
          className="chat-log"
          role="log"
          aria-label="Circle messages"
          aria-live="polite"
        >
          {!c.messages.length && (
            <p className="empty-small">
              Break the ice. What would make a good Saturday?
            </p>
          )}
          {c.messages.map((m) => (
            <article
              className={`chat-message ${m.user === user ? "mine" : ""}`}
              key={m.id}
            >
              <div className="between">
                <strong>
                  <span className="inline-avatar"><Avatar person={c.members.find(member => member.id === m.user) || {name:m.name,photo:m.photo}}/></span> {m.name}
                </strong>
                <time dateTime={m.createdAt}>
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p>{m.text}</p>
              {selecting && (
                <label className="small">
                  <input
                    type="checkbox"
                    aria-label={`Select message: ${m.text}`}
                    checked={selected.includes(m.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, m.id].slice(-20)
                          : selected.filter((id) => id !== m.id),
                      )
                    }
                  />{" "}
                  Include in proposal review
                </label>
              )}
            </article>
          ))}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              if (await act({ type: "chat", circle: c.id, text, nonce })) {
                setText("");
                setNonce(crypto.randomUUID());
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor="chat-message">Message your Circle</label>
          <textarea
            id="chat-message"
            maxLength={1000}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anyone down for volleyball Saturday?"
          />
          <button className="primary" disabled={busy || !text.trim()}>
            Send message
          </button>
        </form>
        <details>
          <summary>Try a planning conversation</summary>
          <p className="small">
            Send these as separate members, then select the messages. This is a
            fixed sample, not live AI extraction.
          </p>
          <ul>
            <li>Anyone down for volleyball Saturday?</li>
            <li>I&apos;m down.</li>
            <li>I can&apos;t until 5.</li>
            <li>Works for me.</li>
          </ul>
        </details>
      </section>
      <section className="plan-card autopilot-panel">
        <h2>Plan from your chat</h2>
        <p>
          {selected.length} of 20 messages selected. Review the suggestion, edit
          it, then let everyone vote.
        </p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />{" "}
          I agree to process only these selected Circle messages. Live mode
          sends them to Meta.
        </label>
        <div className="button-row">
          <button
            className="secondary"
            disabled={busy || !consent || !selected.length}
            onClick={() => coordinate("proposal", true)}
          >
            Try sample extraction · no AI
          </button>
          <button
            className="primary"
            disabled={busy || !consent || !selected.length || !live}
            onClick={() => coordinate("proposal", false)}
          >
            Suggest with Muse Spark
          </button>
        </div>
        {!live && (
          <p className="small muted">
            Live AI is paused. You can still organize the conversation here.
          </p>
        )}
        {busy && <p role="status">Preparing your review…</p>}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {proposal && (
          <form
            className="proposal-review"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await act(
                  {
                    type: "acceptProposal",
                    proposal: proposal.id,
                    timing: proposal.timing,
                    title: proposal.title,
                    category: proposal.category,
                  },
                  "Added to Ideas. Everyone still gets a vote.",
                )
              )
                setProposal(undefined);
            }}
          >
            <span className="pill lavender">
              {proposal.source === "demo"
                ? "Suggested plan · review together"
                : "AI suggestion · review required"}
            </span>
            <h3>Looks like a plan is forming!</h3>
            <label htmlFor="proposal-title">Edit proposal</label>
            <input
              id="proposal-title"
              required
              maxLength={120}
              value={proposal.title}
              onChange={(e) =>
                setProposal({ ...proposal, title: e.target.value })
              }
            />
            <label htmlFor="proposal-category">Category</label>
            <select
              id="proposal-category"
              value={proposal.category}
              onChange={(e) =>
                setProposal({ ...proposal, category: e.target.value })
              }
            >
              {categories.slice(1).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <label htmlFor="proposal-timing">
              Proposed timing (unconfirmed)
            </label>
            <input
              id="proposal-timing"
              maxLength={160}
              value={proposal.timing}
              onChange={(e) =>
                setProposal({ ...proposal, timing: e.target.value })
              }
            />
            <p className="small">
              Compare with the original messages. This does not set a calendar
              date or confirm availability.
            </p>
            <ul>
              {proposal.uncertainty.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <details>
              <summary>
                Conversation evidence · not confirmed attendance
              </summary>
              {proposal.evidence.map((e, i) => (
                <blockquote key={i}>
                  <strong>
                    {c.messages.find((m) => m.id === e.messageId)?.name}:{" "}
                  </strong>
                  {e.quote}
                </blockquote>
              ))}
            </details>
            <div className="button-row">
              <button className="primary" disabled={busy}>
                Approve adding to Ideas
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => onPlaces(proposal.title)}
              >
                Find Places
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setProposal(undefined)}
              >
                Dismiss
              </button>
            </div>
          </form>
        )}
        <hr />
        <h3>Your constraints, in your words.</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await act(
              { type: "constraints", circle: c.id, text: f.get("constraints") },
              "Your constraints are saved.",
            );
          }}
        >
          <label htmlFor="constraints">
            Availability, budget or accessibility needs (optional)
          </label>
          <textarea
            id="constraints"
            name="constraints"
            maxLength={500}
            defaultValue={
              c.constraints.find((x) => x.user === user)?.text || ""
            }
            placeholder="After 5 PM, under $25, near campus"
          />
          <button className="secondary">Save my constraints</button>
        </form>
        <h3>Common ground</h3>
        <p className="small">
          Counts come from saved votes. Suggestions never change consensus.
        </p>
        {!facts.complete ? (
          <p>Finish the round to reveal group preferences.</p>
        ) : (
          <ul>
            {facts.consensus.map((i) => (
              <li key={i.id}>
                <strong>{i.title}</strong> · {i.yes}/{i.total} yes · {i.kind}
              </li>
            ))}
          </ul>
        )}
        <ul>
          {c.constraints.map((x) => (
            <li key={x.user}>
              {c.members.find((m) => m.id === x.user)?.name}:{" "}
              {x.text || "No constraint supplied"}
            </li>
          ))}
        </ul>
        <div className="button-row">
          <button
            className="secondary"
            disabled={!facts.complete || !consent || busy}
            onClick={() => coordinate("synthesis", true)}
          >
            Review group fit · no AI
          </button>
          <button
            className="primary"
            disabled={!facts.complete || !consent || busy || !live}
            onClick={() => coordinate("synthesis", false)}
          >
            Synthesize with Muse Spark
          </button>
        </div>
        {suggestions && (
          <div>
            <p className="pill lavender">
              {source === "demo"
                ? "Ideas to discuss"
                : "AI-suggested compromises · not agreement"}
            </p>
            {suggestions.map((s, i) => (
              <div key={i}>
                <h4>
                  {s.ideaIds
                    .map((id) => c.ideas.find((i) => i.id === id)?.title)
                    .join(" + ")}
                </h4>
                <p>{s.rationale}</p>
                <p className="small">{s.tradeoff}</p>
              </div>
            ))}
          </div>
        )}
        <ul className="small muted">
          {facts.unresolved.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
