"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  Compass,
  Users,
  CalendarDays,
  UserRound,
  MapPin,
  Plus,
  ArrowUpRight,
  ArrowRight,
  X,
  Heart,
  SlidersHorizontal,
  Sparkles,
  Check,
  ChevronDown,
  Clock,
  Copy,
  ArrowLeft,
  ExternalLink,
  LoaderCircle,
  Leaf,
  Utensils,
  CircleDot,
  Gamepad2,
  Palette,
  Music,
  Dumbbell,
  RotateCcw,
  Search,
  CheckCheck,
  Navigation,
  PartyPopper,
} from "lucide-react";
import {
  categories,
  type State,
  type Activity,
  type Idea,
  type Plan,
  type Venue,
} from "@/lib/types";
const icons = [
  Compass,
  Leaf,
  Utensils,
  CircleDot,
  Gamepad2,
  Palette,
  Music,
  Dumbbell,
];
const fmt = (s: string) =>
  new Date(s).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const tomorrow = () => {
  const d = new Date(Date.now() + 86400000);
  d.setHours(18, 0, 0, 0);
  return new Date(+d - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
async function request(url: string, body?: unknown) {
  const res = await fetch(
    url,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not complete the request.");
  return data;
}
function Logo() {
  return (
    <span className="wordmark">
      <span className="brand-mark">
        <i />
        <i />
      </span>
      ditto<span className="brand-dot">.</span>
    </span>
  );
}
function Avatars({
  members,
}: {
  members: { id: string; avatar: string; name: string }[];
}) {
  return (
    <div className="avatars">
      {members.slice(0, 5).map((m) => (
        <span key={m.id} title={m.name}>
          {m.avatar}
        </span>
      ))}
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={close} aria-label="Close dialog">
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function SwipeCard({
  activity,
  onSwipe,
  onDetails,
  disabled,
}: {
  activity: Activity;
  onSwipe: (yes: boolean) => void;
  onDetails: () => void;
  disabled: boolean;
}) {
  const x = useMotionValue(0),
    rotate = useTransform(x, [-250, 250], [-15, 15]),
    yes = useTransform(x, [30, 120], [0, 1]),
    no = useTransform(x, [-120, -30], [1, 0]);
  return (
    <motion.article
      className="swipe-card"
      style={{ x, rotate }}
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 95) onSwipe(info.offset.x > 0);
      }}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      tabIndex={0}
      aria-label={`${activity.title}. Use left arrow to pass, right arrow for interested.`}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
          e.preventDefault();
          onSwipe(e.key === "ArrowRight");
        }
      }}
    >
      <img
        className="hero-photo"
        src={activity.image}
        alt={
          activity.category === "Outdoors"
            ? "Sunlit greenery and open space"
            : `${activity.category} activity inspiration`
        }
        draggable={false}
      />
      <div className="photo-shade" />
      <div className="card-top">
        <span className="pill white">
          <span className="online-dot" />
          {activity.category}
        </span>
        <span className="pill translucent">
          {activity.demo ? "Demo activity" : "Community activity"}
        </span>
      </div>
      <motion.div className="swipe-stamp yes" style={{ opacity: yes }}>
        DITTO!
      </motion.div>
      <motion.div className="swipe-stamp no" style={{ opacity: no }}>
        PASS
      </motion.div>
      <div className="card-caption">
        <span className="eyebrow">A LITTLE OUTSIDE YOUR EVERYDAY</span>
        <h2>{activity.title}</h2>
        <p>
          <MapPin size={15} />
          {activity.venue} <span>·</span> {activity.city}
        </p>
      </div>
      <div className="card-details">
        <div className="card-facts">
          <span>
            <CalendarDays size={16} />
            {fmt(activity.start)}
          </span>
          <strong>
            {activity.budget === 0 ? "Free" : `~$${activity.budget} / person`}
          </strong>
        </div>
        <p>{activity.description}</p>
        <div className="card-bottom">
          <div>
            <span className="tiny-avatar">
              {activity.category === "Outdoors" ? "🌞" : "✌️"}
            </span>
            <span>
              {activity.attending} / {activity.capacity} going{" "}
              <small>Hosted by {activity.host || "a community member"}</small>
            </span>
          </div>
          <button
            className="round-small"
            onClick={onDetails}
            aria-label="View activity details"
          >
            <ArrowUpRight size={20} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
export default function Home() {
  const [data, setData] = useState<State>();
  const [page, setPage] = useState("Discover");
  const [selected, setSelected] = useState<string>();
  const [modal, setModal] = useState<string>();
  const [detail, setDetail] = useState<Activity>();
  const [category, setCategory] = useState("All vibes");
  const [budget, setBudget] = useState(1000);
  const [city, setCity] = useState("");
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [found, setFound] = useState<Venue[]>([]);
  const [searchNote, setSearchNote] = useState("");
  const [invite, setInvite] = useState("");
  const [circleTab, setCircleTab] = useState("Ideas");
  const [planStart, setPlanStart] = useState(tomorrow());
  const [origin, setOrigin] = useState("UT Austin");
  const [drive, setDrive] = useState("");
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    try {
      setData(await request("/api/state"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const init = window.setTimeout(() => {
      void refresh();
      const code = new URLSearchParams(location.search).get("invite");
      if (code) {
        setInvite(code);
        setModal("join");
      }
    }, 0);
    const timer = setInterval(() => {
      if (!pending.current) void refresh();
    }, 5000);
    return () => {
      clearTimeout(init);
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const act = async (body: unknown, message?: string) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/action", body);
      setData(r.state);
      if (message) setToast(message);
      return r;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const close = () => {
    setModal(undefined);
    setDetail(undefined);
    setError("");
    setDrive("");
  };
  const navigate = (p: string) => {
    setPage(p);
    setSelected(undefined);
    setError("");
  };
  const c = data?.circles.find((c) => c.id === selected);
  const deck =
    data?.activities.filter(
      (a) =>
        !a.swipe &&
        (category === "All vibes" || a.category === category) &&
        a.budget <= budget &&
        (!city || a.city.toLowerCase().includes(city.toLowerCase())) &&
        (!available || a.attending < a.capacity),
    ) || [];
  const top = deck[0];
  const onSwipe = async (yes: boolean) => {
    if (top)
      await act(
        { type: "swipe", activity: top.id, direction: yes ? "yes" : "no" },
        yes
          ? "Saved to your interested list. Join when you’re ready."
          : undefined,
      );
  };
  async function submit(e: FormEvent<HTMLFormElement>, type: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(form);
    let body: Record<string, unknown> = { type, ...values };
    if (type === "activity")
      body = {
        ...body,
        budget: Number(values.budget),
        capacity: Number(values.capacity),
        start: new Date(String(values.start)).toISOString(),
      };
    if (type === "circle") body = { ...body, budget: Number(values.budget) };
    if (type === "idea") body = { ...body, circle: selected };
    if (type === "profile")
      body = {
        ...body,
        budget: Number(values.budget),
        interests: form.getAll("interests"),
      };
    const r = await act(
      body,
      type === "profile" ? "Your profile is saved." : "All set!",
    );
    if (r) {
      close();
      if (type === "profile" && invite) setModal("join");
      if (type === "circle") {
        setSelected(r.id);
        setPage("Circles");
      }
      if (type === "join") {
        setSelected(r.id);
        setPage("Circles");
        window.history.replaceState({}, "", location.pathname);
      }
    }
  }
  async function findPlaces(natural = false) {
    if (!search.trim()) return;
    setBusy(true);
    setError("");
    setFound([]);
    try {
      const r = await request("/api/places", {
        query: search,
        city: city || data?.user.city || "Austin, TX",
        natural,
      });
      setFound(r.venues);
      setSearchNote(
        r.explanation +
          (r.venues.length ? "" : " No venues found. Try a broader search."),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function generate(demo: boolean) {
    if (!c) return;
    setBusy(true);
    pending.current = true;
    setError("");
    try {
      await request("/api/plan", {
        circle: c.id,
        start: new Date(planStart).toISOString(),
        demo,
      });
      await refresh();
      close();
      setCircleTab("Plans");
      setToast(
        demo
          ? "Demo draft created. Every member still needs to approve."
          : "Your plan is ready for everyone to review.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied. Share it when you’re ready.");
    } catch {
      setError("Clipboard unavailable. Select and copy the invitation text.");
    }
  }
  if (!data)
    return (
      <main className="loading">
        <Logo />
        <LoaderCircle className="spin" />
        <p>{error || "Finding your next good memory…"}</p>
        {error && <button onClick={refresh}>Try again</button>}
      </main>
    );
  const allPlans = data.circles.flatMap((c) => c.plans);
  const interested = data.activities.filter(
    (a) => a.status === "interested" || a.status === "attending",
  );
  const planView = (p: Plan) => (
    <article className="plan-card" key={p.id}>
      <div className="between">
        <span
          className={`pill ${p.status === "confirmed" ? "green" : "lavender"}`}
        >
          {p.status === "confirmed" ? (
            <CheckCheck size={14} />
          ) : (
            <Clock size={14} />
          )}{" "}
          {p.status === "confirmed"
            ? "Group approved"
            : "Awaiting group approval"}
        </span>
        <span className="small muted">
          {p.source === "demo" ? "Demo draft · no AI" : "Meta AI + SerpApi"}
        </span>
      </div>
      <h2>{p.title}</h2>
      <p className="muted">{p.explanation}</p>
      <p className="date-line">
        <CalendarDays size={17} />
        {fmt(p.start)}{" "}
        <span className="small">
          ({Intl.DateTimeFormat().resolvedOptions().timeZone})
        </span>
      </p>
      <div className="itinerary">
        {p.stops.map((stop, i) => (
          <div className="stop" key={i}>
            <span className="stop-number">{i + 1}</span>
            <div>
              <h3>{stop.title}</h3>
              <p>
                {stop.venue?.name || "Venue to be decided"}{" "}
                <span className="small muted">
                  · {stop.duration} min suggested
                </span>
              </p>
              {stop.venue && (
                <>
                  <p className="small muted">{stop.venue.address}</p>
                  <a href={stop.venue.url} target="_blank" rel="noreferrer">
                    View on Maps <ExternalLink size={12} />
                  </a>
                </>
              )}
              <p className="small muted">{stop.note}</p>
              {i > 0 && (
                <p className="small drive">
                  <Navigation size={12} />
                  {stop.drive
                    ? `${stop.drive.duration} drive · ${stop.drive.distance}`
                    : "Drive time unavailable; allow extra travel time"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="small muted">
        {p.approvals.length} / {p.eligible.length} approvals · Opening hours,
        budget, and reservations must be checked by the group.
      </p>
      <div className="button-row">
        {p.status === "proposed" ? (
          <button
            className="primary"
            disabled={
              busy ||
              p.approvals.includes(data.user.id) ||
              !p.eligible.includes(data.user.id)
            }
            onClick={() =>
              act({ type: "approve", plan: p.id }, "Your approval is saved.")
            }
          >
            {p.approvals.includes(data.user.id)
              ? "You approved"
              : "Approve this plan"}
            <Check size={17} />
          </button>
        ) : (
          <>
            <a className="primary" href={`/api/calendar?id=${p.id}`}>
              <CalendarDays size={17} />
              Add to Calendar
            </a>
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                act({
                  type: "rsvp",
                  plan: p.id,
                  going: !p.rsvps.includes(data.user.id),
                })
              }
            >
              {p.rsvps.includes(data.user.id)
                ? "Withdraw RSVP"
                : "RSVP · I’m going"}
            </button>
          </>
        )}
        <button
          className="icon-btn"
          aria-label="Copy plan invitation"
          onClick={() =>
            copy(
              `${p.title}\n${fmt(p.start)}\n${p.status === "confirmed" ? "Group approved" : "Proposed, awaiting approval"}\n${p.stops.map((s) => s.title + " — " + (s.venue?.name || "venue to be decided")).join("\n")}`,
            )
          }
        >
          <Copy size={18} />
        </button>
      </div>
      {p.status === "confirmed" && (
        <p className="small muted">
          {p.rsvps.length} RSVP{p.rsvps.length === 1 ? "" : "s"} · Calendar
          download is manual; no invitations or reminders have been sent.
        </p>
      )}
    </article>
  );
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <aside className="sidebar">
          <button
            className="logo-button"
            onClick={() => navigate("Discover")}
            aria-label="Ditto home"
          >
            <Logo />
          </button>
          <div className="nav-label">MAKE ROOM FOR REAL LIFE</div>
          <nav>
            {[
              { name: "Discover", icon: Compass },
              { name: "Circles", icon: Users },
              { name: "Plans", icon: CalendarDays },
              { name: "Profile", icon: UserRound },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={page === name ? "active" : ""}
                onClick={() => navigate(name)}
              >
                <Icon size={21} />
                <span>{name}</span>
                {name === "Circles" && <small>{data.circles.length}</small>}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="mini-mark">✳</span>
            <h3>“We should hang out.”</h3>
            <p>
              Let’s make that
              <br />
              actually happen.
            </p>
            <button
              onClick={() => {
                setPage("Circles");
                setSelected(data.circles[0]?.id);
              }}
            >
              Find your people <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="sidebar-bottom">
            <span className="pill lavender small">
              ✦ {data.user.demo ? "Demo sandbox" : "Personal session"}
            </span>
            <button
              className="profile-mini"
              onClick={() => navigate("Profile")}
            >
              <span className="avatar">{data.user.avatar}</span>
              <span>
                <strong>{data.user.name}</strong>
                <small>{data.user.city}</small>
              </span>
              <ChevronDown size={16} />
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="mobile-logo">
              <Logo />
            </div>
            <span className="desktop-only">Good people. Great plans.</span>
            <div className="top-actions">
              <button
                className="location-button"
                onClick={() => setModal("filters")}
              >
                <MapPin size={16} />
                {city || data.user.city}
                <ChevronDown size={13} />
              </button>
              <span className="top-divider" />
              <button
                className="avatar small-avatar"
                aria-label="Open profile"
                onClick={() => navigate("Profile")}
              >
                {data.user.avatar}
              </button>
            </div>
          </header>
          <main className="main-content">
            {error && !modal && !detail && (
              <div role="alert" className="error-banner">
                {error}
                <button onClick={() => setError("")} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </div>
            )}
            {page === "Discover" && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow purple">
                      LESS SCROLLING. MORE LIVING.
                    </div>
                    <h1>
                      Your kind of <span className="serif">good time.</span>
                      <span className="heading-spark">✳</span>
                    </h1>
                    <p>
                      Find something you love. Meet people who feel the same.
                    </p>
                  </div>
                  <button
                    className="secondary create-btn"
                    onClick={() => setModal("activity")}
                  >
                    <Plus size={17} />
                    Create activity
                  </button>
                </div>
                <div className="filter-row">
                  <div className="category-list">
                    {categories.map((cat, i) => {
                      const Icon = icons[i];
                      return (
                        <button
                          className={category === cat ? "selected" : ""}
                          key={cat}
                          onClick={() => setCategory(cat)}
                        >
                          <Icon size={15} />
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="filter-btn"
                    onClick={() => setModal("filters")}
                    aria-label="Filter activities"
                  >
                    <SlidersHorizontal size={18} />
                  </button>
                </div>
                <div className="discover-grid">
                  <section className="deck-section">
                    <div className="section-meta">
                      <span>
                        <span className="online-dot" /> A LITTLE POSSIBILITY,
                        NEAR YOU
                      </span>
                      <small>{deck.length} to discover</small>
                    </div>
                    <div className="deck-stack">
                      <AnimatePresence mode="wait">
                        {top ? (
                          <SwipeCard
                            key={top.id}
                            activity={top}
                            disabled={busy}
                            onSwipe={onSwipe}
                            onDetails={() => setDetail(top)}
                          />
                        ) : (
                          <motion.div
                            className="empty-state deck-empty"
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <span className="empty-icon">✦</span>
                            <h2>You’re all caught up.</h2>
                            <p>
                              Good things take a little space. Try another vibe
                              or revisit the deck.
                            </p>
                            <button
                              className="primary"
                              onClick={() =>
                                act(
                                  { type: "resetDeck" },
                                  "Your deck is ready for another look.",
                                )
                              }
                            >
                              <RotateCcw size={16} />
                              Revisit activities
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="swipe-controls">
                      <button
                        className="swipe-action pass"
                        aria-label="Pass on activity"
                        disabled={!top || busy}
                        onClick={() => onSwipe(false)}
                      >
                        <X size={28} />
                      </button>
                      <span>
                        Not your thing?
                        <br />
                        <strong>Find your ditto.</strong>
                      </span>
                      <button
                        className="swipe-action heart"
                        aria-label="Interested in activity"
                        disabled={!top || busy}
                        onClick={() => onSwipe(true)}
                      >
                        <Heart size={28} />
                      </button>
                    </div>
                    <div className="swipe-hint">
                      ← Pass <span>Drag a card or use the buttons</span>{" "}
                      Interested →
                    </div>
                  </section>
                  <aside className="discovery-aside">
                    <div className="circle-promo">
                      <div className="between">
                        <span className="eyebrow">BETTER WITH YOUR PEOPLE</span>
                        <span className="orbital">
                          <i />
                          <i />
                        </span>
                      </div>
                      <h2>
                        The group chat.
                        <br />
                        <span className="serif">With actual plans.</span>
                      </h2>
                      <p>
                        Your friends. A few ideas. One big
                        <br className="desktop-only" /> “okay, let’s do it.”
                      </p>
                      <button
                        className="primary"
                        onClick={() => {
                          setPage("Circles");
                          setSelected(data.circles[0]?.id);
                          setCircleTab("Ideas");
                        }}
                      >
                        Find your group’s ditto <ArrowRight size={16} />
                      </button>
                      <div className="social-proof">
                        <Avatars
                          members={data.circles[0]?.members || [data.user]}
                        />
                        <span>
                          {data.circles[0]?.name || "Your next Circle"}
                          <small>
                            {data.circles[0]?.demo
                              ? "Fictional crew. Real decisions."
                              : "Make a little room for each other."}
                          </small>
                        </span>
                      </div>
                    </div>
                    <div className="inspiration">
                      <div className="between">
                        <span className="eyebrow">A LITTLE INSPIRATION</span>
                        <Sparkles size={17} />
                      </div>
                      <h3>What are you in the mood for?</h3>
                      <p>
                        Tell Ditto your vibe. Find real places to make it
                        happen.
                      </p>
                      <button
                        className="search-prompt"
                        onClick={() => {
                          setSearch("Something active under $20");
                          setModal("search");
                        }}
                      >
                        “Something active under $20”
                        <ArrowUpRight size={17} />
                      </button>
                      <span className="source-note">
                        Meta AI + places from SerpApi
                      </span>
                    </div>
                    <div className="manifesto">
                      <span>✳</span>
                      <p>
                        Less “we should.”
                        <br />
                        More <em>“remember when?”</em>
                      </p>
                      <small>YOU WANNA GO? DITTO.</small>
                    </div>
                  </aside>
                </div>
                <div className="demo-footnote">
                  {data.user.demo
                    ? "You’re exploring fictional activities in your private demo sandbox. Photos are illustrative."
                    : "Activities are community-created meetups. Venue availability is not verified."}
                </div>
              </>
            )}
            {page === "Circles" && !c && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow purple">
                      YOUR PEOPLE, YOUR PLANS
                    </div>
                    <h1>
                      Good things come{" "}
                      <span className="serif">in Circles.</span>
                    </h1>
                    <p>A little less back-and-forth. A lot more together.</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() =>
                      setModal(data.user.demo ? "profile" : "circle")
                    }
                  >
                    <Plus size={17} />
                    Create a Circle
                  </button>
                </div>
                <div className="circle-grid">
                  {data.circles.map((circle) => (
                    <button
                      className="circle-tile"
                      key={circle.id}
                      onClick={() => {
                        setSelected(circle.id);
                        setCircleTab("Ideas");
                      }}
                    >
                      <div className="tile-art">
                        <span>✳</span>
                        <span>✽</span>
                        <span>✦</span>
                      </div>
                      <div className="between">
                        <h2>{circle.name}</h2>
                        <ArrowUpRight />
                      </div>
                      <p>{circle.description}</p>
                      <Avatars members={circle.members} />
                      <div className="between small muted">
                        <span>
                          {circle.members.length} members ·{" "}
                          {circle.ideas.length} ideas
                        </span>
                        <span>
                          {circle.demo ? "Demo Circle" : "Private Circle"}
                        </span>
                      </div>
                    </button>
                  ))}
                  <button
                    className="circle-tile join-tile"
                    onClick={() => setModal("join")}
                  >
                    <Users size={35} />
                    <h2>Got an invite?</h2>
                    <p>Good company is one link away.</p>
                    <span className="text-link">
                      Join a Circle <ArrowRight size={16} />
                    </span>
                  </button>
                </div>
              </>
            )}
            {page === "Circles" && c && (
              <>
                <button
                  className="back-link"
                  onClick={() => setSelected(undefined)}
                >
                  <ArrowLeft size={16} />
                  All Circles
                </button>
                <div className="page-heading circle-heading">
                  <div>
                    <div className="eyebrow purple">
                      {c.demo
                        ? "FICTIONAL FRIENDS · PRIVATE DEMO"
                        : "YOUR PRIVATE CIRCLE"}
                    </div>
                    <h1>
                      {c.name}
                      <span className="heading-spark">✳</span>
                    </h1>
                    <p>{c.description}</p>
                  </div>
                  <div>
                    <Avatars members={c.members} />
                    <p className="small muted">
                      {c.members.map((m) => m.name).join(", ")}
                    </p>
                  </div>
                </div>
                {c.demo ? (
                  <div className="demo-switch">
                    <span>
                      <strong>Try every perspective.</strong> Switch fictional
                      members to cast independent votes.
                    </span>
                    <div>
                      {data.demoUsers
                        .filter((p) => c.members.some((m) => m.id === p.id))
                        .map((p) => (
                          <button
                            className={p.id === data.user.id ? "selected" : ""}
                            key={p.id}
                            disabled={busy}
                            onClick={() => act({ type: "switch", user: p.id })}
                          >
                            {p.avatar} {p.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="invite-row">
                    <span className="small muted">
                      Invite a friend to make decisions together.
                    </span>
                    <button
                      className="secondary"
                      onClick={() =>
                        copy(`${location.origin}/?invite=${c.invite}`)
                      }
                    >
                      <Copy size={15} />
                      Copy invite link
                    </button>
                  </div>
                )}
                <div className="tabs">
                  {["Ideas", "Matches", "Plans"].map((t) => (
                    <button
                      key={t}
                      className={circleTab === t ? "active" : ""}
                      onClick={() => setCircleTab(t)}
                    >
                      {t}
                      {t === "Plans" && c.plans.length > 0 && (
                        <small>{c.plans.length}</small>
                      )}
                    </button>
                  ))}
                </div>
                {circleTab === "Ideas" && (
                  <>
                    <div className="round-banner">
                      <div>
                        <span className="eyebrow purple">
                          {c.round?.complete
                            ? "ROUND COMPLETE"
                            : c.round
                              ? "FIND YOUR COMMON GROUND"
                              : "A GOOD PLAN STARTS WITH AN IDEA"}
                        </span>
                        <h2>
                          {c.round
                            ? `${c.round.completed} of ${c.round.total} members finished`
                            : "What should we do together?"}
                        </h2>
                        <p>
                          {c.round
                            ? "Votes stay private until everyone finishes."
                            : "Add ideas, then give everyone a say."}
                        </p>
                      </div>
                      <div className="button-row">
                        <button
                          className="secondary"
                          onClick={() => setModal("idea")}
                        >
                          <Plus size={16} />
                          Add idea
                        </button>
                        {!c.round || c.round.complete ? (
                          <button
                            className="primary"
                            onClick={() => setModal("round")}
                          >
                            {c.round ? "New round" : "Start a round"}
                            <ArrowRight size={16} />
                          </button>
                        ) : (
                          <span className="pill lavender">
                            {c.round.threshold === "everyone"
                              ? "Everyone agrees"
                              : "Majority agrees"}
                          </span>
                        )}
                      </div>
                    </div>
                    {c.round && (
                      <div className="progress-track">
                        <div
                          style={{
                            width: `${(c.round.completed / c.round.total) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                    <div className="idea-grid">
                      {c.ideas.map((idea: Idea) => (
                        <article className="idea-card" key={idea.id}>
                          <img
                            src={idea.image}
                            alt={`${idea.category} inspiration`}
                          />
                          <div className="idea-content">
                            <span className="eyebrow purple">
                              {idea.category}
                            </span>
                            <h3>{idea.title}</h3>
                            <p className="small muted">
                              From{" "}
                              {c.members.find((m) => m.id === idea.creator)
                                ?.name || "a member"}
                            </p>
                            {c.round &&
                            !c.round.complete &&
                            c.round.ideaIds.includes(idea.id) ? (
                              idea.vote === undefined ? (
                                <div className="vote-buttons">
                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      act({
                                        type: "vote",
                                        circle: c.id,
                                        idea: idea.id,
                                        vote: false,
                                      })
                                    }
                                  >
                                    <X size={17} />
                                    Pass
                                  </button>
                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      act(
                                        {
                                          type: "vote",
                                          circle: c.id,
                                          idea: idea.id,
                                          vote: true,
                                        },
                                        "Your vote is saved.",
                                      )
                                    }
                                  >
                                    <Heart size={17} />
                                    Ditto
                                  </button>
                                </div>
                              ) : (
                                <div className="voted">
                                  <Check size={17} />
                                  You voted {idea.vote ? "yes" : "pass"}
                                </div>
                              )
                            ) : (
                              <span className="small muted">
                                {c.round?.complete && idea.yes !== undefined
                                  ? `${idea.yes} / ${c.round.total} said yes`
                                  : "Ready for the next round"}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                    {c.round?.complete && (
                      <button
                        className="primary reveal-button"
                        onClick={() => setCircleTab("Matches")}
                      >
                        <PartyPopper size={18} />
                        Reveal your matches
                      </button>
                    )}
                  </>
                )}
                {circleTab === "Matches" &&
                  (c.round?.complete ? (
                    <>
                      <motion.div
                        className="match-reveal"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="match-sparkles">
                          ✦ <span>✳</span> ✧
                        </div>
                        <Avatars members={c.members} />
                        <div className="eyebrow purple">
                          THE FEELING IS MUTUAL
                        </div>
                        <h1>
                          {c.ideas.some((i) => i.matched)
                            ? "It’s a ditto."
                            : "Not quite a ditto. Yet."}
                        </h1>
                        <p>
                          {c.ideas.some((i) => i.matched)
                            ? "Less deciding. More making memories."
                            : "Try a majority round, or add a few fresh ideas."}
                        </p>
                        <div className="match-list">
                          {c.ideas
                            .filter((i) => i.yes !== undefined)
                            .sort((a, b) => (b.yes || 0) - (a.yes || 0))
                            .map((i) => (
                              <div key={i.id}>
                                <span>{i.matched ? "💜" : "✦"}</span>
                                <strong>{i.title}</strong>
                                <span
                                  className={`pill ${i.matched ? "lavender" : ""}`}
                                >
                                  {i.unanimous
                                    ? "Everyone’s in"
                                    : `${i.yes} / ${c.round!.total} said yes`}
                                </span>
                              </div>
                            ))}
                        </div>
                        {c.ideas.some((i) => i.matched) && (
                          <button
                            className="primary"
                            onClick={() => setModal("plan")}
                          >
                            <Sparkles size={18} />
                            Plan our hangout
                          </button>
                        )}
                        <p className="small muted">
                          Matches express interest. Plans still need everyone’s
                          approval.
                        </p>
                      </motion.div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <Heart />
                      <h2>A little suspense is a good thing.</h2>
                      <p>
                        Everyone needs to finish the round before matches are
                        revealed.
                      </p>
                      <button
                        className="primary"
                        onClick={() => setCircleTab("Ideas")}
                      >
                        Back to ideas
                      </button>
                    </div>
                  ))}
                {circleTab === "Plans" &&
                  (c.plans.length ? (
                    <div className="plans-list">{c.plans.map(planView)}</div>
                  ) : (
                    <div className="empty-state">
                      <CalendarDays />
                      <h2>Your next story starts here.</h2>
                      <p>Finish a round and turn a match into a plan.</p>
                      <button
                        className="primary"
                        onClick={() => setCircleTab("Matches")}
                      >
                        See matches
                      </button>
                    </div>
                  ))}
              </>
            )}
            {page === "Plans" && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow purple">MAKE “SOMEDAY” A DATE</div>
                    <h1>
                      Things to <span className="serif">look forward to.</span>
                    </h1>
                    <p>Your group plans and activities you’re interested in.</p>
                  </div>
                </div>
                {allPlans.length > 0 && (
                  <div className="plans-list">{allPlans.map(planView)}</div>
                )}
                <h2 className="section-title">
                  Your activity shortlist <span>{interested.length}</span>
                </h2>
                <div className="shortlist">
                  {interested.map((a) => (
                    <article key={a.id}>
                      <img src={a.image} alt="Activity inspiration" />
                      <div>
                        <span className="eyebrow purple">
                          {a.status === "attending"
                            ? "YOU’RE GOING"
                            : "INTERESTED"}
                        </span>
                        <h3>{a.title}</h3>
                        <p className="small muted">
                          {fmt(a.start)} · {a.attending}/{a.capacity} going
                        </p>
                      </div>
                      <button
                        className="secondary"
                        onClick={() => setDetail(a)}
                      >
                        View <ArrowUpRight size={15} />
                      </button>
                    </article>
                  ))}
                </div>
                {!interested.length && !allPlans.length && (
                  <div className="empty-state">
                    <CalendarDays />
                    <h2>A wide-open calendar. A little possibility.</h2>
                    <p>
                      Save an activity or match with your Circle to get started.
                    </p>
                    <button
                      className="primary"
                      onClick={() => navigate("Discover")}
                    >
                      Explore activities
                    </button>
                  </div>
                )}
              </>
            )}
            {page === "Profile" && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow purple">COME AS YOU ARE</div>
                    <h1>
                      Your kind of <span className="serif">person.</span>
                    </h1>
                    <p>A few things that make you, you.</p>
                  </div>
                </div>
                <div className="profile-grid">
                  <section className="profile-card">
                    <span className="large-avatar">{data.user.avatar}</span>
                    <h2>{data.user.name}</h2>
                    <p className="muted">
                      <MapPin size={15} />
                      {data.user.city}
                    </p>
                    <div className="tags">
                      {data.user.interests.map((i) => (
                        <span key={i}>{i}</span>
                      ))}
                    </div>
                    <p className="small muted">
                      Preferred budget · ${data.user.budget} / outing
                    </p>
                    <button
                      className="primary"
                      onClick={() => setModal("profile")}
                    >
                      {data.user.demo
                        ? "Create your personal profile"
                        : "Edit profile"}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  <section className="settings-card">
                    <h2>Make yourself at home.</h2>
                    <p>
                      Personal profiles use a persistent session in this
                      browser. No passwords, no complicated sign-up.
                    </p>
                    <h3>Explore the demo</h3>
                    <p className="small muted">
                      These fictional identities belong only to your sandbox.
                      They cannot access someone else’s private Circle.
                    </p>
                    <div className="profile-switch-list">
                      {data.demoUsers.map((p) => (
                        <button
                          className={p.id === data.user.id ? "selected" : ""}
                          key={p.id}
                          onClick={() => act({ type: "switch", user: p.id })}
                        >
                          {p.avatar} {p.name}
                          {p.id === data.user.id && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                    <h3>Connected capabilities</h3>
                    <div className="status-row">
                      <span>Meta Muse Spark</span>
                      <span className="pill lavender">
                        {data.integrations.meta
                          ? "Key configured · not yet verified"
                          : "API key needed"}
                      </span>
                    </div>
                    <div className="status-row">
                      <span>SerpApi places</span>
                      <span className="pill lavender">
                        {data.integrations.serpapi
                          ? "Key configured · not yet verified"
                          : "API key needed"}
                      </span>
                    </div>
                    <p className="small muted">
                      Keys stay on the server. Live calls are never replaced
                      with simulated results. Demo plans are explicitly labeled.
                    </p>
                  </section>
                </div>
              </>
            )}
          </main>
          <footer className="footer">
            <Logo />
            <span>YOU WANNA GO? DITTO.</span>
            <span>Made for real life ↗</span>
          </footer>
        </div>
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
          </div>
        )}
        {(modal || detail) && (
          <Modal
            title={
              detail
                ? "A little more about it"
                : (
                    {
                      activity: "Put a good idea out there.",
                      circle: "Make room for your people.",
                      idea: "What should we try?",
                      round: "Let everyone have a say.",
                      plan: "From “we should” to “let’s go”.",
                      profile: "Hey, nice to meet you.",
                      filters: "Find your kind of good time.",
                      search: "A little inspiration, grounded in real places.",
                      join: "You’re in good company.",
                    } as Record<string, string>
                  )[modal!] || ""
            }
            close={close}
          >
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            {detail && (
              <>
                <img
                  className="detail-image"
                  src={detail.image}
                  alt="Activity inspiration"
                />
                <span className="pill lavender">
                  {detail.demo ? "Fictional demo meetup" : "Community meetup"} ·
                  Automatic joining
                </span>
                <h2>{detail.title}</h2>
                <p>{detail.description}</p>
                <p>
                  <MapPin size={16} />
                  {detail.venue}
                </p>
                <p>
                  <CalendarDays size={16} />
                  {fmt(detail.start)}
                </p>
                <p>
                  {data.activities.find((a) => a.id === detail.id)?.attending} /{" "}
                  {detail.capacity} going ·{" "}
                  {detail.budget ? `Estimated $${detail.budget}` : "Free"}
                </p>
                <div className="field">
                  <label htmlFor="origin">Starting location (optional)</label>
                  <input
                    id="origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      if (detail.venue.includes("to be decided")) {
                        setDrive(
                          "Choose a meeting venue before checking driving time.",
                        );
                        return;
                      }
                      const r = await request("/api/directions", {
                        origin,
                        destination: detail.venue + ", " + detail.city,
                      });
                      setDrive(
                        r.route
                          ? `${r.route.duration} drive · ${r.route.distance}`
                          : "Drive time unavailable",
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Navigation size={16} />
                  Check driving time
                </button>
                {drive && <p>{drive}</p>}
                <p className="small muted">
                  No booking or reservation is made. Photos are illustrative.
                </p>
                <button
                  className="primary full"
                  disabled={busy}
                  onClick={async () => {
                    const going =
                      data.activities.find((a) => a.id === detail.id)
                        ?.status === "attending";
                    const r = await act(
                      { type: "attend", activity: detail.id, withdraw: going },
                      going
                        ? "You’ve withdrawn."
                        : "You’re on the attending list.",
                    );
                    if (r) close();
                  }}
                >
                  {data.activities.find((a) => a.id === detail.id)?.status ===
                  "attending"
                    ? "Withdraw attendance"
                    : "Join activity"}
                  <ArrowRight size={17} />
                </button>
              </>
            )}
            {modal === "filters" && (
              <>
                <div className="field">
                  <label htmlFor="cityfilter">City</label>
                  <input
                    id="cityfilter"
                    placeholder="All cities"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="budgetfilter">Maximum estimated budget</label>
                  <select
                    id="budgetfilter"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  >
                    <option value={1000}>Any budget</option>
                    <option value={0}>Free</option>
                    <option value={20}>Up to $20</option>
                    <option value={50}>Up to $50</option>
                  </select>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                  />
                  Only activities with open spots
                </label>
                <button className="primary full" onClick={close}>
                  Show activities
                </button>
              </>
            )}
            {modal === "profile" && (
              <form onSubmit={(e) => submit(e, "profile")}>
                <p className="muted">
                  Meet people through things you actually want to do. Your new
                  personal profile is separate from the fictional demo crew.
                </p>
                <div className="field">
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    required
                    maxLength={80}
                    defaultValue={data.user.demo ? "" : data.user.name}
                    placeholder="What should we call you?"
                  />
                </div>
                <div className="field">
                  <label htmlFor="avatar">Pick your little personality</label>
                  <select
                    id="avatar"
                    name="avatar"
                    defaultValue={data.user.avatar}
                  >
                    {["🪻", "🍊", "🌻", "🌊", "🪩", "🍄", "🌵", "🦋"].map(
                      (a) => (
                        <option key={a}>{a}</option>
                      ),
                    )}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="city">Your city</label>
                  <input
                    id="city"
                    name="city"
                    required
                    defaultValue={data.user.city}
                  />
                </div>
                <fieldset>
                  <legend>Your interests</legend>
                  <div className="interest-options">
                    {categories.slice(1).map((i) => (
                      <label key={i}>
                        <input
                          type="checkbox"
                          name="interests"
                          value={i}
                          defaultChecked={data.user.interests.includes(i)}
                        />
                        {i}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="field">
                  <label htmlFor="budget">Comfortable outing budget ($)</label>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    min="0"
                    max="1000"
                    required
                    defaultValue={data.user.budget}
                  />
                </div>
                <button className="primary full" disabled={busy}>
                  Let’s go <ArrowRight size={17} />
                </button>
              </form>
            )}
            {(modal === "activity" ||
              modal === "circle" ||
              modal === "idea") && (
              <form onSubmit={(e) => submit(e, modal)}>
                <div className="field">
                  <label htmlFor="title">
                    {modal === "circle" ? "Circle name" : "Give it a name"}
                  </label>
                  <input
                    id="title"
                    name={modal === "circle" ? "name" : "title"}
                    placeholder={
                      modal === "circle"
                        ? "The weekend people"
                        : "Sunset picnic, anyone?"
                    }
                    required
                    maxLength={120}
                  />
                </div>
                {modal !== "circle" && (
                  <div className="field">
                    <label htmlFor="category">The vibe</label>
                    <select id="category" name="category">
                      {categories.slice(1).map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                {modal !== "idea" && (
                  <>
                    <div className="field">
                      <label htmlFor="description">
                        A little more about it
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        maxLength={500}
                        placeholder="What’s the plan? Who’s it for?"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="city">City</label>
                      <input
                        id="city"
                        name="city"
                        required
                        defaultValue={data.user.city}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="budget">
                        Estimated budget per person ($)
                      </label>
                      <input
                        id="budget"
                        name="budget"
                        type="number"
                        min="0"
                        max="1000"
                        defaultValue={20}
                        required
                      />
                    </div>
                  </>
                )}
                {modal === "activity" && (
                  <>
                    <div className="field">
                      <label htmlFor="venue">Meeting place</label>
                      <input
                        id="venue"
                        name="venue"
                        required
                        placeholder="A public place or verified venue address"
                      />
                    </div>
                    <p className="small muted">
                      Use Discover’s place search to find a verified venue, then
                      enter its address here.
                    </p>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="start">When (your local time)</label>
                        <input
                          id="start"
                          name="start"
                          type="datetime-local"
                          required
                          defaultValue={tomorrow()}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="capacity">Maximum people</label>
                        <input
                          id="capacity"
                          name="capacity"
                          type="number"
                          min="2"
                          max="100"
                          defaultValue={8}
                          required
                        />
                      </div>
                    </div>
                    <p className="small muted">
                      {data.user.demo
                        ? "Visible only inside your demo sandbox."
                        : "Public activity with automatic joining."}{" "}
                      A category cover photo will be selected.
                    </p>
                  </>
                )}
                <button className="primary full" disabled={busy}>
                  {modal === "circle"
                    ? "Create Circle"
                    : modal === "idea"
                      ? "Add to the deck"
                      : "Publish activity"}
                  <Plus size={17} />
                </button>
              </form>
            )}
            {modal === "join" && (
              <form onSubmit={(e) => submit(e, "join")}>
                <p className="muted">
                  Paste the invite code from your friend’s Ditto link.
                </p>
                {data.user.demo && (
                  <p className="notice">
                    Create a personal profile first. Your invite will stay here.{" "}
                    <button
                      className="text-link"
                      type="button"
                      onClick={() => setModal("profile")}
                    >
                      Create profile <ArrowRight size={14} />
                    </button>
                  </p>
                )}
                <div className="field">
                  <label htmlFor="invite">Invite code or link</label>
                  <input
                    id="invite"
                    name="invite"
                    value={invite}
                    onChange={(e) => {
                      const v = e.target.value;
                      try {
                        setInvite(new URL(v).searchParams.get("invite") || v);
                      } catch {
                        setInvite(v);
                      }
                    }}
                    required
                  />
                </div>
                <button
                  className="primary full"
                  disabled={busy || data.user.demo}
                >
                  Join Circle <ArrowRight size={17} />
                </button>
              </form>
            )}
            {modal === "round" && c && (
              <>
                <p className="muted">
                  Everyone votes independently on the same {c.ideas.length}{" "}
                  ideas. Member and idea lists are locked when the round begins.
                </p>
                <button
                  className="choice-card"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await act({
                        type: "round",
                        circle: c.id,
                        threshold: "everyone",
                      })
                    )
                      close();
                  }}
                >
                  <Users />
                  <span>
                    <strong>Everyone’s in</strong>
                    <small>A match needs every member’s yes.</small>
                  </span>
                  <ArrowRight />
                </button>
                <button
                  className="choice-card"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await act({
                        type: "round",
                        circle: c.id,
                        threshold: "majority",
                      })
                    )
                      close();
                  }}
                >
                  <Heart />
                  <span>
                    <strong>Go with the majority</strong>
                    <small>More than half the group needs to say yes.</small>
                  </span>
                  <ArrowRight />
                </button>
              </>
            )}
            {modal === "plan" && (
              <>
                <p className="muted">
                  Start with your group’s actual matches. Everyone reviews the
                  draft before it becomes a plan.
                </p>
                <div className="field">
                  <label htmlFor="planstart">
                    Proposed start (your local time)
                  </label>
                  <input
                    id="planstart"
                    type="datetime-local"
                    value={planStart}
                    onChange={(e) => setPlanStart(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="primary full"
                  disabled={
                    busy ||
                    !data.integrations.meta ||
                    !data.integrations.serpapi
                  }
                  onClick={() => generate(false)}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  Plan with Meta AI + real places
                </button>
                {(!data.integrations.meta || !data.integrations.serpapi) && (
                  <p className="notice">
                    Live planning needs Meta and SerpApi keys on the server.
                  </p>
                )}
                <button
                  className="secondary full"
                  disabled={busy}
                  onClick={() => generate(true)}
                >
                  Create a labeled demo draft
                </button>
                <p className="small muted">
                  Demo drafts use your real saved matches, but no AI or verified
                  venues. No reservations or messages will be sent.
                </p>
              </>
            )}
            {modal === "search" && (
              <>
                <p className="muted">
                  Search places directly, or let Meta interpret your plans.
                </p>
                <div className="field">
                  <label htmlFor="search">Your idea</label>
                  <input
                    id="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Bowling in Austin"
                  />
                </div>
                <div className="button-row">
                  <button
                    className="primary"
                    disabled={busy || !search.trim()}
                    onClick={() => findPlaces(false)}
                  >
                    <Search size={16} />
                    {busy ? "Searching…" : "Search real places"}
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || !data.integrations.meta}
                    onClick={() => findPlaces(true)}
                  >
                    <Sparkles size={16} />
                    Use AI
                  </button>
                </div>
                <p className="small muted">
                  {searchNote ||
                    "No simulated results. Live search requires SERPAPI_API_KEY."}
                </p>
                <div className="venue-results">
                  {found.map((v) => (
                    <article key={v.id}>
                      <h3>{v.name}</h3>
                      <p>{v.address}</p>
                      <p className="small muted">
                        {v.rating ? `★ ${v.rating} · ` : ""}
                        {v.price || "Price unavailable"} · Places powered by
                        SerpApi
                      </p>
                      <a href={v.url} target="_blank" rel="noreferrer">
                        View on Maps <ExternalLink size={13} />
                      </a>
                      <button
                        className="text-link"
                        onClick={() => copy(v.name + ", " + (v.address || ""))}
                      >
                        Copy place <Copy size={13} />
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </Modal>
        )}
      </div>
    </MotionConfig>
  );
}
