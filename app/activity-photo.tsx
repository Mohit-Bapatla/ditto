"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Stable media bounds, with an honest fallback when a remote photograph fails. */
export function ActivityPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="activity-photo-fallback"
      role="img"
      aria-label={`${alt}. Photo unavailable`}
    >
      <ImageOff size={28} aria-hidden="true" />
      <span>Photo unavailable</span>
    </div>
  ) : (
    <img
      className="activity-photo"
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
