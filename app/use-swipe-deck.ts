"use client";
import { useEffect, useRef } from "react";
import { pendingTouches } from "@/lib/pointer-handoff";
import type { WheelGate } from "@/lib/wheel-gesture";

/** Keep wheel momentum and its stationary hit area alive across keyed cards. */
export function useSwipeDeck() {
  const wheelGate = useRef<WheelGate>({lastEvent: -Infinity, quietUntil: 0});
  const wheelTarget = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const deck=wheelTarget.current;
    if(!deck)return;
    const down=(e:PointerEvent)=>{
      if(e.button!==0 || !e.isPrimary || (e.target as HTMLElement).closest("button,a,input,select,textarea"))return;
      const card=deck.querySelector(".swipe-surface");
      const phase=card?.getAttribute("data-swipe-phase");
      if(phase!=="saving" && phase!=="exiting")return;
      pendingTouches.set(deck,{id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),blockedCard:card,touch:e.pointerType==="touch"});
      // Keep the touch alive when its preview node is replaced.
      deck.setPointerCapture(e.pointerId);
    };
    const move=(e:PointerEvent)=>{const p=pendingTouches.get(deck);if(p?.id===e.pointerId){p.lastX=e.clientX;p.lastY=e.clientY;}};
    const end=(e:PointerEvent)=>{const p=pendingTouches.get(deck);if(p?.id!==e.pointerId)return;
      if(e.type==="pointercancel"){pendingTouches.delete(deck);return;}
      p.lastX=e.clientX;p.lastY=e.clientY;p.endedAt=performance.now();
    };
    const clear=()=>pendingTouches.delete(deck);
    deck.addEventListener("pointerdown",down,true);
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",end);
    window.addEventListener("pointercancel",end);
    window.addEventListener("blur",clear);
    return ()=>{deck.removeEventListener("pointerdown",down,true);window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",end);window.removeEventListener("pointercancel",end);window.removeEventListener("blur",clear);};
  });
  return {wheelGate, wheelTarget};
}
