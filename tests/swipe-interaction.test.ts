import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// A DOM test runs the actual React pointer handlers and Motion values, not a parallel swipe implementation.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
const win = dom.window;
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "Element",
  "SVGElement",
  "Node",
  "MouseEvent",
  "KeyboardEvent",
  "getComputedStyle",
] as const)
  Object.defineProperty(globalThis, key, {
    value:
      key === "window" ? win : key === "document" ? win.document : win[key],
    configurable: true,
  });
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  configurable: true,
});
const raf = (cb: FrameRequestCallback) =>
  setTimeout(() => cb(performance.now()), 16);
Object.assign(globalThis, {
  requestAnimationFrame: raf,
  cancelAnimationFrame: clearTimeout,
});
Object.assign(win, {
  requestAnimationFrame: raf,
  cancelAnimationFrame: clearTimeout,
  matchMedia: () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }),
});
const captures = new WeakMap<Element, Set<number>>();
win.HTMLElement.prototype.setPointerCapture = function (id: number) {
  const set = captures.get(this) || new Set();
  set.add(id);
  captures.set(this, set);
};
win.HTMLElement.prototype.hasPointerCapture = function (id: number) {
  return captures.get(this)?.has(id) || false;
};
win.HTMLElement.prototype.releasePointerCapture = function (id: number) {
  captures.get(this)?.delete(id);
};
const { createElement, act, createRef } = await import("react");
const { createRoot } = await import("react-dom/client");
const { SwipeSurface } = await import("../app/swipe-surface");
const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function mount(
  onSwipe: (yes: boolean, exit: () => Promise<void>) => Promise<boolean>,
  disabled = false,
) {
  const host = win.document.createElement("div");
  win.document.body.append(host);
  const root = createRoot(host);
  const ref = createRef<import("../app/swipe-surface").SwipeHandle>();
  await act(async () => {
    root.render(
      createElement(
        SwipeSurface,
        {
          label: "Test outing",
          disabled,
          onSwipe,
          controlRef: ref,
          children: null,
        },
        createElement("h2", null, "Test outing"),
        createElement("button", null, "Details"),
      ),
    );
  });
  const card = host.querySelector("article")!;
  Object.defineProperty(card, "clientWidth", { value: 360 });
  const pointer = async (
    type: string,
    x: number,
    y: number,
    target: Element = card,
  ) => {
    await act(async () => {
      const e = new win.MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
      });
      Object.defineProperties(e, {
        pointerId: { value: 1 },
        isPrimary: { value: true },
        pointerType: { value: "touch" },
      });
      target.dispatchEvent(e);
      await pause(25);
    });
  };
  const key = async (value: string, repeat = false, target: Element = card) => {
    await act(async () => {
      target.dispatchEvent(
        new win.KeyboardEvent("keydown", { key: value, repeat, bubbles: true }),
      );
      await pause(20);
    });
  };
  return {
    card,
    ref,
    pointer,
    key,
    async cleanup() {
      await act(async () => root.unmount());
      host.remove();
    },
  };
}

test("physical pointer movement renders progressive feedback; incomplete drag springs back without a vote", async () => {
  let calls = 0;
  const t = await mount(async () => {
    calls++;
    return false;
  });
  await t.pointer("pointerdown", 150, 200);
  await t.pointer("pointermove", 210, 202);
  assert.equal(t.card.dataset.swipePhase, "dragging");
  assert.match(t.card.style.transform, /translateX\(60px\)/);
  assert.ok(
    Number((t.card.querySelector(".positive") as HTMLElement).style.opacity) >
      0,
  );
  await pause(120);
  await t.pointer("pointerup", 210, 202);
  await act(async () => pause(650));
  assert.equal(calls, 0);
  assert.equal(t.card.dataset.swipePhase, "idle");
  assert.equal(t.card.style.transform, "none");
  await t.cleanup();
});

test("save is awaited before exit, publish follows exit, and rapid pointer/key/button requests cannot double-submit", async () => {
  let calls = 0,
    published = false,
    resolveSave!: () => void;
  const saved = new Promise<void>((r) => {
    resolveSave = r;
  });
  const t = await mount(async (yes, exit) => {
    calls++;
    assert.equal(yes, true);
    await saved;
    await exit();
    published = true;
    return true;
  });
  await t.pointer("pointerdown", 100, 200);
  await t.pointer("pointermove", 240, 202);
  await t.pointer("pointerup", 240, 202);
  assert.equal(calls, 1);
  assert.equal(published, false);
  assert.equal(t.card.dataset.swipePhase, "saving");
  await t.key("ArrowLeft");
  await t.pointer("pointerdown", 200, 200);
  await t.pointer("pointermove", 40, 200);
  await t.pointer("pointerup", 40, 200);
  await act(async () => {
    void t.ref.current?.swipe(false);
  });
  assert.equal(calls, 1);
  assert.equal(published, false);
  await act(async () => {
    resolveSave();
    await pause(50);
  });
  assert.equal(t.card.dataset.swipePhase, "exiting");
  assert.equal(published, false);
  await act(async () => pause(420));
  assert.equal(published, true);
  assert.equal(calls, 1);
  await t.cleanup();
});

