# Independent technical review — wheel, agenda and profile photo

**Current status after follow-up:** all three original wheel findings are resolved in source; focused helper regressions pass 6/6. The original findings below remain as review history. See the resolution addendum for current photo behavior and remaining verification limits.

2026-10-25. Read-only review of `app/swipe-surface.tsx`, `lib/wheel-gesture.ts`, `lib/profile-photo.ts`, `app/profile-photo.tsx`, `app/api/action/route.ts`, `lib/agenda.ts`, `app/week-agenda.tsx`, their page wiring and new tests. No source edits or browser actions. Findings describe the source at review time; parent may fix concurrently.

## Outcome

Three actionable wheel issues: **one P1 and two P2**. No photo authorization/metadata leak found in the reviewed flow. Agenda day arithmetic is explicitly Chicago-based and passes the supplied DST/year/leap-day checks. Cross-card momentum protection exists and passes its pure-controller test, but real trackpad routing remains separate browser/device verification.

## P1 — Flick velocity leaks into a later wheel gesture

**Location:** `lib/wheel-gesture.ts:46–53`.

A new gesture resets distance, began and last, but never resets velocity. Inputs below 3px do not refresh velocity. Therefore a previous quick incomplete gesture can make a later slow 32px gesture commit even though it is below the 86.4px distance threshold for a 360px card and has no qualifying release speed.

Executed reproduction against the actual class using tsx:

```ts
const votes = [];
const c = new WheelGesture(
  { lastEvent: -Infinity, quietUntil: 0 },
  () => 360, () => {}, v => votes.push(v)
);
c.input(20, 0, 0, 1000, true);
c.end(1180); // snap back, retains velocity 1.25
for (let i = 0; i < 16; i++) c.input(2, 0, 0, 1700 + i * 20, true);
c.end(2180);
// Actual result: [undefined, true]
```

**Impact:** Unintended interest/Pass can be saved after a small, slow movement on the same card, including after failed-save recovery.

**Fix:** Reset velocity when beginning every new burst; define how tiny-tail events update/decay the estimate without carrying it across bursts. Add this regression and the mirrored negative-direction case. Suggested command: `$impeccable harden`.

## P2 — Readiness turning false mid-wheel can strand the translated card

**Location:** `lib/wheel-gesture.ts:34–36`, `app/swipe-surface.tsx:144` and wheel effect finish callback.

The not-ready branch sets the quiet gate but leaves an existing gesture active. A later end still returns a vote. The component's commit function immediately returns when disabled, without snapback or phase cleanup.

Executed class reproduction: `input(100,0,0,1000,true); input(10,0,0,1010,false); end(1190)` calls finish with **true**. Combined with the component's disabled early return, x/phase stay in the dragged state until another interaction changes them. If disabled flips without any extra wheel event, the timer has the same early-return problem.

**Impact:** An overlapping action that makes the deck busy during wheel input can leave a card offset with feedback visible, even though no vote saved.

**Fix:** Cancel active wheel input on disabled transition and snap it back when no save/exit already owns the animation. End callback must recheck readiness and recover, not simply discard a qualifying result. Do not unlock an actual in-flight transaction while implementing cancellation. Add a mounted-component regression that toggles disabled during the burst and asserts idle/centered/no vote. Suggested command: `$impeccable harden`.

## P2 — Wheel snapback consumes the next legitimate Details click

**Location:** `app/swipe-surface.tsx:210`, `:283–292`, `:348–352`.

Wheel move sets `suppressClick.current=true`. Unlike pointer drag, a wheel sequence does not generate the synthetic click this flag was intended to consume. After snapback or failed-save recovery, the flag remains true. Clicking the nested Details button does not clear it in pointerdown because the nested-control guard returns first; capture then prevents that first real click and resets the flag.

**Impact:** The first Details click after an incomplete wheel gesture silently does nothing. This follows directly from the event handlers; it was not browser-exercised in this read-only review.

**Fix:** Keep synthetic click suppression specific to pointer drags, or explicitly clear the wheel-only flag when its gesture ends/cancels. Add an actual component test: incomplete wheel → centered card → Details click → handler called once. Suggested command: `$impeccable harden`.

## Momentum, cancellation and input boundaries

Positive evidence:

