"use client";
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
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
}) {
  const element = useRef<HTMLElement>(null);
  const start = useRef<
    | {
        x: number;
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
    commit: (yes: boolean) => {
      void yes;
    },
    snap: () => {},
  });
  const locked = useRef(false);
  const mounted = useRef(true);
  const suppressClick = useRef(false);
  const finishExit = useRef<(() => void) | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState("");
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  const rotate = useTransform(
    x,
    [-400, 0, 400],
    reduced ? [0, 0, 0] : [-16, 0, 16],
  );
  const screenOpacity = useMotionValue(0);
  const screenColor = useTransform(x, (value) => value >= 0 ? "#16b96b" : "#ed3650");
  const yesOpacity = useTransform(x, [0, 12, 65], [0, 0.35, 1]);
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
    void animate(screenOpacity, 0, { duration: 0.15 });
    locked.current = true;
    if (mounted.current) setPhase("returning");
    await animate(
      x,
      0,
      reduced
        ? { duration: 0 }
        : { type: "spring", stiffness: 440, damping: 30, mass: 0.85 },
    );
    if (mounted.current) {
      locked.current = false;
      setPhase("idle");
    }
  }
  async function commit(yes: boolean) {
    if (disabled || locked.current) return;
    wheel.current?.discard(performance.now());
    locked.current = true;
    start.current = undefined;
    setFailure("");
    setPhase("saving");
    const sign = yes ? 1 : -1;
    x.stop();
    // Start visual release immediately; publishing the next card still requires
    // BOTH the real server save and this exit. Network failure restores this card.
    const target = sign * (window.innerWidth + (element.current?.clientWidth || 400));
    const exit = new Promise<void>((resolve) => {
      finishExit.current = resolve;
      if (reduced) animate(opacity, 0, { duration: 0.1, onComplete: resolve });
      else animate(x, target, {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
        onComplete: resolve,
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
      x.stop();
      opacity.stop();
      finishExit.current?.();
      finishExit.current = undefined;
      setFailure("Your vote wasn’t saved. Try again.");
      opacity.set(1);
      await snapBack();
    }
  }
  useLayoutEffect(() => {
    wheelCallbacks.current = {
      disabled,
      commit: (yes) => {
        void commit(yes);
      },
      snap: () => {
        void snapBack();
      },
    };
  });
  useEffect(() => {
    const card = element.current;
    if (!wheelGate || !card) return;
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
      (vote) => {
        if (vote === undefined || wheelCallbacks.current.disabled) wheelCallbacks.current.snap();
        else wheelCallbacks.current.commit(vote);
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
    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        start.current ||
        (event.target as HTMLElement).closest("button,a,input,select,textarea")
      )
        return;
      if (
        controller.input(
          event.deltaX,
          event.deltaY,
          event.deltaMode,
          performance.now(),
          !wheelCallbacks.current.disabled && !locked.current,
        )
      ) {
        if (event.cancelable) event.preventDefault();
        clearTimeout(timer);
        timer = setTimeout(() => controller.end(performance.now()), 180);
      }
    };
    card.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearTimeout(timer);
      card.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hidden);
      wheel.current = undefined;
    };
  }, [wheelGate, x]);
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
        x.stop();
        setFailure("");
        start.current = {
          x: e.clientX - x.get(),
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
        if (!s.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8)
          s.axis = Math.abs(dx) > Math.abs(dy) * 1.25 ? "x" : "y";
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
                e.clientX - s.x,
                e.clientY - s.y,
                now - s.time,
                e.currentTarget.clientWidth,
                now - s.lastTime < 100 ? s.velocity : 0,
              )
            : undefined;
        start.current = undefined;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        if (vote === undefined) void snapBack();
        else void commit(vote);
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
        <span>DITTO</span>
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="swipe-feedback negative"
        style={{ opacity: noOpacity }}
      >
        <span>PASS</span>
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
