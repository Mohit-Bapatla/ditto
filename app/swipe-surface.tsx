"use client";
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { createPortal } from "react-dom";
import { WheelGesture, type WheelGate } from "@/lib/wheel-gesture";
import { pendingTouches } from "@/lib/pointer-handoff";
import { swipeDecision } from "@/lib/swipe-gesture";

export type SwipeHandle = { swipe: (yes: boolean) => Promise<void> };
export type SwipeCommit = (
  yes: boolean,
  afterSave: () => Promise<void>,
) => Promise<boolean>;
type Phase = "idle" | "dragging" | "saving" | "exiting" | "returning";

/** One physical card, one in-flight transaction. The parent publishes server state only after afterSave. */
export function SwipeSurface({
  children,
  onSwipe,
  disabled,
  label,
  className = "",
  controlRef,
  progress,
  focusHandoffRef,
  wheelGate,
  wheelTarget,
  returnFrom,
}: {
  children: ReactNode;
  onSwipe: SwipeCommit;
  disabled: boolean;
  label: string;
  className?: string;
  controlRef?: Ref<SwipeHandle>;
  progress?: MotionValue<number>;
  focusHandoffRef?: { current: boolean };
  wheelGate?: { current: WheelGate };
  wheelTarget?: RefObject<HTMLDivElement | null>;
  returnFrom?: string;
}) {
  const element = useRef<HTMLElement>(null);
  const start = useRef<
    | {
        x: number;
        originX: number;
        y: number;
        time: number;
        id: number;
        axis?: "x" | "y";
        lastX: number;
        lastTime: number;
        velocity: number;
      }
    | undefined
  >(undefined);
  const wheel = useRef<WheelGesture | undefined>(undefined);
  const wheelCallbacks = useRef({
    disabled,
    commit: (yes: boolean, velocity?: number, touch?: boolean) => {
      void touch;
      void velocity;
      void yes;
    },
    snap: () => {},
  });
  const locked = useRef(false);
  const recovery = useRef(0);
  const mounted = useRef(true);
  const suppressClick = useRef(false);
  const finishExit = useRef<(() => void) | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState("");
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  useLayoutEffect(() => {
    if (!returnFrom || reduced) return;
    x.set(returnFrom === "yes" ? 110 : -110);
    const animation = animate(x, 0, {type: "spring", stiffness: 280, damping: 30});
    return () => animation.stop();
  }, [returnFrom, reduced, x]);
  const rotate = useTransform(
    x,
    [-400, 0, 400],
    reduced ? [0, 0, 0] : [-16, 0, 16],
  );
  const screenOpacity = useMotionValue(0);
  const screenColor = useTransform(x, (value) => value >= 0 ? "#16b96b" : "#ed3650");
  const yesOpacity = useTransform(x, [0, 12, 65], [0, 0.35, 1]);
  const stampScale = useTransform(x, [-110, 0, 110], [1.08, 0.84, 1.08]);
  const noOpacity = useTransform(x, [-65, -12, 0], [1, 0.35, 0]);
  useMotionValueEvent(x, "change", (value) => {
    progress?.set(Math.min(Math.abs(value) / 110, 1));
    if (!locked.current) screenOpacity.set(reduced ? 0 : Math.min(Math.abs(value) / 110, 1) * 0.16);
  });
  useLayoutEffect(() => {
    const card = element.current;
    if (focusHandoffRef?.current) {
      card?.focus({ preventScroll: true });
      focusHandoffRef.current = false;
    }
    return () => {
      if (focusHandoffRef)
        focusHandoffRef.current = document.activeElement === card;
    };
  }, [focusHandoffRef]);
  useEffect(() => {
    mounted.current = true;
    // A tab/app switch can lose the pointer without delivering pointercancel.
    const abandonDrag = () => {
      if (!start.current) return;
      start.current = undefined;
      x.stop();
      x.set(0);
      locked.current = false;
      setPhase("idle");
    };
    const visibility = () => {
      if (document.hidden) abandonDrag();
    };
    window.addEventListener("blur", abandonDrag);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", abandonDrag);
      document.removeEventListener("visibilitychange", visibility);
      mounted.current = false;
      finishExit.current?.();
      progress?.set(0);
    };
  }, [progress, x]);
  async function snapBack() {
    const ticket = ++recovery.current;
    x.stop();
    void animate(screenOpacity, 0, { duration: 0.15 });
    // Recovery is interruptible: the next finger-down owns the card immediately.
    locked.current = false;
    if (mounted.current) setPhase("returning");
    await animate(
      x,
      0,
      reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 440, damping: 30, mass: 0.85 },
    );
    if (mounted.current && recovery.current === ticket) {
      locked.current = false;
      setPhase("idle");
    }
  }
  async function commit(yes: boolean, velocity = 0, touch = false) {
    if (disabled || locked.current) return;
    recovery.current++;
    wheel.current?.discard(performance.now());
    locked.current = true;
    start.current = undefined;
    setFailure("");
    setPhase("saving");
    const sign = yes ? 1 : -1;
    x.stop();
    // Start visual release immediately; publishing the next card still requires
    // BOTH the real server save and this exit. Network failure restores this card.
    const bounds = element.current?.getBoundingClientRect();
    const width = element.current?.clientWidth || 400;
    const travel = bounds
      ? (yes ? window.innerWidth - bounds.left : bounds.right) + width * 0.3
      : window.innerWidth + width;
    const target = x.get() + sign * Math.max(width, travel);
    const acceptedAt = performance.now();
    // Development-only timing evidence, bounded and free of user/activity data.
    const samples: {t: number; x: number}[] = [];
    let frame = 0;
    const trace = () => {
      samples.push({t: performance.now() - acceptedAt, x: x.get()});
      if (samples.length < 30 && mounted.current) frame = requestAnimationFrame(trace);
    };
    if (process.env.NODE_ENV === "development") {
      element.current?.setAttribute("data-swipe-accepted-at", String(acceptedAt));
      trace();
    }
    const done = () => {
      cancelAnimationFrame(frame);
      if (process.env.NODE_ENV === "development") {
        const traceTarget = wheelTarget?.current || element.current;
        traceTarget?.setAttribute("data-swipe-timing", JSON.stringify(samples));
      }
    };
    const exit = new Promise<void>((resolve) => {
      const complete = () => {
        // Keep the old bitmap hidden until React replaces this keyed surface.
        // A delayed response or a Motion cleanup must never reveal it at x=0.
        opacity.set(0);
        if(element.current)element.current.style.visibility="hidden";
        done(); resolve();
      };
      finishExit.current = () => { done(); resolve(); };
      if (reduced) animate(opacity, 0, { duration: 0.1, onComplete: complete });
      else animate(x, target, {
        duration: touch ? 0.28 : Math.max(0.46, 0.5 - Math.min(Math.abs(velocity), 2) * 0.02),
        ease: [0.28, 0.5, 0.4, 1],
        onComplete: complete,
      });
    });
    if (!reduced) void animate(screenOpacity, [screenOpacity.get(), 0.24, 0], {
      duration: 0.45, times: [0, 0.2, 1], ease: "easeOut",
    });
    try {
      const saved = await onSwipe(yes, async () => {
        if (!mounted.current) return;
        setPhase("exiting");
        await exit;
        finishExit.current = undefined;
      });
      if (saved) return; // Remain locked until the keyed card is replaced by committed server state.
    } catch {
      /* The parent also exposes the actionable network/server error. */
    }
    if (mounted.current) {
      if(wheelTarget?.current)pendingTouches.delete(wheelTarget.current);
      x.stop();
      opacity.stop();
      finishExit.current?.();
      finishExit.current = undefined;
      setFailure("Your vote wasn’t saved. Try again.");
      opacity.set(1);
      if(element.current)element.current.style.visibility="visible";
      await snapBack();
    }
  }
  useLayoutEffect(() => {
    wheelCallbacks.current = {
      disabled,
      commit: (yes, velocity, touch) => {
        void commit(yes, velocity, touch);
      },
      snap: () => {
        void snapBack();
      },
    };
  });
  useEffect(() => {
    const card = element.current;
    if (!wheelGate || !card) return;
    const target = wheelTarget?.current || card;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new WheelGesture(
      wheelGate.current,
      () => card.clientWidth,
      (value) => {
        x.stop();
        x.set(value);
        setFailure("");
        setPhase("dragging");
      },
      (vote, velocity) => {
        if (vote === undefined || wheelCallbacks.current.disabled) wheelCallbacks.current.snap();
        else wheelCallbacks.current.commit(vote, velocity);
      },
    );
    wheel.current = controller;
    const cancel = () => {
      clearTimeout(timer);
      controller.cancel(performance.now());
    };
    const hidden = () => {
      if (document.hidden) cancel();
    };
    const events: {time: number; dx: number; dy: number; ready: boolean; reason: string}[] = [];
    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        start.current ||
        (event.target as HTMLElement).closest("button,a,input,select,textarea")
      )
        return;
      const ready = !wheelCallbacks.current.disabled && !locked.current;
      const consumed = controller.input(event.deltaX, event.deltaY, event.deltaMode, performance.now(), ready);
      if (process.env.NODE_ENV === "development") {
        events.push({time: performance.now(), dx:event.deltaX, dy:event.deltaY, ready, reason:controller.reason});
        if (events.length > 40) events.shift();
        target.setAttribute("data-wheel-events", JSON.stringify(events));
      }
      if (consumed) {
        if (event.cancelable) event.preventDefault();
        clearTimeout(timer);
        timer = setTimeout(() => controller.end(performance.now()), 180);
      }
    };
    target.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearTimeout(timer);
      target.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hidden);
      wheel.current = undefined;
    };
  }, [wheelGate, wheelTarget, x]);
  useLayoutEffect(()=>{
    const deck=wheelTarget?.current, card=element.current;
    const p=deck && pendingTouches.get(deck);
    if(disabled || !card || !deck || !p || p.blockedCard===card)return;
    pendingTouches.delete(deck);
    if(performance.now()-p.time>1500)return;
    if(p.endedAt!==undefined){
      const vote=swipeDecision(p.lastX-p.x,p.lastY-p.y,p.endedAt-p.time,card.clientWidth);
      if(vote!==undefined)queueMicrotask(()=>{if(mounted.current)wheelCallbacks.current.commit(vote,0,!!p.touch);});
      return;
    }
    if(Math.abs(p.lastY-p.y)>Math.abs(p.lastX-p.x)*1.15 && Math.abs(p.lastY-p.y)>8)return;
    recovery.current++;
    x.stop();
    const horizontal=Math.abs(p.lastX-p.x)>8 && Math.abs(p.lastX-p.x)>Math.abs(p.lastY-p.y)*1.15;
    start.current={x:p.x,originX:p.x,y:p.y,time:p.time,id:p.id,lastX:p.lastX,lastTime:performance.now(),velocity:0,axis:horizontal?"x":undefined};
    try {card.setPointerCapture(p.id);} catch {start.current=undefined;return;}
    if(horizontal){x.set(p.lastX-p.x);suppressClick.current=true;queueMicrotask(()=>{if(mounted.current && start.current?.id===p.id)setPhase("dragging");});}
  }, [wheelTarget, disabled, x]);
  useImperativeHandle(controlRef, () => ({ swipe: commit }));
  function cancelPointer() {
    if (!start.current) return;
    start.current = undefined;
    void snapBack();
  }
  return (
    <>
    {phase !== "idle" && createPortal(
      <motion.div aria-hidden="true" className="swipe-screen-feedback"
        style={{ opacity: screenOpacity, backgroundColor: screenColor }} />, document.body
    )}
    <motion.article
      ref={element}
      className={`swipe-surface ${className}`}
      tabIndex={0}
      aria-label={label}
      aria-busy={phase === "saving" || phase === "exiting"}
      data-swipe-phase={phase}
      style={{
        x,
        rotate,
        opacity,
        touchAction: "pan-y",
        transformOrigin: "50% 85%",
      }}
      onPointerDown={(e) => {
        if (process.env.NODE_ENV === "development") e.currentTarget.setAttribute("data-swipe-input", JSON.stringify({event:"down",disabled,locked:locked.current,wheel:wheel.current?.dragging,x:e.clientX,y:e.clientY,primary:e.isPrimary,button:e.button}));
        // A new tap is independent of the click synthesized by the previous drag.
        suppressClick.current = false;
        if (
          disabled ||
          locked.current ||
          wheel.current?.dragging ||
          !e.isPrimary ||
          e.button !== 0 ||
          (e.target as HTMLElement).closest("button,a,input,select,textarea")
        )
          return;
        recovery.current++;
        x.stop();
        setFailure("");
        start.current = {
          x: e.clientX - x.get(),
          originX: e.clientX,
          y: e.clientY,
          time: performance.now(),
          id: e.pointerId,
          lastX: e.clientX,
          lastTime: performance.now(),
          velocity: 0,
        };
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId || locked.current) return;
        const dx = e.clientX - s.x,
          dy = e.clientY - s.y,
          now = performance.now();
        const travelX = e.clientX - s.originX;
        if (!s.axis && Math.max(Math.abs(travelX), Math.abs(dy)) > 8) {
          if (Math.abs(travelX) > Math.abs(dy) * 1.15) s.axis = "x";
          else if (Math.abs(dy) > Math.abs(travelX) * 1.15) s.axis = "y";
          // Ambiguous diagonal starts stay undecided rather than becoming a dead swipe.
        }
        if (s.axis === "x") {
          if (e.cancelable) e.preventDefault();
          if (!e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.setPointerCapture(e.pointerId);
          if (now > s.lastTime)
            s.velocity = (e.clientX - s.lastX) / (now - s.lastTime);
          s.lastX = e.clientX;
          s.lastTime = now;
          x.set(dx);
          suppressClick.current = true;
          setPhase("dragging");
        }
      }}
      onPointerUp={(e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const now = performance.now();
        const vote =
          s.axis === "x"
            ? swipeDecision(
                e.clientX - s.originX,
                e.clientY - s.y,
                now - s.time,
                e.currentTarget.clientWidth,
                now - s.lastTime < 100 ? s.velocity : 0,
              )
            : undefined;
        if (process.env.NODE_ENV === "development") e.currentTarget.setAttribute("data-swipe-input", JSON.stringify({event:"up",vote,dx:e.clientX-s.x,axis:s.axis}));
        start.current = undefined;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        if (vote === undefined) void snapBack();
        else void commit(vote, s.velocity, e.pointerType === "touch");
      }}
      onPointerCancel={cancelPointer}
      onLostPointerCapture={(e) => {
        // Touch starts with implicit capture on the tapped child (often the image).
        // Its bubbled loss when we capture the card is a transfer, not a canceled drag.
        if (e.target === e.currentTarget && start.current?.id === e.pointerId)
          cancelPointer();
      }}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || e.repeat) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          void commit(e.key === "ArrowRight");
        }
      }}
    >
      {children}
      <motion.div
        aria-hidden="true"
        className="swipe-feedback positive"
        style={{ opacity: yesOpacity }}
      >
        <motion.span style={{ scale: stampScale }}>DITTO</motion.span>
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="swipe-feedback negative"
        style={{ opacity: noOpacity }}
      >
        <motion.span style={{ scale: stampScale }}>PASS</motion.span>
      </motion.div>
      {phase === "saving" && (
        <span className="swipe-saving" role="status">
          Saving your vote…
        </span>
      )}
      {failure && (
        <span className="swipe-failure" role="alert">
          {failure}
        </span>
      )}
    </motion.article>
    </>
  );
}