- The gate is held at deck level in `app/page.tsx`, then passed into keyed cards. It is not recreated with each card. Continuous qualifying wheel events during cooldown extend the quiet deadline. This prevents the tested tail burst from voting on the next controller.
- Saved votes still use one synchronous ref lock, wait for backend acceptance before flyout, and publish new state after exit. Pointer and wheel are prevented from starting concurrently; direct button/keyboard commit discards active wheel accumulation.
- Wheel listener is non-passive and prevents only handled horizontal intent. Vertical intent cancels active wheel and passes through. Ctrl/meta input passes through. Blur and document-hidden cancel active wheel; cleanup removes listeners and the timer.
- Rejected saves restore opacity and snap back. The P1 velocity leak remains relevant to retries on that same controller until fixed.

Limits to the guarantee:

- The cooldown uses **delivered qualifying events**, not physical device momentum identity. Existing pure tests supply events directly to each controller. They do not demonstrate actual browser event targeting during a moving/unmounted card, pointer position over nested buttons, or hardware momentum after the card changes. Do not equate the test with a universal cross-card trackpad guarantee.
- `app/group-voting.tsx` currently does not pass a wheelGate. Wheel listener installation is conditional on that prop, so group voting retains pointer/keyboard/buttons but does not acquire the new wheel gesture. Confirm the intended feature scope before claiming wheel support across both decks.
- Switching to ctrl/meta mid-burst currently ignores the new events but leaves the old idle timer eligible to commit. Consider cancelling the existing burst when the user changes to a browser zoom/navigation modifier; this is a follow-up behavior decision, not counted among the three verified issues.

## Profile photo validation, privacy and persistence

- Server route enforces same-origin, authenticated session and rate limit before processing the profile photo. It accepts no target-user ID; update writes the authenticated profile. Existing demo-to-personal-profile cloning remains, so sample profiles are not overwritten.
- Zod caps the supplied string at 180,000 characters. The normalizer accepts only raster data URLs, rejects SVG and arbitrary URLs, decodes with Sharp under a 4-million-pixel cap, checks actual format, normalizes orientation, crops to 256×256 and re-encodes JPEG. Default re-encoding strips EXIF; the new test verifies EXIF absent.
- Removing a photo sends the empty hidden field; normalization returns empty and route persists null. Omitting photo preserves the old value. The encoded result persists in SQLite profile JSON, not an external public file URL.
- Client resize/crop occurs locally through an object URL and canvas. URLs are revoked in finally. Sequence guards prevent a completed earlier selection from overwriting a newer removal/unmount. The parent passes stable setPhotoBusy; submit control is disabled during preparation.
- Existing state projection shares member profile objects only through authorized Circles and owner-scoped demoUsers. Public activity projection continues exposing host name rather than copying whole private profile objects. No new public-photo endpoint or cross-owner photo read was found.

