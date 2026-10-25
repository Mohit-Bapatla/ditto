// Shared by discovery and private voting. Vertical intent always wins over a flick.
export function swipeDecision(
  dx: number,
  dy: number,
  elapsedMs: number,
  width: number,
  releaseVelocity?: number,
): boolean | undefined {
  if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
  const threshold = Math.max(64, Math.min(110, width * 0.24));
  const velocity =
    releaseVelocity === undefined
      ? Math.abs(dx) / Math.max(elapsedMs, 16)
      : Math.abs(releaseVelocity);
  if (Math.abs(dx) >= threshold || (Math.abs(dx) >= 32 && velocity >= 0.65))
    return dx > 0;
}