test("failed save snaps the same card back and allows a retry without publishing", async () => {
  let calls = 0;
  const t = await mount(async () => {
    calls++;
    return false;
  });
  await t.key("ArrowLeft");
  await act(async () => pause(700));
  assert.equal(calls, 1);
  assert.equal(t.card.dataset.swipePhase, "idle");
  assert.equal(t.card.style.transform, "none");
  assert.match(t.card.textContent!, /wasn’t saved/);
  await t.key("ArrowRight");
  await act(async () => pause(700));
  assert.equal(calls, 2);
  await t.cleanup();
});

test("vertical scrolling, pointer cancellation, nested controls and repeat keys never commit", async () => {
  let calls = 0;
  const t = await mount(async () => {
    calls++;
    return false;
  });
  await t.pointer("pointerdown", 100, 200);
  await t.pointer("pointermove", 140, 360);
  await t.pointer("pointerup", 140, 360);
  await act(async () => pause(100));
  await t.pointer("pointerdown", 100, 200);
  await t.pointer("pointermove", 170, 200);
  await t.pointer("pointercancel", 170, 200);
  await act(async () => pause(650));
  await t.key("ArrowRight", true);
  await t.key("ArrowRight", false, t.card.querySelector("button")!);
  await t.pointer("pointerdown", 100, 200, t.card.querySelector("button")!);
  await t.pointer("pointermove", 250, 200);
  await t.pointer("pointerup", 250, 200);
  assert.equal(calls, 0);
  await t.cleanup();
});

test("left pointer swipe submits false; disabled cards ignore keyboard and gestures", async () => {
  const votes: boolean[] = [];
  const t = await mount(async (yes) => {
    votes.push(yes);
    return false;
  });
  await t.pointer("pointerdown", 230, 200);
  await t.pointer("pointermove", 70, 200);
  await t.pointer("pointerup", 70, 200);
  await act(async () => pause(650));
  assert.deepEqual(votes, [false]);
  await t.cleanup();
  const off = await mount(async (yes) => {
    votes.push(yes);
    return false;
  }, true);
  await off.key("ArrowRight");
  await off.pointer("pointerdown", 100, 200);
  await off.pointer("pointermove", 250, 200);
  await off.pointer("pointerup", 250, 200);
  assert.deepEqual(votes, [false]);
  await off.cleanup();
});

test("keyboard focus follows a replaced card without stealing button focus", async () => {
  const host = win.document.createElement("div");
  win.document.body.append(host);
  const root = createRoot(host);
  const focusHandoffRef = { current: false };
  const render = (key: string) =>
    root.render(
      createElement(SwipeSurface, {
        key,
        label: key,
        disabled: false,
        children: null,
        focusHandoffRef,
        onSwipe: async () => true,
      }),
    );
  await act(async () => render("first"));
  host.querySelector("article")!.focus();
  await act(async () => render("second"));
  assert.equal(win.document.activeElement, host.querySelector("article"));
  assert.equal(
    win.document.activeElement?.getAttribute("aria-label"),
    "second",
  );
  const button = win.document.createElement("button");
  win.document.body.append(button);
  button.focus();
  await act(async () => render("third"));
  assert.equal(win.document.activeElement, button);
  await act(async () => root.unmount());
  host.remove();
  button.remove();
});

test("losing the window during a drag cancels without voting or stranding the card", async () => {
  let calls = 0;
  const t = await mount(async () => {
    calls++;
    return false;
  });
  await t.pointer("pointerdown", 100, 200);
  await t.pointer("pointermove", 230, 201);
  await act(async () => {
    win.dispatchEvent(new win.Event("blur"));
    await pause(25);
  });
  assert.equal(t.card.dataset.swipePhase, "idle");
  assert.equal(t.card.style.transform, "none");
  await t.pointer("pointerup", 230, 201);
  assert.equal(calls, 0);
  await t.cleanup();
});

test("failed activity imagery has a truthful readable fallback", async () => {
  const { ActivityPhoto } = await import("../app/activity-photo");
  const host = win.document.createElement("div");
  win.document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      createElement(ActivityPhoto, {
        src: "/missing-qa.jpg",
        alt: "Outdoors inspiration",
      }),
    ),
  );
  await act(async () =>
    host.querySelector("img")!.dispatchEvent(new win.Event("error")),
  );
  assert.equal(host.querySelector("img"), null);
  assert.equal(
    host.querySelector('[role="img"]')?.getAttribute("aria-label"),
    "Outdoors inspiration. Photo unavailable",
  );
  await act(async () => root.unmount());
  host.remove();
});