Remaining evidence gaps: no HTTP profile-photo persistence/restart/removal test was present in the inspected scripts; helper tests do not prove route persistence. Add an integration assertion saving a tiny sanitized image, rereading state as the same user and an authorized Circle member, then removing it. Also assert an unrelated session cannot discover that profile photo. Camera permission/device behavior, HEIC compatibility, client decode memory for large compressed images, and photo-select/remove UI races are not covered by the five helper tests. The file picker accepts image/* while supported formats depend on the browser; unsupported images get an explanatory error.

## Agenda timezone and status correctness

- `dayKey` and `agendaTime` consistently use `America/Chicago`. Day shifts and week boundaries use UTC-noon date keys, avoiding midnight DST arithmetic errors. Monday-first weeks, year rollover and leap day are tested.
- The calendar visibly names its timezone. The expanded existing plan card uses browser-local fmt and separately prints that browser timezone. These are labeled conversions of the same instant, not a proven date-calculation defect. For users outside Chicago, the expanded card can show a different day than the agenda header; consider a single chosen zone for the whole agenda to reduce confusion.
- The app supports other city values, but the agenda zone is fixed rather than derived from city or profile preference. Describe this as an Austin/Chicago calendar limitation, not automatic local-time support.
- Confirmed plan markers depend on real derived status; personal activity rows explicitly distinguish RSVP, interest and cancellation. Fixture activity timing is labeled illustrative.
- Plans and activities are sorted independently and rendered as two groups, not merged into one chronological day list. If the intended contract is strict chronological order, merge by start instant before rendering.
- LocaleCompare on ISO strings assumes consistent normalization to UTC. Existing route-created dates are normalized; if future imports preserve differing UTC offsets, sort by numeric timestamp instead.

## Checks performed and coverage

Ran `node_modules/.bin/tsx --test tests/mobile-finish.test.ts`: **5 passed, 0 failed**. Also executed the two independent wheel reproductions above. Inspected the new mounted wheel test in `tests/swipe-interaction.test.ts`; it proves progressive transform, vertical passthrough, and single submission on one saved/locked card. It does not mount a fresh second card with real browser momentum, toggle disabled mid-burst, or test a Details click after wheel snapback.

Recommended focused regressions: reset velocity between bursts; disabled transition during movement; retry after network error; wheel→Details click; blur/hidden cancellation with no later commit; actual keyed-card replacement sharing one gate. Keep native device limitations explicit and perform the parent browser wheel test after these corrections. No source edits were made by this reviewer.


## Resolution addendum — follow-up review

Re-read current wheel controller, component callbacks, photo action, crop controls and new tests after the parent applied fixes. No app edits made.

### Resolved wheel findings

| Original issue | Current evidence | Status |
|---|---|---|
| Stale burst velocity (P1) | New-burst block now sets `this.velocity = 0`; added regression follows a quick first burst with sixteen slow 2px events and expects no second vote | Resolved |
| Disabled mid-wheel (P2) | Not-ready input now calls `cancel(now)`; component finish callback snaps for undefined vote **or current disabled state**, covering disabled changes without another wheel event before timer end | Resolved in source; controller regression passes |
| Details click suppressed after wheel (P2) | Wheel move no longer sets suppressClick; the flag remains only in pointer-drag handling | Resolved in source |

Ran `node_modules/.bin/tsx --test tests/mobile-finish.test.ts` again: **6 passed, 0 failed**, including the new velocity/reset and mid-drag-disabled regression. No active P1/P2 remains from this review's three original findings. The mounted-component disabled-toggle and wheel→Details-click regressions are still useful coverage improvements; source resolution is not a claim that those browser interactions were exercised here.

### Separate profilePhoto action

The new schema branch requires a nullable, capped photo string. It uses the same same-origin/authentication/rate-limit and normalizeProfilePhoto path before the transaction. Its handler reads `person(s.user)` and updates only that ID; the request cannot specify another target profile. The new picture-only form posts `profilePhoto` and disables Save while processing.

This intentionally changes the earlier demo behavior: updating only the picture now **preserves the existing sandbox identity, ID, demo flag, memberships and votes**, rather than converting it into a new personal profile. Normal full profile editing still uses the original demo-to-personal clone. Since sandbox switching is owner-scoped and photo writes remain session-scoped, this does not create a cross-owner profile overwrite path in the reviewed code. The earlier paragraph saying sample profiles are never overwritten applies to full `profile` action only and is superseded for this explicit picture-only action.

No new metadata leak was found: raster decode/re-encode still strips EXIF and stores sanitized JPEG inline in profile JSON. HTTP/integration tests inspected still do not explicitly exercise picture-only save, state reread, removal and unchanged demo memberships. Parent reports full regressions passed; this review does not substitute that for photo-specific assertions.

### Crop controls

The upload now retains a decoded source image, exposes Zoom (1–2.5) and Vertical position (0–100), and re-renders the hidden submitted JPEG from those values. For valid slider values the crop rectangle stays within source bounds: square side is min(width,height)/zoom; x is centered; y interpolates through the available vertical travel. Controls have explicit labels and are native keyboard-operable ranges. Sequence guards still protect asynchronous selection/removal, and removal clears the source/crop controls so a late decode cannot restore the removed image.

Current intentional limitations: horizontal positioning is fixed to center, so landscape portraits near either edge cannot be repositioned horizontally. Crop controls appear only for a newly selected decoded source; reopening an already saved photo does not offer a new crop unless it is selected again. These are scope limitations, not confirmed validation/privacy defects. Original full-resolution image bytes are not submitted; only the rendered 256px crop is posted and sanitized again server-side. Real camera/HEIC behavior and visual crop positioning still require browser/device verification.

### Remaining unresolved verification and scope notes

- Physical trackpad momentum, event targeting over moving cards, and native phone camera/touch behavior remain unverified by this reviewer.
- Group voting still needs a wheelGate if wheel support is intended there; the existing listener is opt-in per SwipeSurface. Discovery wiring is present.
- Modifier-key change during an already active wheel burst remains a behavior decision: ctrl/meta events pass through but do not cancel the prior timer.
- Agenda remains explicitly Chicago-based, with expanded existing plans showing labeled browser-local time. No new timezone arithmetic defect found; remote-user presentation and chronological merging limitations from the original review remain.
- Photo-specific HTTP persistence/removal/authorization assertions and crop UI tests remain coverage gaps, not evidence of a current data leak.

Parent reports 43 tests, lint/build, integration and multiuser checks passed. This follow-up independently reran only the six focused helper tests above. No source changes or commit were made by the reviewer.
