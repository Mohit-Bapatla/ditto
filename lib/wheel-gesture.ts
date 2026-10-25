import { swipeDecision } from "./swipe-gesture";
export type WheelGate = { lastEvent: number; quietUntil: number };
export const wheelQuietMs = 350;
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
  private active = false;
  private distance = 0;
  private began = 0;
  private last = 0;
  private velocity = 0;
  constructor(
    public gate: WheelGate,
    private width: () => number,
    private move: (x: number) => void,
    private finish: (vote: boolean | undefined) => void,
  ) {}
  input(dx: number, dy: number, mode: number, now: number, ready: boolean) {
    const d = wheelPixels(dx, dy, mode, this.width());
    if (Math.abs(d.x) < 1 || Math.abs(d.x) < Math.abs(d.y) * 1.5) {
      if (Math.abs(d.y) > 4) this.cancel(now);
      return false;
    }
    const previous = this.gate.lastEvent;
    this.gate.lastEvent = now;
    if (!ready) {
      this.cancel(now);
      this.gate.quietUntil = now + wheelQuietMs;
      return true;
    }
    if (
      !this.active &&
      (now < this.gate.quietUntil ||
        (now - previous < wheelQuietMs && this.gate.quietUntil > 0))
    ) {
      this.gate.quietUntil = now + wheelQuietMs;
      return true;
    }
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
    if (now - this.began > 1600) this.end(now);
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
      this.velocity,
    );
    this.finish(result);
  }
  cancel(now: number) {
    if (this.active) {
      this.active = false;
      this.gate.quietUntil = now + wheelQuietMs;
      this.finish(undefined);
    }
  }
  discard(now: number) {
    if (this.active) {
      this.active = false;
      this.gate.quietUntil = now + wheelQuietMs;
    }
  }
  get dragging() {
    return this.active;
  }
}
