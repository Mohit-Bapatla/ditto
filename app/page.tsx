"use client";
import { apiPath } from "@/lib/api-path";
import { DemoControls } from "./demo-controls";
import "./discovery.css";
import "./density.css";
import "./mobile-finish.css";
import { BrandLogo } from "./brand-logo";
import { WeekAgenda } from "./week-agenda";
import { Avatar, ProfilePhotoInput } from "./profile-photo";
import {
  DiscoveryBrowse,
  DiscoverySocial,
  CirclePreview,
} from "./social-context";
import { ActivityPhoto } from "./activity-photo";
import { CircleCoordinator } from "./circle-coordinator";
import { PlanEditor } from "./plan-editor";
import { GroupVoting } from "./group-voting";
import { ActivityMetadata } from "./activity-metadata";
import { useSwipeDeck } from "./use-swipe-deck";
import {
  SwipeSurface,
  type SwipeHandle,
  type SwipeCommit,
} from "./swipe-surface";
import { VenuePicker } from "./venue-picker";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useMotionValue,
  useTransform,
  type MotionValue,
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
  Undo2,
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
const fmt = (s: string) =>
  !s ? "Date to decide" : new Date(s).toLocaleString("en-US", {
    timeZone: "America/Chicago",
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
    apiPath(url),
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  ).catch(() => {
    throw new Error(
      "Couldn’t connect to Ditto. Check your connection and try again.",
    );
  });
  const data = await res.json().catch(() => {
    throw new Error("Ditto couldn’t finish that request. Please try again.");
  });
  if (!res.ok) throw new Error(data.error || "Could not complete the request.");
  return data;
}
function Logo() { return <BrandLogo />; }
function Avatars({
  members,
}: {
  members: {
    id: string;
    avatar: string;
    name: string;
    photo?: string | null;
  }[];
}) {
  return (
    <div className="avatars">
      {members.slice(0, 5).map((m) => (
        <span key={m.id} title={m.name}>
          <Avatar person={m} />
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
      className="modal"
      ref={ref}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.target === e.currentTarget &&
          (e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom)
        )
          close();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={close} aria-label="Close dialog">
          <X />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function SwipeCard({
  activity,
  onSwipe,
  onDetails,
  disabled,
  controlRef,
  progress,
  focusHandoffRef,
  preview = false,
  wheelGate,
  wheelTarget,
  returnFrom,
}: {
  activity: Activity;
  onSwipe: SwipeCommit;
  onDetails: () => void;
  disabled: boolean;
  controlRef?: Ref<SwipeHandle>;
  progress?: MotionValue<number>;
  focusHandoffRef?: { current: boolean };
  preview?: boolean;
  returnFrom?: string;
  wheelTarget?: import("react").RefObject<HTMLDivElement | null>;
  wheelGate?: { current: import("@/lib/wheel-gesture").WheelGate };
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const venuePhoto = Boolean(activity.venueData?.image);
  const content = (
    <>
      <div className={`outing-photo ${photoFailed ? "photo-unavailable" : ""}`}>
        {!photoFailed ? (
          <img
            src={activity.image}
            alt={
              activity.customImage ? activity.title : venuePhoto
                ? activity.venueData!.name
                : `${activity.category} inspiration, not the venue`
            }
            draggable={false}
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div className="photo-fallback">
            <MapPin size={32} />
            <span>{activity.venueData?.name || activity.category}</span>
            <small>Photo unavailable</small>
          </div>
        )}
        <span className="outing-category">
          {activity.category}

        </span>
        <span className="photo-credit">
          {photoFailed
            ? ""
            : venuePhoto
              ? "Venue photo · SerpApi"
              : ""}
        </span>
      </div>
      <div
        className={`outing-info ${activity.title.length > 70 ? "long-title" : ""}`}
      >
        <h2>{activity.title}</h2>
        <ActivityMetadata activity={activity}/>
        <div className="outing-people">
          <span className="host-initial"><Avatar person={{ name: activity.host || "Your community", photo: activity.hostPhoto }} /></span>
          <span>With {activity.host || "your community"}</span>
          <button
            className="outing-details"
            onClick={onDetails}
            aria-label="View activity details"
          >
            <span>Details</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
  return preview ? (
    <div className="outing-card preview-card">{content}</div>
  ) : (
    <SwipeSurface
      className="outing-card"
      disabled={disabled}
      onSwipe={onSwipe}
      returnFrom={returnFrom}
      wheelTarget={wheelTarget}
      wheelGate={wheelGate}
      controlRef={controlRef}
      progress={progress}
      focusHandoffRef={focusHandoffRef}
      label={`${activity.title}. Left arrow to pass, right arrow for Ditto.`}
    >
      {content}
    </SwipeSurface>
  );
}
export default function Home() {
  const swipeControl = useRef<SwipeHandle>(null);
  const { wheelGate, wheelTarget } = useSwipeDeck();
  const swipeFocus = useRef(false);
  const swipeProgress = useMotionValue(0);
  const nextScale = useTransform(swipeProgress, [0, 1], [0.98, 1]);
  const nextY = useTransform(swipeProgress, [0, 1], [5, 0]);
  const [data, setData] = useState<State>();
  const [now, setNow] = useState(() => Date.now());
  const [page, setPage] = useState("Discover");
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [modal, setModal] = useState<string>();
  const [detail, setDetail] = useState<Activity>();
  const [category, setCategory] = useState("All vibes");
  const [budget, setBudget] = useState(1000);
  const [city, setCity] = useState("");
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [found, setFound] = useState<Venue[]>([]);
  const [searchNote, setSearchNote] = useState("");
  const [invite, setInvite] = useState("");
  const [circleTab, setCircleTab] = useState("Ideas");
  const [template, setTemplate] = useState("flexible");
  const [planIdeas, setPlanIdeas] = useState<string[]>([]);
  const [planStart, setPlanStart] = useState(tomorrow());
  const [origin, setOrigin] = useState("UT Austin");
  const [drive, setDrive] = useState("");
  const [restored, setRestored] = useState<{ id: string; direction: string }>();
  const swipeAttempt = useRef<{ activity: string; direction: string; nonce: string } | undefined>(undefined);
  const seenVenues = useRef(new Set<string>());
  const [selectedVenue, setSelectedVenue] = useState<Venue>();
  const [activityCity, setActivityCity] = useState("");
  const [afterProfile, setAfterProfile] = useState<string>();
  const pending = useRef(false);
  const stateVersion = useRef(0);
  const activityNonce = useRef<string>("");
  const refresh = useCallback(async () => {
    try {
      const version = stateVersion.current;
      const next = await request("/api/state");
      if (version === stateVersion.current) {
        setData(next);
        setNow(Date.now());
      }
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
  const act = async (
    body: unknown,
    message?: string,
    beforePublish?: () => Promise<void>,
  ) => {
    if (pending.current) return;
    pending.current = true;
    stateVersion.current++;
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/action", body);
      if (beforePublish) await beforePublish();
      stateVersion.current++;
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
    activityNonce.current = "";
    setSelectedVenue(undefined);
    setModal(undefined);
    setDetail(undefined);
    setError("");
    setDrive("");
  };
  const navigate = (p: string) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setPage(p);
    setSelected(undefined);
    setError("");
  };
  const c = data?.circles.find((c) => c.id === selected);
  const deck =
    data?.activities.filter(
      (a) =>
        (!a.swipe || a.id === restored?.id) &&
        !a.cancelled &&
        !a.expired &&
        (a.id === restored?.id || ((category === "All vibes" || a.category === category) &&
        a.budget <= budget &&
        (!city || a.city.toLowerCase().includes(city.toLowerCase())) &&
        (!available || a.attending < a.capacity))),
    ) || [];
  const restoredIndex = deck.findIndex(a => a.id === restored?.id);
  if (restoredIndex > 0) deck.unshift(...deck.splice(restoredIndex, 1));
  const top = deck[0];
  const onSwipe: SwipeCommit = async (yes, afterSave) => {
    if (top) {
      const direction = yes ? "yes" : "no";
      if (swipeAttempt.current?.activity !== top.id || swipeAttempt.current?.direction !== direction) swipeAttempt.current = {activity: top.id, direction, nonce: crypto.randomUUID()};
      const r = await act(
        { type: "swipe", ...swipeAttempt.current },
        yes
          ? "Saved to your interested list. Join when you’re ready."
          : undefined,
        afterSave,
      );
      if (r) { setRestored(undefined); swipeAttempt.current = undefined; }
      return Boolean(r);
    }
    return false;
  };
  function openActivity() {
    if (data?.user.demo && !data.showcase && !data.publicDemo) { setAfterProfile("activity"); setModal("profile"); }
    else setModal("activity");
  }
  async function undoLastSwipe() {
    const last = data?.undoSwipe;
    if (!last || pending.current || !data) return;
    const previous = data;
    setRestored({id: last.activity, direction: last.direction});
    setData({...data, activities: data.activities.map(a => a.id === last.activity ? {...a, swipe: undefined} : a)});
    const result = await act({type: "undoSwipe", operation: last.id}, "Swipe undone. Choose again.");
    if (!result) { setData(previous); setRestored(undefined); await refresh(); }
    swipeAttempt.current = undefined;
  }
  async function submit(e: FormEvent<HTMLFormElement>, type: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(form);
    let body: Record<string, unknown> = { type, ...values };
    if (type === "activity")
      body = {
        ...body,
        budget: values.budget === "" ? undefined : Number(values.budget),
        nonce:
          activityNonce.current ||
          (activityNonce.current = crypto.randomUUID()),
        ...(selectedVenue ? { venueId: selectedVenue.id } : {}),
        capacity: Number(values.capacity),
        start: values.start ? new Date(String(values.start)).toISOString() : "",
        circle: values.circle || undefined,
        visibility: values.circle ? "circle" : "saved",
      };
    if (type === "circle") body = { ...body, budget: Number(values.budget) };
    if (type === "idea") body = { ...body, circle: selected };
    if (type === "profile")
      body = {
        ...body,
        budget: values.budget ? Number(values.budget) : 40,
        interests: form.getAll("interests"),
      };
    const r = await act(
      body,
      type === "profilePhoto" ? "Your picture is saved." : type === "profile" ? "Your profile is saved." : "All set!",
    );
    if (r) {
      close();
      if (type === "profile") {
        if (invite) setModal("join");
        else if (afterProfile) setModal(afterProfile);
        setAfterProfile(undefined);
      }
      if (type === "activity") {
        if (values.circle) { setPage("Circles"); setSelected(String(values.circle)); setCircleTab("Ideas"); }
        else { setPage("Plans"); setSelected(undefined); }
      }
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
  async function findPlaces(natural = false, query = search, fresh = false) {
    if (!query.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setFound([]);
    setSearchNote("");
    try {
      const r = await request("/api/places", {
        query,
        excludeIds: fresh ? [...new Set([...seenVenues.current, ...(data?.activities.map(a => a.venueData?.id).filter((id): id is string => !!id) || [])])].slice(-500) : [],
        city: city || data?.user.city || "Austin, TX",
        natural,
      });
      setFound(r.venues);
      for (const v of r.venues) seenVenues.current.add(v.id);
      setSearchNote(
        r.explanation +
          (r.venues.length ? "" : " No new places this time. Try another category or city, or create your own activity."),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  function findMore() {
    const query = category === "All vibes" ? "things to do" : category.toLowerCase();
    setSearch(query); setModal("search");
    void findPlaces(false, query, true);
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
        template,
        ...(planIdeas.length ? { ideaIds: planIdeas } : {}),
      });
      await refresh();
      close();
      setCircleTab("Plans");
      setToast(
        demo
          ? "Draft ready for your Circle to review."
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
      if (data?.publicDemo) { setToast("Invitations stay inside your demo. Switch sample people using Demo controls."); return; }
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
        <div className="loading-preview" aria-hidden="true">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-actions" />
        </div>
        <p role="status">{error || "Getting your activities ready…"}</p>
        {error && <button onClick={refresh}>Try again</button>}
      </main>
    );
  const openCircle = (id: string) => {
    setPage("Circles");
    setSelected(id);
    setCircleTab("Ideas");
  };
  const allPlans = data.circles.flatMap((c) => c.plans);
  const pendingPlans = allPlans.filter((p) => p.status !== "confirmed");
  const pastPlans = allPlans.filter(
    (p) => p.status === "confirmed" && new Date(p.start).getTime() <= now,
  );
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
          {p.source === "demo" ? "Group plan" : "Meta AI + SerpApi"}
        </span>
      </div>
      <h2>{p.title}</h2>
      <p className="muted">{p.explanation}</p>
      {p.why && (
        <details>
          <summary>Why this plan?</summary>
          <ul>
            {p.why.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="small">
            Actual round votes. Majority support is not unanimous agreement;
            everyone must approve this itinerary.
          </p>
        </details>
      )}
      <p className="small">
        Participants:{" "}
        {data.circles
          .find((c) => c.id === p.circle)
          ?.members.filter((m) => p.eligible.includes(m.id))
          .map((m) => m.name)
          .join(", ")}
      </p>
      <p className="date-line">
        <CalendarDays size={17} />
        {fmt(p.start)}{" "}
        <span className="small">
          (America/Chicago)
        </span>
      </p>
      <div className="itinerary">
        {p.stops.map((stop, i) => (
          <div className="stop" key={i}>
            <span className="stop-number">{i + 1}</span>
            <div>
              {stop.venue?.image && (
                <img
                  className="stop-photo"
                  src={stop.venue.image}
                  alt={stop.venue.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <h3>{stop.title}</h3>
              <p className="small">
                {new Date(
                  new Date(p.start).getTime() +
                    p.stops
                      .slice(0, i)
                      .reduce(
                        (n, s) => n + s.duration + (s.drive?.seconds || 0) / 60,
                        0,
                      ) *
                      60000 +
                    (stop.drive?.seconds || 0) * 1000,
                ).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/Chicago",
                })}{" "}
                · {p.status === "confirmed" ? "Scheduled" : "Proposed time"}{" "}
                {i > 0 && !stop.drive ? "(travel not included)" : ""}
              </p>
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
      <div className="approval-progress">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Group approvals"
          aria-valuenow={p.approvals.length}
          aria-valuemin={0}
          aria-valuemax={p.eligible.length}
        >
          <div
            style={{
              width: `${(p.approvals.length / p.eligible.length) * 100}%`,
            }}
          />
        </div>
        <strong>
          {p.approvals.length} of {p.eligible.length} approved
        </strong>
      </div>
      <p className="small muted">
        {p.approvals.length} / {p.eligible.length} approvals · Opening hours,
        budget, and reservations must be checked by the group.
      </p>
      {p.eligible.includes(data.user.id) && <PlanEditor plan={p} act={act} />}
      {p.approvals.includes(data.user.id) && (
        <button
          className="text-button"
          disabled={busy}
          onClick={() =>
            act(
              { type: "unapprove", plan: p.id },
              "Approval withdrawn. The group must agree again.",
            )
          }
        >
          Withdraw my approval
        </button>
      )}
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
            <a className="primary" aria-disabled={data.publicDemo} onClick={e => { if (data.publicDemo) { e.preventDefault(); setToast("Calendar export is disabled in the demo."); } }} href={data.publicDemo ? undefined : apiPath(`/api/calendar?id=${p.id}`)}>
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
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <nav className="app-nav" aria-label="Main navigation">
          <button
            className="nav-brand"
            onClick={() => navigate("Discover")}
            aria-label="Ditto home"
          >
            <Logo />
          </button>
          <div className="nav-items">
            {[
              { name: "Discover", icon: Compass },
              { name: "Circles", icon: Users },
              { name: "Plans", icon: CalendarDays },
              { name: "Profile", icon: UserRound },
            ].map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={page === name ? "active" : ""}
                aria-current={page === name ? "page" : undefined}
                onClick={() => navigate(name)}
              >
                <Icon size={22} aria-hidden="true" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="workspace">
          <header className="topbar">
            <div className="mobile-logo">
              <Logo />
            </div>

            <div className="top-actions">
              {data.publicDemo && <DemoControls data={data} busy={busy} onSwitch={user => { void act({type:"switch",user}); }} />}
              <button
                style={data.publicDemo ? {display:"none"} : undefined}
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
                <Avatar person={data.user} />
              </button>
            </div>
          </header>
          <main
            className={`main-content ${page === "Discover" ? "discover-page" : ""}`}
            id="main-content"
          >
            {!data.publicDemo && !data.showcase && data.user.demo && data.circles.length === 0 && <a className="demo-entry-link" href="/demo">Try Demo · explore with sample friends <ArrowUpRight size={16} aria-hidden="true" /></a>}
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
                <div className="discover-toolbar">
                  <div>
                    <h1>Discover</h1>
                    <span>{city || data.user.city}</span>
                  </div>
                  <div className="discover-tools">
                    <button
                      className="filter-btn"
                      onClick={() => setModal("filters")}
                      aria-label={
                        category === "All vibes"
                          ? "Filters: all activities"
                          : `Filters: ${category}`
                      }
                    >
                      <SlidersHorizontal size={20} />
                      <span>
                        {category === "All vibes" ? "Filters" : category}
                      </span>
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Find real places in ${city || data.user.city}`}
                      onClick={() => {
                        setSearch("");
                        setModal("search");
                      }}
                    >
                      <Search size={21} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Create activity"
                      onClick={openActivity}
                    >
                      <Plus size={23} />
                    </button>
                  </div>
                </div>
                <div className="discover-grid">
                  <DiscoveryBrowse
                    data={data}
                    category={category}
                    onCategory={setCategory}
                    onFilters={() => setModal("filters")}
                    onCircle={openCircle}
                    onActivity={setDetail}
                  />
                  <section className="deck-section">
                    <div className="deck-stack physical-stack" ref={wheelTarget}>
                      {deck[1] && (
                        <motion.div
                          className="next-card"
                          aria-hidden="true"
                          inert
                          style={{ scale: nextScale, y: nextY }}
                        >
                          <SwipeCard
                            key={deck[1].id}
                            activity={deck[1]}
                            onSwipe={onSwipe}
                            onDetails={() => {}}
                            disabled
                            preview
                          />
                        </motion.div>
                      )}
                      <AnimatePresence mode="wait">
                        {top ? (
                          <SwipeCard
                            key={top.id}
                            activity={top}
                            returnFrom={restored?.id === top.id ? restored.direction : undefined}
                            wheelTarget={wheelTarget}
                            wheelGate={wheelGate}
                            controlRef={swipeControl}
                            focusHandoffRef={swipeFocus}
                            progress={swipeProgress}
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
                            <BrandLogo symbol />
                            <h2>{data.activities.some(a => !a.swipe && !a.cancelled && !a.expired) ? "Nothing fits these filters yet." : "You’ve seen everything for now."}</h2>
                            <p>Got something else in mind? Make your own plan or discover more.</p>
                            <div className="deck-next-actions">
                              <button className="primary" disabled={busy} onClick={openActivity}><Plus size={18}/>Create an activity</button>
                              <button className="secondary" disabled={busy} onClick={findMore}><Search size={18}/>Find more activities</button>
                            </div>
                            <button className="text-link" onClick={() => navigate("Plans")}>Review interested activities <ArrowRight size={15}/></button>
                            <button className="text-link" onClick={() => setModal("filters")}>Change filters</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className={`swipe-controls ${!top ? "deck-finished" : ""}`}>
                      <button
                        className="swipe-action pass"
                        aria-label="Pass on activity"
                        disabled={!top || busy}
                        onClick={() => void swipeControl.current?.swipe(false)}
                      >
                        <X size={24} />
                        <small>Pass</small>
                      </button>
                      <button
                        className="undo-action"
                        disabled={!data.undoSwipe || busy}
                        aria-label="Undo last swipe"
                        title="Undo last swipe"
                        onClick={() => void undoLastSwipe()}
                      >
                        <Undo2 size={19} />
                        <small>Undo</small>
                      </button>
                      <button
                        className="swipe-action heart"
                        aria-label="Interested in activity"
                        disabled={!top || busy}
                        onClick={() => void swipeControl.current?.swipe(true)}
                      >
                        <Heart size={24} />
                        <small>Ditto</small>
                      </button>
                    </div>
                    {top && <div className="swipe-hint">Find your next yes.</div>}
                  </section>
                  <DiscoverySocial
                    now={now}
                    data={data}
                    onCircle={openCircle}
                    onChat={(id) => {
                      openCircle(id);
                      setCircleTab("Chat & AI");
                    }}
                    onPlans={() => navigate("Plans")}
                  />
                </div>
              </>
            )}
            {page === "Circles" && !c && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Your Circles</h1>
                    <p>Bring your people. Find your next plan.</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      if (data.user.demo && !data.publicDemo) setAfterProfile("circle");
                      setModal(data.user.demo && !data.publicDemo ? "profile" : "circle");
                    }}
                  >
                    <Plus size={17} />
                    Create a Circle
                  </button>
                </div>
                <div className="collection-tools">
                  <span>
                    {data.circles.length} Circles · shared ideas, real decisions
                  </span>
                  <button
                    className="text-link"
                    onClick={() => setModal("join")}
                  >
                    Join with an invite <ArrowRight size={16} />
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
                        <ActivityPhoto
                          key={circle.ideas[0]?.image}
                          src={circle.ideas[0]?.image || ""}
                          alt={`${circle.name} activity inspiration`}
                        />
                        <small>
                          {circle.plans.some((p) => p.status === "confirmed")
                            ? "Plan confirmed"
                            : circle.round && !circle.round.complete
                              ? "Voting is open"
                              : "Make your next plan"}
                        </small>
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
                          {circle.demo ? "Your Circle" : "Private Circle"}
                        </span>
                      </div>
                    </button>
                  ))}
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
                    <h1>{c.name}</h1>
                    <p>{c.description}</p>
                  </div>
                  <div>
                    <Avatars members={c.members} />
                    <p className="small muted">
                      {c.members.map((m) => m.name).join(", ")}
                    </p>
                  </div>
                </div>
                {!c.demo && (
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
                  {["Ideas", "Matches", "Chat & AI", "Plans"].map((t) => (
                    <button
                      key={t}
                      className={circleTab === t ? "active" : ""}
                      aria-pressed={circleTab === t}
                      onClick={() => setCircleTab(t)}
                    >
                      {t}
                      {t === "Plans" && c.plans.length > 0 && (
                        <small>{c.plans.length}</small>
                      )}
                    </button>
                  ))}
                </div>
                {circleTab === "Chat & AI" && (
                  <CircleCoordinator
                    key={c.id + data.user.id}
                    circle={c}
                    user={data.user.id}
                    live={data.integrations.live}
                    act={act}
                    onPlaces={(query) => {
                      setSearch(query);
                      setModal("search");
                    }}
                  />
                )}
                {circleTab === "Ideas" && (
                  <>
                    <details
                      className="round-banner"
                      open={!c.round || c.round.complete}
                    >
                      <summary>
                        {c.round
                          ? `${c.round.completed} of ${c.round.total} members finished`
                          : "What should we do together?"}
                      </summary>
                      <div>
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
                              ? "Needs everyone’s yes"
                              : "Majority agrees"}
                          </span>
                        )}
                      </div>
                    </details>
                    {c.round && (
                      <div className="progress-track">
                        <div
                          style={{
                            width: `${(c.round.completed / c.round.total) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                    {c.undoVote && !c.ideas.some(idea => c.round?.ideaIds.includes(idea.id) && idea.vote === undefined) && <div className="group-undo-row">
                      <button className="secondary" disabled={busy || c.undoVoteBlocked} title={c.undoVoteBlocked ? "This round already has a plan. Start a new round to change the decision." : "Undo last swipe"} onClick={() => act({type: "undoSwipe", operation: c.undoVote!.id}, "Vote undone. Your Circle’s matches will update.")}><Undo2 size={18}/>Undo last swipe</button>
                      {c.undoVoteBlocked && <p className="small muted">This round has a plan. Start a new round to make a different decision.</p>}
                    </div>}
                    {c.round && !c.round.complete && (
                      <GroupVoting
                        circle={c}
                        activities={data.activities}
                        onDetails={setDetail}
                        busy={busy}
                        act={act}
                        onChat={() => setCircleTab("Chat & AI")}
                      />
                    )}
                    <div
                      className={`idea-grid ${c.round && !c.round.complete ? "round-review" : ""}`}
                    >
                      {c.ideas
                        .filter(
                          (idea) =>
                            !c.round ||
                            c.round.complete ||
                            !c.round.ideaIds.includes(idea.id) ||
                            idea.vote !== undefined,
                        )
                        .map((idea: Idea) => (
                          <article className="idea-card" key={idea.id}>
                            <img
                              src={idea.image}
                              alt={idea.imageKind ? idea.title : `${idea.category} inspiration`}
                            />
                            <div className="idea-content">
                              <span className="eyebrow purple">
                                {idea.category}
                              </span>
                              <h3>{idea.title}</h3>
                              {idea.notes && (
                                <p className="small muted">{idea.notes}</p>
                              )}
                              <p className="small muted idea-author"><span className="inline-avatar"><Avatar person={c.members.find(m => m.id === idea.creator) || {name:"Member"}}/></span>
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
                        <span className="match-symbol" aria-hidden="true">
                          <CheckCheck size={32} />
                        </span>
                        <Avatars members={c.members} />
                        <div className="eyebrow purple">
                          THE FEELING IS MUTUAL
                        </div>
                        <h1>
                          {c.ideas.some((i) => i.matched)
                            ? "It’s a ditto"
                            : "No match yet. Try another round."}
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
                                <img src={i.image} alt="" />
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
                            onClick={() => {
                              setPlanIdeas([]);
                              setTemplate("flexible");
                              setModal("plan");
                            }}
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
                    <h1>Your plans</h1>
                    <p>Your group plans and activities you’re interested in.</p>
                  </div>
                </div>
                <WeekAgenda
                  data={data}
                  now={now}
                  renderPlan={planView}
                  onActivity={setDetail}
                  onCreate={() => {
                    navigate("Circles");
                    setSelected(undefined);
                  }}
                />
                <details className="all-date-plans"><summary>All saved activities & group decisions <ChevronDown size={18}/></summary><div className="plans-overview">
                  <section className="pending-section">
                    <h2 className="section-title">Awaiting group decisions</h2>
                    {pendingPlans.map((p) => (
                      <details className="pending-plan" key={p.id}>
                        <summary>
                          <span>
                            <strong>{p.title}</strong>
                            <small>
                              {p.approvals.length} of {p.eligible.length}{" "}
                              approved · Review proposal
                            </small>
                          </span>
                          <ChevronDown size={18} />
                        </summary>
                        {planView(p)}
                      </details>
                    ))}
                    {data.circles
                      .filter((c) => c.round && !c.round.complete)
                      .map((circle) => (
                        <CirclePreview
                          key={circle.id}
                          circle={circle}
                          onOpen={openCircle}
                        />
                      ))}
                    {!pendingPlans.length &&
                      !data.circles.some(
                        (c) => c.round && !c.round.complete,
                      ) && (
                        <p className="muted">
                          No pending decisions. Suggest an idea in a Circle.
                        </p>
                      )}
                  </section>
                  <section>
                    <h2 className="section-title">
                      Activities you’re interested in{" "}
                      <span>{interested.length}</span>
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
                              {a.fixture
                                ? `${a.fixture.area} · ${a.budget ? `$${a.budget} allowance` : "Free idea"}`
                                : `${fmt(a.start)} · ${a.attending}/${a.capacity} going`}
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
                    {!interested.length && (
                      <div className="compact-empty">
                        <p>Save something that catches your eye.</p>
                        <button
                          className="text-link"
                          onClick={() => navigate("Discover")}
                        >
                          Explore activities <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </section>
                </div>
                </details>
                {pastPlans.length > 0 && (
                  <section>
                    <h2 className="section-title">Past plans</h2>
                    {pastPlans.map(planView)}
                  </section>
                )}
              </>
            )}
            {page === "Profile" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>{showSettings ? "Settings" : "Your profile"}</h1>
                    <p>
                      {showSettings
                        ? "Your browser session and connected services."
                        : "Make the next outing feel like you."}
                    </p>
                  </div>
                </div>
                <button
                  className="text-link settings-toggle"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings
                    ? "Back to profile"
                    : "Settings"}{" "}
                  <ArrowRight size={16} />
                </button>
                <div
                  className={`profile-grid ${showSettings ? "show-settings" : ""}`}
                >
                  <section className="profile-card">
                    <button disabled={data.publicDemo} className="large-avatar profile-photo-button" aria-label="Change profile picture" onClick={() => setModal("profilePhoto")}><Avatar person={data.user} /></button>
                    <h2>{data.user.name}</h2>
                    <p className="profile-location muted">
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
                      onClick={() => data.publicDemo ? setShowSettings(true) : setModal("profile")}
                    >
                      {data.publicDemo ? "Switch sample person in Demo controls" : data.user.demo
                        ? "Create your personal profile"
                        : "Edit profile"}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                  {!showSettings && (
                    <section className="profile-social">
                      <h2>Your people</h2>
                      <p className="muted">
                        A different Circle for every kind of plan.
                      </p>
                      <div className="membership-grid">
                        {data.circles.map((circle) => (
                          <CirclePreview
                            key={circle.id}
                            circle={circle}
                            onOpen={openCircle}
                          />
                        ))}
                      </div>
                      <h2>Explore your interests</h2>
                      <div className="interest-explore">
                        {data.user.interests.slice(0, 3).map((interest) => {

                          return (
                            <button
                              key={interest}
                              onClick={() => {
                                setCategory(interest);
                                navigate("Discover");
                              }}
                            >

                              <span>
                                {interest} <ArrowUpRight size={15} />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <h2>On your radar</h2>
                      {interested.slice(0, 3).map((a) => (
                        <button
                          className="context-row"
                          key={a.id}
                          onClick={() => setDetail(a)}
                        >
                          <span className="context-thumb">
                            <ActivityPhoto
                              src={a.image}
                              alt="Activity inspiration"
                            />
                          </span>
                          <span>
                            <strong>{a.title}</strong>
                            <small>
                              {a.category} · {a.fixture?.area || a.city}
                            </small>
                          </span>
                          <ArrowUpRight size={16} />
                        </button>
                      ))}
                      {!interested.length && (
                        <p className="muted">
                          Your saved activities will appear here.
                        </p>
                      )}
                    </section>
                  )}
                  {showSettings && (
                    <section className="settings-card">
                      <h2>Your session</h2>
                      {!data.publicDemo && <a className="demo-entry-link" href="/demo">Try Demo</a>}
                      <p>
                        Personal profiles use a persistent session in this
                        browser. No passwords, no complicated sign-up.
                      </p>
                      <h3>{data.showcase ? "Local showcase" : "Explore the demo"}</h3>
                      <p className="small muted">
                        {data.showcase
                          ? "Sample plans and decisions, shared across your local test sessions. Choose Mohit, Edwin, or Paxton; real accounts are never available here."
                          : "These fictional identities belong only to your sandbox. They cannot access someone else’s private Circle."}
                      </p>
                      <div className="profile-switch-list">
                        {data.demoUsers.map((p) => (
                          <button
                            className={p.id === data.user.id ? "selected" : ""}
                            key={p.id}
                            onClick={() => act({ type: "switch", user: p.id })}
                          >
                            <span className="inline-avatar">
                              <Avatar person={p} />
                            </span>{" "}
                            {p.name}
                            {p.id === data.user.id && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                      <details className="capability-details">
                        <summary>Connected services</summary>
                        <div className="status-row">
                          <span>Meta Muse Spark</span>
                          <span className="pill lavender">
                            {data.integrations.meta
                              ? data.integrations.live
                                ? "Enabled · key configured"
                                : "Paused · key configured"
                              : "API key needed"}
                          </span>
                        </div>
                        <div className="status-row">
                          <span>SerpApi places</span>
                          <span className="pill lavender">
                            {data.integrations.serpapi
                              ? data.integrations.live
                                ? "Enabled · key configured"
                                : "Paused · key configured"
                              : "API key needed"}
                          </span>
                        </div>
                        <p className="small muted">
                          Keys stay on the server. Live calls are never replaced
                          with simulated results. Plans from templates are marked as group plans.
                        </p>
                      </details>
                    </section>
                  )}
                </div>
              </>
            )}
          </main>
          <footer className="footer">
            <Logo />
            <span>YOU WANNA GO? DITTO</span>
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
                ? "Activity details"
                : (
                    {
                      activity: "Create an activity",
                      circle: "Create a Circle",
                      idea: "What should we try?",
                      round: "Let everyone have a say.",
                      plan: "From “we should” to “let’s go”.",
                      profile: "Make it your own",
                      profilePhoto: "Your profile picture",
                      filters: "Filter activities",
                      search: "Find a real place",
                      join: "Join your people",
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
                  {detail.cancelled ? "Cancelled · " : ""}
                  {detail.demo ? "Activity" : "Community meetup"} ·
                  Automatic joining
                </span>
                <h2>{detail.title}</h2>
                {detail.creator === data.user.id && (
                  <details>
                    <summary>Host controls</summary>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        if (
                          await act(
                            {
                              type: "editActivity",
                              activity: detail.id,
                              title: f.get("title"),
                              description: f.get("description"),
                              venue: f.get("venue"),
                              start: new Date(
                                String(f.get("start")),
                              ).toISOString(),
                              capacity: Number(f.get("capacity")),
                            },
                            "Activity updated.",
                          )
                        )
                          close();
                      }}
                    >
                      <label>
                        Title
                        <input
                          name="title"
                          required
                          defaultValue={detail.title}
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          name="description"
                          required
                          maxLength={1000}
                          defaultValue={detail.description}
                        />
                      </label>
                      <label>
                        Venue
                        <input
                          name="venue"
                          required
                          defaultValue={detail.venue}
                        />
                      </label>
                      <label>
                        Start
                        <input
                          name="start"
                          type="datetime-local"
                          required
                          defaultValue={detail.start ? new Date(
                            new Date(detail.start).getTime() -
                              new Date(detail.start).getTimezoneOffset() *
                                60000,
                          )
                            .toISOString()
                            .slice(0, 16) : ""}
                        />
                      </label>
                      <label>
                        Capacity
                        <input
                          name="capacity"
                          type="number"
                          min={2}
                          max={100}
                          defaultValue={detail.capacity}
                        />
                      </label>
                      <button
                        className="secondary"
                        disabled={!!detail.cancelled}
                      >
                        Save activity changes
                      </button>
                    </form>
                    <button
                      className="text-button"
                      disabled={!!detail.cancelled}
                      onClick={async () => {
                        if (
                          await act(
                            { type: "cancelActivity", activity: detail.id },
                            "Activity cancelled. Existing records preserved.",
                          )
                        )
                          close();
                      }}
                    >
                      Cancel this activity
                    </button>
                  </details>
                )}
                <p>{detail.description}</p>
                <p>
                  <MapPin size={16} />
                  {detail.venueData?.name || detail.venue}
                </p>
                {detail.venueData?.address && <p>{detail.venueData.address}</p>}
                <p>
                  <CalendarDays size={16} />
                  {fmt(detail.start)}
                </p>
                <p>
                  {data.activities.find((a) => a.id === detail.id)?.attending} /{" "}
                  {detail.capacity} going ·{" "}
                  {detail.budgetKnown === false ? "Budget to decide" : detail.budget ? `Estimated $${detail.budget}` : "Free"}
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
                  No booking or reservation is made.{" "}
                  {detail.venueData?.image
                    ? "Venue photo supplied by SerpApi."
                    : "Activity inspiration · venue selected together."}
                </p>
                <button
                  className="primary full sticky-submit"
                  disabled={
                    busy ||
                    (data.activities.find((a) => a.id === detail.id)?.status !==
                      "attending" &&
                      (!detail.start || !!detail.cancelled ||
                        !!detail.expired ||
                        (data.activities.find((a) => a.id === detail.id)
                          ?.attending || 0) >= detail.capacity))
                  }
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
                    : !detail.start ? "Choose a date before joining" : detail.cancelled
                      ? "Activity cancelled"
                      : detail.expired
                        ? "Activity ended"
                        : (data.activities.find((a) => a.id === detail.id)
                              ?.attending || 0) >= detail.capacity
                          ? "Activity full"
                          : "Join activity"}
                  <ArrowRight size={17} />
                </button>
              </>
            )}
            {modal === "filters" && (
              <>
                <fieldset>
                  <legend>Activity category</legend>
                  <div className="category-picker">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        className={category === cat ? "selected" : ""}
                        aria-pressed={category === cat}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </fieldset>
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
            {modal === "profilePhoto" && <form onSubmit={e => submit(e,"profilePhoto")}><ProfilePhotoInput onBusy={setPhotoBusy} photo={data.user.photo} name={data.user.name}/><button className="primary full" disabled={busy || photoBusy}>Save picture</button></form>}
            {modal === "profile" && (
              <form onSubmit={(e) => submit(e, "profile")}>
                <div className="onboarding-brand"><BrandLogo /></div>
                <ProfilePhotoInput
                  onBusy={setPhotoBusy}
                  photo={data.user.photo}
                  name={data.user.demo ? "" : data.user.name}
                />
                <p className="muted">
                  {data.user.demo
                    ? "Create your personal profile to start planning with friends."
                    : "Your picture, interests, and next good plan."}
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
                  <label htmlFor="city">Your city</label>
                  <input
                    id="city"
                    name="city"
                    required
                    defaultValue={data.user.city}
                  />
                </div>
                <div className="optional-profile">
                  <fieldset>
                    <legend>Interests (optional — skip for now)</legend>
                    <div className="interest-options">
                      {categories.slice(1).map((i) => (
                        <label key={i}>
                          <input
                            type="checkbox"
                            name="interests"
                            value={i}
                            defaultChecked={
                              !data.user.demo && data.user.interests.includes(i)
                            }
                          />
                          {i}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label htmlFor="budget">
                      Outing budget (optional, defaults to $40)
                    </label>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      max="1000"
                      defaultValue={
                        data.user.demo ? undefined : data.user.budget
                      }
                    />
                  </div>
                </div>
                <button className="primary full" disabled={busy || photoBusy}>
                  {data.user.demo ? "Create profile" : "Save profile"}{" "}
                  <ArrowRight size={17} />
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
                        required={modal === "activity"}
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
                        onChange={(e) => {
                          setActivityCity(e.target.value);
                          setSelectedVenue(undefined);
                        }}
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
                        defaultValue={modal === "activity" ? "" : 20}
                        placeholder="To decide"
                        required={modal !== "activity"}
                      />
                    </div>
                  </>
                )}
                {modal === "activity" && (
                  <>
                    <VenuePicker
                      city={activityCity || data.user.city}
                      selected={selectedVenue}
                      onSelect={setSelectedVenue}
                    />
                    <div className="field">
                      <label htmlFor="venue">Meeting place</label>
                      <input
                        id="venue"
                        name="venue"
                        key={selectedVenue?.id || "manual"}
                        defaultValue={
                          selectedVenue
                            ? `${selectedVenue.name}, ${selectedVenue.address || ""}`
                            : ""
                        }
                        readOnly={!!selectedVenue}
                        placeholder="Optional — choose with your friends"
                      />
                    </div>
                    <p className="small muted">
                      Selected venues carry their supplied photo into your
                      activity. A manual address uses a labeled inspiration
                      photo.
                    </p>
                    <div className="field-row">
                      <div className="field">
                        <label htmlFor="start">Date & time (optional)</label>
                        <input
                          id="start"
                          name="start"
                          type="datetime-local"
                          defaultValue=""
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
                    <label htmlFor="activity-circle">Share with a Circle (optional)</label>
                      <select id="activity-circle" name="circle" defaultValue=""><option value="">Just save it for me</option>{data.circles.map(circle => <option value={circle.id} key={circle.id}>{circle.name}</option>)}</select>
                    <details className="activity-image-options"><summary>Add an activity image (optional)</summary><ProfilePhotoInput name="Activity" label="Activity image" fieldName="image" onBusy={setPhotoBusy}/></details>
                    <p className="small muted">Saved privately unless you select a Circle. Shared ideas use your Circle’s voting and approval flow. No time, venue availability or reservation is confirmed.</p>
                  </>
                )}
                <button className="primary full" disabled={busy || photoBusy}>
                  {modal === "circle"
                    ? "Create Circle"
                    : modal === "idea"
                      ? "Add to the deck"
                      : "Save activity"}
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
                      onClick={() => data.publicDemo ? setShowSettings(true) : setModal("profile")}
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
                <label>
                  Outing structure
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                  >
                    <option value="flexible">Shared favorites</option>
                    <option value="dinner">
                      Dinner + Activity · two slots
                    </option>
                    <option value="surprise">
                      Surprise Us · two different categories
                    </option>
                  </select>
                </label>
                <fieldset>
                  <legend>
                    Choose supported ideas for your slots (up to three)
                  </legend>
                  {c?.ideas
                    .filter((i) => (i.yes || 0) > 0)
                    .map((i) => (
                      <label className="checkbox-label" key={i.id}>
                        <input
                          type="checkbox"
                          checked={planIdeas.includes(i.id)}
                          onChange={(e) =>
                            setPlanIdeas(
                              e.target.checked
                                ? [...planIdeas, i.id].slice(-3)
                                : planIdeas.filter((id) => id !== i.id),
                            )
                          }
                        />
                        {i.title} · {i.yes}/{c.round?.total} yes
                      </label>
                    ))}
                </fieldset>
                <p className="small">
                  Leave unchecked to use matches. Dinner + Activity requires one
                  Food idea and one other activity. You can revise timing after
                  generation.
                </p>
                <button
                  className="primary full"
                  disabled={
                    busy ||
                    !data.integrations.live ||
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
                    Live planning needs activated Meta and SerpApi access.
                  </p>
                )}
                <button
                  className="secondary full"
                  disabled={busy}
                  onClick={() => generate(true)}
                >
                  Create a plan from your matches
                </button>
                <p className="small muted">
                  Build a simple itinerary, then choose venues with your Circle.
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
                    "Search real venue listings. Prices, opening hours and availability can change."}
                </p>
                {busy && (
                  <div
                    className="skeleton venue-skeleton"
                    role="status"
                    aria-label="Searching places"
                  />
                )}
                {!busy && !found.length && <button className="text-link" onClick={openActivity}>Create your own activity <Plus size={16}/></button>}
                <div className="venue-results">
                  {found.map((v) => (
                    <article key={v.id}>
                      {v.image ? (
                        <img
                          className="venue-photo"
                          src={v.image}
                          alt={v.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="photo-placeholder">
                          <MapPin />
                          <span>No venue photo supplied</span>
                        </div>
                      )}
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
                        className="secondary"
                        onClick={() => {
                          setSelectedVenue(v);
                          setActivityCity(city || data.user.city);
                          openActivity();
                        }}
                      >
                        Plan something here <ArrowRight size={14} />
                      </button>
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
