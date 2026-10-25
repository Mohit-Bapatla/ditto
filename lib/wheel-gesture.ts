import { swipeDecision } from "./swipe-gesture";
export type WheelGate = { lastEvent: number; quietUntil: number; lastDelta?: number; committedAt?: number; peak?: number; valley?: number };
export const wheelQuietMs = 220;
export function wheelPixels(
  dx: number,
  dy: number,
  mode: number,
  width: number,
) {
  const factor = mode === 1 ? 16 : mode === 2 ? width : 1;
  return { x: Math.max(-240, Math.min(240, dx * factor)), y: dy * factor };
}
/** Per-deck gate survives keyed cards so momentum cannot vote on the next activity. */
export class WheelGesture {
  reason = "idle";
  private active = false;
  private distance = 0;
  private began = 0;
  private last = 0;
  private velocity = 0;
  constructor(
    public gate: WheelGate,
    private width: () => number,
    private move: (x: number) => void,
    private finish: (vote: boolean | undefined, velocity?: number) => void,
  ) {}
  input(dx: number, dy: number, mode: number, now: number, ready: boolean) {
    const d = wheelPixels(dx, dy, mode, this.width());
    if (Math.abs(d.x) < 1 || Math.abs(d.x) < Math.abs(d.y) * 1.5) {
      if (Math.abs(d.y) > 4) this.cancel(now);
      this.reason = "vertical-or-tiny";
      return false;
    }
    const previous = this.gate.lastEvent;
    const previousDelta = this.gate.lastDelta || 0;
    this.gate.lastEvent = now;
    this.gate.lastDelta = d.x;
    // Momentum decays; a fresh, deliberate burst accelerates after a pause.
    // Constant/alternating tails cannot unlock the next card.
    const magnitude = Math.abs(d.x);
    const valley = this.gate.valley ?? Math.abs(previousDelta);
    const peak = this.gate.peak || Math.abs(previousDelta);
    const reaccelerating = now - (this.gate.committedAt ?? now) >= 180 &&
      valley <= Math.max(4, peak * 0.4) && magnitude >= Math.max(10, valley * 2.5);
    const freshBurst = reaccelerating || (now - previous >= 80 && magnitude >= 12 &&
      (magnitude >= Math.abs(previousDelta) * 2.5 ||
       (now - previous >= 120 && Math.sign(d.x) !== Math.sign(previousDelta))));
    this.gate.valley = Math.min(valley, magnitude);
    if (!ready) {
      this.reason = "transaction-active";
      this.cancel(now);
      this.gate.quietUntil = now + wheelQuietMs;
      return true;
    }
    if (
      !this.active && !freshBurst &&
      (now < this.gate.quietUntil ||
        (now - previous < wheelQuietMs && this.gate.quietUntil > 0))
    ) {
      this.reason = "momentum-tail";
      this.gate.quietUntil = now + wheelQuietMs;
      return true;
    }
    this.reason = freshBurst ? "fresh-burst" : "tracking";
    if (!this.active) {
      this.active = true;
      this.began = now;
      this.last = now - 16;
      this.distance = 0;
      this.velocity = 0;
    }
    const elapsed = Math.max(8, now - this.last);
    if (Math.abs(d.x) >= 3) this.velocity = d.x / elapsed;
    this.last = now;
    this.distance = Math.max(
      -this.width(),
      Math.min(this.width(), this.distance + d.x),
    );
    this.move(this.distance);
    // Distance acceptance belongs to input, not the trailing momentum timer.
    // Flicks need multiple samples so a single accidental wheel tick cannot vote.
    const threshold = Math.max(64, Math.min(110, this.width() * 0.24));
    if (Math.abs(this.distance) >= threshold ||
        (now > this.began && Math.abs(this.distance) >= 48 &&
         Math.abs(this.velocity) >= 0.8 && Math.sign(this.velocity) === Math.sign(this.distance))) {
      this.end(now);
    }
    return true;
  }
  end(now: number) {
    if (!this.active) return;
    this.active = false;
    this.gate.quietUntil = now + wheelQuietMs;
    const result = swipeDecision(
      this.distance,
      0,
      now - this.began,
      this.width(),
      now - this.last < 100 ? this.velocity : 0,
    );
    this.finish(result, this.velocity);
  }
  cancel(now: number) {
    if (this.active) {
      this.active = false;
      this.gate.quietUntil = now + wheelQuietMs;
      this.finish(undefined);
    }
  }
  discard(now: number) {
    this.active = false;
    this.gate.committedAt = now;
    this.gate.peak = Math.max(12, Math.abs(this.gate.lastDelta || 0));
    this.gate.valley = this.gate.peak;
    this.gate.quietUntil = now + wheelQuietMs;
  }
  get dragging() {
    return this.active;
  }
}
