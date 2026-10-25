"use client";
import { useRef, useState, type ReactNode } from "react";
import { swipeDecision } from "@/lib/swipe-gesture";
export function SwipeSurface({
  children,
  onSwipe,
  disabled,
  label,
  className = "",
}: {
  children: ReactNode;
  onSwipe: (yes: boolean) => void;
  disabled: boolean;
  label: string;
  className?: string;
}) {
  const start = useRef<
    | { x: number; y: number; time: number; id: number; axis?: "x" | "y" }
    | undefined
  >(undefined);
  const [offset, setOffset] = useState(0);
  const suppressClick = useRef(false);
  function reset() {
    start.current = undefined;
    setOffset(0);
  }
  return (
    <article
      className={`swipe-surface ${className}`}
      tabIndex={0}
      aria-label={label}
      style={{
        transform: `translateX(${offset}px) rotate(${offset / 22}deg)`,
        transition: offset ? "none" : undefined,
      }}
      onPointerDown={(e) => {
        if (
          disabled ||
          !e.isPrimary ||
          e.button !== 0 ||
          (e.target as HTMLElement).closest("button,a,input,select,textarea")
        )
          return;
        suppressClick.current = false;
        start.current = {
          x: e.clientX,
          y: e.clientY,
          time: performance.now(),
          id: e.pointerId,
        };
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x,
          dy = e.clientY - s.y;
        if (!s.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8)
          s.axis = Math.abs(dx) > Math.abs(dy) * 1.25 ? "x" : "y";
        if (s.axis === "x") {
          e.currentTarget.setPointerCapture(e.pointerId);
          setOffset(dx);
          suppressClick.current = true;
        }
      }}
      onPointerUp={(e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const vote =
          s.axis === "x"
            ? swipeDecision(
                e.clientX - s.x,
                e.clientY - s.y,
                performance.now() - s.time,
                e.currentTarget.clientWidth,
              )
            : undefined;
        reset();
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        if (vote !== undefined && !disabled) onSwipe(vote);
      }}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || disabled || e.repeat) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onSwipe(e.key === "ArrowRight");
        }
      }}
    >
      {children}
      <span
        aria-hidden="true"
        className={`swipe-stamp ${offset > 0 ? "yes" : "no"}`}
        style={{ opacity: Math.min(Math.abs(offset) / 80, 1) }}
      >
        {offset > 0 ? "DITTO" : "PASS"}
      </span>
    </article>
  );
}
