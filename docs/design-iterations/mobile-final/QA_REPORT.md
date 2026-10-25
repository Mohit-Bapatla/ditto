# Mobile finish and device QA — 2026-10-25

## Implemented

- Discover accepts horizontal wheel/trackpad deltas with progressive card movement, distance/velocity acceptance, spring return, and a shared momentum gate across cards. Existing backend transactions still gate advancement.
- Plans has a Chicago-time seven-day agenda. Solid markers mean approved group plans or actual RSVP; hollow markers mean proposals or interest. The complete saved collection remains available in a collapsed disclosure.
- Profile pictures support upload or camera input, circular preview, zoom, horizontal/vertical framing, removal, and server-side image validation/resizing/metadata stripping. Updating a picture preserves existing identity and memberships.
- User-supplied photos were saved to the three requested local profiles. They and their screenshots are excluded from this public evidence directory.

## Validation

- `npm test`: 47 passing, including actual mounted pointer handlers, thresholds, failed saves, duplicate prevention, keyboard, wheel momentum and cancellation, and touch capture transfer.
- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- Isolated local integration, multiuser and restart-persistence suites passed during this implementation. Profile photo HTTP tests passed for save/read/remove, stable demo identity, invalid image rejection, separate-session privacy and shared Circle visibility.
- Before/after captures cover Discover, Circles, Plans and Profile at 375, 390, 430, 768, 1024 and 1440 widths. See `before/`, `after/` and `layout-metrics.json`. No horizontal page overflow was observed. Full-page captures can show fixed navigation in the middle of a long image; this is a capture artifact.
- Native macOS Safari: mouse drag right, keyboard left, weekly agenda navigation verified. Corrected the local standalone asset preparation that had caused JavaScript 404s. `scripts/prepare-standalone.mjs` copies static and public assets after each build.
- Actual iPhone 14 Pro Safari through iPhone Mirroring: loaded the approved temporary HTTPS test preview; Details scrolling, RSVP and its agenda marker, personal profile creation, Circle creation and independent desktop joining were exercised.

## Physical swipe defect discovered and repaired

The user confirmed that finger dragging stuck on the iPhone. A touch starts with implicit pointer capture on a child, commonly the photo. Moving horizontally transfers capture to the card. The child's bubbling `lostpointercapture` event had canceled the card's gesture. The handler now cancels only loss belonging to the active card itself. A mounted regression reproduces the child event during an active drag and verifies one successful vote.

After the fix, actual iPhone Mirroring right drag showed green feedback and advanced from the outdoors card to tennis with a saved-interest confirmation. Left drag then advanced from tennis to food. The user subsequently confirmed direct finger swiping works, but reported a pause on release. This was traced to waiting for the server before starting the exit animation.

## Evidence limits / remaining device checks

- Physical MacBook trackpad momentum, Android Chrome, phone camera capture and landscape device layouts are not independently verified.
- Phone-to-desktop consensus completion and both-party approval are still pending; automated multiuser coverage is separate evidence.
- Live providers were disabled for isolated device testing. This round does not claim a live Muse Spark/places verification.
- The temporary HTTPS preview uses a separate sample database and none of the uploaded profile photos. It is not a production deployment.

## Visual review

Independent design and technical reviews are saved alongside this report. Their actionable findings were addressed: collapsed duplicate agenda sections, precise RSVP markers, horizontal photo cropping, reset wheel velocity, cancel disabled wheel drags, and retain the next legitimate Details click. Rendered captures informed the typography and agenda-density refinements.

## Swipe smoothness and stronger feedback follow-up

- Exit motion now starts immediately at release, concurrently with saving. The parent still publishes the next card only after both save and exit complete, with duplicate input locked. A slow rejected save returns the same card and clears the screen tint; an added mounted regression verifies this recovery.
- Faster decelerating 300ms exit replaces the paused spring-then-accelerate sequence. DITTO/PASS reaches full opacity after 65px instead of 110px, with larger 48–68px stamps and stronger directional color.
- A body portal applies a progressive full-screen green/red wash and a single 450ms release pulse. It does not intercept input. Reduced motion omits the screen effect and uses the existing short card fade.
- Actual rendered mobile drag captures: `after/smooth-ditto-390.png`, `after/smooth-pass-390.png`. Review: stamps remain readable over imagery and are visible before the acceptance threshold; page content remains visible through the tint. Actual iPhone Mirroring right and left release both advanced successfully; the tint cleared, saved-interest confirmation appeared, and the last card reached the proper empty state. The deck was reopened for user retesting.
- All 47 tests, lint, typecheck and production build passed after the follow-up. The previous direct-finger confirmation applies to the capture fix; the new feel has been exercised through Mirroring, not yet independently rated by the user.
