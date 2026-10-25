/** A still-held touch on the next-card preview may outlive the outgoing card. */
export type PendingTouch = {id:number;x:number;y:number;lastX:number;lastY:number;time:number;blockedCard:Element|null;endedAt?:number;touch?:boolean};
export const pendingTouches = new WeakMap<HTMLElement,PendingTouch>();
