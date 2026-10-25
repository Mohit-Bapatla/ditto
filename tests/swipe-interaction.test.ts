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
          wheelGate: { current: { lastEvent: -Infinity, quietUntil: 0 } },
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

test("exit starts during save, publication waits for both, and rapid input cannot double-submit", async () => {
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
  await act(async () => pause(80));
  assert.ok(Number(t.card.style.transform.match(/translateX\(([-\d.]+)px/)?.[1]) > 180, "card must continue moving while server save is unresolved");
  assert.equal(published, false);
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
  // Exit may already have completed while the network was pending.
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

test("horizontal wheel moves the actual card, vertical wheel passes through, and one burst saves once", async () => {
  let calls = 0;
  const t = await mount(async (_yes, exit) => {
    calls++;
    await exit();
    return true;
  });
  await act(async () => {
    const vertical = new win.WheelEvent("wheel", {
      deltaY: 80,
      deltaX: 2,
      bubbles: true,
      cancelable: true,
    });
    t.card.dispatchEvent(vertical);
    assert.equal(vertical.defaultPrevented, false);
    t.card.dispatchEvent(
      new win.WheelEvent("wheel", {
        deltaX: 45,
        deltaY: 1,
        bubbles: true,
        cancelable: true,
      }),
    );
    await pause(25);
  });
  assert.equal(t.card.dataset.swipePhase, "dragging");
  assert.match(t.card.style.transform, /translateX/);
  assert.equal(calls, 0);
  await act(async () => {
    t.card.dispatchEvent(
      new win.WheelEvent("wheel", {
        deltaX: 60,
        bubbles: true,
        cancelable: true,
      }),
    );
    await pause(600);
  });
  assert.equal(calls, 1);
  await act(async () => {
    t.card.dispatchEvent(
      new win.WheelEvent("wheel", {
        deltaX: 100,
        bubbles: true,
        cancelable: true,
      }),
    );
    await pause(250);
  });
  assert.equal(calls, 1);
  await t.cleanup();
});


test("wheel snapback does not swallow the next Details click", async () => {
  const t = await mount(async () => { throw Error("Short gesture must not vote"); });
  await act(async () => {
    t.card.dispatchEvent(new win.WheelEvent("wheel", {deltaX:10,bubbles:true,cancelable:true}));
    await pause(650);
  });
  const click = new win.MouseEvent("click", {bubbles:true,cancelable:true});
  await act(async () => t.card.querySelector("button")!.dispatchEvent(click));
  assert.equal(click.defaultPrevented,false);
  assert.equal(t.card.dataset.swipePhase,"idle");
  await t.cleanup();
});


test("a new tap on Details after pointer snapback is not swallowed", async () => {
 const t=await mount(async () => {throw Error("Short drag must not vote");});
 await t.pointer("pointerdown",180,240);
 await t.pointer("pointermove",195,240);
 await pause(150);
 await t.pointer("pointerup",195,240);
 const button=t.card.querySelector("button")!;
 await t.pointer("pointerdown",195,240,button);
 await t.pointer("pointerup",195,240,button);
 const event=new win.MouseEvent("click",{bubbles:true,cancelable:true});
 await act(async()=>button.dispatchEvent(event));
 assert.equal(event.defaultPrevented,false);
 await t.cleanup();
});


test("implicit touch capture transfer from a child must not cancel the card drag", async () => {
 let votes=0;
 const t=await mount(async (_yes,exit)=>{votes++;await exit();return true;});
 const child=t.card.querySelector("h2")!;
 await t.pointer("pointerdown",180,240,child);
 await t.pointer("pointermove",220,240,child);
 await t.pointer("lostpointercapture",220,240,child);
 assert.equal(t.card.dataset.swipePhase,"dragging");
 await t.pointer("pointermove",310,240);
 await t.pointer("pointerup",310,240);
 await act(async()=>{await pause(400);});
 assert.equal(votes,1);
 await t.cleanup();
});

 test("slow failed save restores an exited card and clears the full-screen tint", async () => {
  let fail!: () => void;
  const pending = new Promise<void>(resolve => { fail = resolve; });
  const t = await mount(async () => { await pending; return false; });
  await t.pointer("pointerdown", 100, 200);
  await t.pointer("pointermove", 240, 200);
  await t.pointer("pointerup", 240, 200);
  await act(async () => pause(450));
  assert.equal(t.card.dataset.swipePhase, "saving");
  assert.ok(Number(t.card.style.transform.match(/translateX\(([-\d.]+)px/)?.[1]) > 1000);
  await act(async () => { fail(); await pause(1000); });
  assert.equal(t.card.dataset.swipePhase, "idle");
  assert.equal(t.card.style.transform, "none");
  assert.equal(document.querySelector(".swipe-screen-feedback"), null);
  assert.match(t.card.textContent!, /wasn’t saved/);
  await t.cleanup();
});

test("avatar renders stored photos, falls back only on error, and retries a replacement", async () => {
  const { Avatar } = await import("../app/profile-photo");
  const host=win.document.createElement("div"), root=createRoot(host);
  await act(async()=>root.render(createElement(Avatar,{person:{name:"Alex",photo:"/assigned-fixture.jpg"}})));
  assert.equal(host.querySelector("img")?.getAttribute("src"),"/assigned-fixture.jpg");
  await act(async()=>host.querySelector("img")!.dispatchEvent(new win.Event("error")));
  assert.equal(host.textContent,"A");
  await act(async()=>root.render(createElement(Avatar,{person:{name:"Alex",photo:"/replacement.jpg"}})));
  assert.equal(host.querySelector("img")?.getAttribute("src"),"/replacement.jpg");
  await act(async()=>root.render(createElement(Avatar,{person:{name:"Jordan"}})));
  assert.equal(host.textContent,"J");
  await act(async()=>root.unmount());
});

test("Circle installs the shared wheel engine on the stationary deck and submits its real vote operation", async () => {
  const {GroupVoting}=await import('../app/group-voting');
  const host=win.document.createElement('div');win.document.body.append(host);
  const root=createRoot(host), operations: unknown[]=[];
  const circle={id:'circle',name:'Crew',city:'Austin',description:'',budget:20,invite:'',demo:true,members:[],plans:[],messages:[],constraints:[],ideas:[{id:'idea',title:'Chess',category:'Games',creator:'u',image:'/chess.webp'}],round:{id:'round',threshold:'everyone',complete:false,completed:0,total:3,ideaIds:['idea']}};
  await act(async()=>root.render(createElement(GroupVoting,{circle,busy:false,onChat:()=>{},act:async(body,_message,exit)=>{operations.push(body);await exit?.();return true;}})));
  const card=host.querySelector('article')!;
  Object.defineProperty(card,'clientWidth',{value:360});
  const deck=host.querySelector('.group-stack')!;
  await act(async()=>{
    deck.dispatchEvent(new win.WheelEvent('wheel',{deltaX:30,bubbles:true,cancelable:true}));
    deck.dispatchEvent(new win.WheelEvent('wheel',{deltaX:70,bubbles:true,cancelable:true}));
    assert.deepEqual(operations,[{type:'vote',circle:'circle',idea:'idea',vote:true}]);
    await pause(400);
    deck.dispatchEvent(new win.WheelEvent('wheel',{deltaX:90,bubbles:true,cancelable:true}));
  });
  assert.equal(operations.length,1);
  await act(async()=>root.unmount());host.remove();
});

test("StrictMode effect replay completes Undo entrance instead of stranding the card", async () => {
  const {StrictMode}=await import('react');
  const host=win.document.createElement('div');win.document.body.append(host);const root=createRoot(host);
  await act(async()=>root.render(createElement(StrictMode,null,createElement(SwipeSurface,{children:'Restored',label:'Restored',disabled:false,returnFrom:'yes',onSwipe:async()=>false}))));
  await act(async()=>pause(900));
  const transform=host.querySelector('article')!.style.transform;
  assert.ok(transform==='none' || Math.abs(Number(transform.match(/translateX\(([-\d.]+)px/)?.[1]))<1,transform);
  await act(async()=>root.unmount());host.remove();
});
