"use client";
import { useRef } from "react";
import type { WheelGate } from "@/lib/wheel-gesture";

/** Keep wheel momentum and its stationary hit area alive across keyed cards. */
export function useSwipeDeck() {
  const wheelGate = useRef<WheelGate>({lastEvent: -Infinity, quietUntil: 0});
  const wheelTarget = useRef<HTMLDivElement>(null);
  return {wheelGate, wheelTarget};
}
