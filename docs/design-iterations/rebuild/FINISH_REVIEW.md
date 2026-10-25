# Bounded finish review

disposition: fix

Scope: `after/discover-375.png`, `discover-390.png`, `discover-1440.png`, `group-voting-390.png`, `consensus-390.png`, `onboarding-390.png`, `chat-390.png`, and `profile-390.png`; checked `layout-measurements.json`. This is a screenshot-based visual review, not a new behavioral/accessibility certification. No app edits or provider calls.

## Previous fixes

- Responsive card height: resolved in supplied captures. Photo dominance is restored, and the decision dock is visible on the supplied mobile and desktop views.
- Profile identity: resolved at requested visual scope. Location icon and Austin now share a baseline; metadata reads more coherently.
- Discovery right inset: unresolved. See P1 below.

## P0/P1 findings only

**P1 — Discovery card still loses its right gutter on narrow screens.** In both 375 and 390 captures the card starts with a 12px left inset but reaches the right image boundary. The right rounded edge is cut rather than separated from the viewport ground. The measurements report `viewport: 390, content: 375` (and `375, 360`), consistent with a 15px scrollbar difference, so `innerWidth` alone is not a width-fit proof. `overflow: false` cannot exclude descendant clipping when overflow is hidden/clip. Measure foreground card and preview-card rectangles against the layout viewport `document.documentElement.clientWidth`; size the card from its padded container, not viewport width. Acceptance: equal visible 12px left/right gutters and complete corner geometry in both mobile captures, with the Details control wholly inside the card.

**P1 — Supplied Chat evidence still has a composer floating across the conversation region and a very large empty vertical gap.** In `chat-390.png`, the composer interrupts the thread immediately under its descriptive copy, while the empty log continues far below the navigation before the sample disclosure. This conceals the relationship between conversation history, composing and planning. The parent reports a source fix (static composer and bounded empty log) already pending capture. That is the correct correction, but the supplied image cannot confirm it. Acceptance: recapture the current build showing a naturally ordered header → bounded empty/history region → composer → optional planning tools, without overlap or the former large empty gap. Do not add a second speculative CSS fix before inspecting the reported correction.

No P0 findings. No additional P1 visual findings in the supplied group-voting, consensus, or onboarding states. Group voting keeps the active card and voting dock clear; consensus makes the matched set and next planning action legible; onboarding retains readable fields and a clear action.

## Finish boundary

The bounded finish remains **fix** until mobile inset and current Chat render are confirmed. Technical filter-name/modal-class changes are reported pending build and are outside this visual sign-off. Native phone Safari/Chrome, long-content/error states and backend/multiplayer behavior are not certified by these images. Do not infer whole-product approval from this bounded pass.

## Final addendum — refreshed evidence

**Current bounded disposition: ship — the two findings above are closed.** This supersedes the original bounded disposition while retaining its history.

1. **Discovery right gutter: not reproduced; prior visual finding withdrawn.** `after/card-bounds.json` measures the active card against the actual layout viewport. At inner width 390, client width is 375 and the active card runs from x=12 to x=363: exactly 12px on each side. Equivalent measurements at 320, 360, 375 and 430 also show equal 12px gutters; desktop is centered. The refreshed screenshot still has a right-edge appearance that cannot outweigh these exact element bounds. The small preview-card peek is intentional. No further layout fix is justified by this finding.
2. **Chat ordering and empty-space defect: resolved.** Updated `after/chat-390.png` shows the conversation heading, private-thread controls, a compact empty-state message, then the composer in document flow, followed by the sample disclosure and planning tools. The former large blank history gap and floating composer placement are gone. The fixed navigation intersects a portion of the full-page capture at its viewport position; this is not evidence that the composer remains sticky. No new P0/P1 finding follows from this refreshed image.

No P0/P1 remains in this bounded two-finding verdict. This is not whole-product certification. The parent separately reports a long-title metadata clipping test and a pending typography/caption fix; that new edge case requires its own final capture and is explicitly outside this close-out. Do not announce all visual edge cases approved until that evidence is checked. Technical modal/filter validation, native-device verification, and backend/multiplayer testing remain owned by their respective checks.
