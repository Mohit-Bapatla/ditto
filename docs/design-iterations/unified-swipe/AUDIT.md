# Swipe audit — 2026-10-25 (before edits)

Discover and Circle already share `app/swipe-surface.tsx`: Motion x/rotation/opacity, axis-lock pointer tracking, pointer capture, spring snapback, buttons and keyboard all flow through the same commit lock. Backend operations remain separate: discovery uses nonce-protected swipe, Circle uses private round vote; both publish fetched server state after the animation callback. Undo is persistent server state.

## Concrete causes

- Circle omits `wheelGate`. SwipeSurface only installs its wheel listener when this prop exists. Consequently Circle has no two-finger trackpad handling at all.
- Discover's WheelGesture calls finish only at 180ms of event silence or a 1600ms gesture limit. Crossing the accepted distance does not release the card. Slow momentum extends that idle timer, creating the visible mid-exit hold. Network is already concurrent with exit, so awaiting the save is not the initial hold's cause.
- The wheel listener is attached to the moving card: as it moves away from a stationary cursor, subsequent events can leave its hit area. A stable deck interaction boundary is required.
- Circle shares the fixed implicit-touch-capture handling, so there is no separate obsolete touch engine. It is missing device-level regression coverage. Its large stacked heading/banner/card layout pushes voting controls below the initial viewport, particularly on phones; this makes its interaction less discoverable. Do not claim a new iPhone root cause without observing one.
- Snapback/exit use x animations, but interruption must stop an existing controller before taking ownership. Wheel discard must establish a gate even when a mouse/button initiates commitment.

## Direction and motion thesis

Preserve Ditto's current photo-led identity and official logo. Keep the card the focal point: immediate tracking → accepted release → off-screen exit; rejected motion springs home. Use the same required per-deck gesture gate and stable interaction boundary in both screens. Commit wheel distance during input, retain conservative minimum travel for flicks, suppress residual momentum across card replacement, preserve vertical scrolling. Start exit and save concurrently; publish next state only after both succeed, restore on failure. Development-only timing samples measure movement from acceptance.

Circle uses a compact centered card with adjacent participant/aggregate-progress context on desktop; mobile keeps context compact and actions in flow above bottom navigation. Never reveal individual votes. Maximum three metadata items; only existing facts, with estimates explicitly labeled and secondary detail disclosure.

Verification must distinguish synthetic wheel/pointer tests, browser renders and actual device gestures. Showcase database must not be reset or mutated for test votes; use an isolated QA database.

## Additional observed Circle defect

A real browser mouse drag at 390px expanded the Circle page's visual viewport to the translated card's bounds, moving the bottom navigation and changing the screenshot width. Discover already clips horizontal overflow; the Circle shell did not. Apply horizontal clipping at the shared application shell, preserving vertical scrolling. This is verified browser evidence for the Circle inconsistency, distinct from unverified physical-touch hypotheses.
