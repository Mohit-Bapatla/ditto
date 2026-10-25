# Density overhaul — verification

Date: 2026-10-25. Local production build; no deployment. Impeccable dual-review workflow used independent design and technical reviewers, followed by bounded fixes. Questions skipped: implementation and iteration were already authorized.

## Automated results

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm run build` — pass, Next 16.4.3 standalone production output.
- `npm test` — **36/36 pass**. Includes physical pointer following, progressive feedback, distance and flick thresholds, vertical intent, cancellation/blur, keyboard controls, duplicate prevention, acknowledgement-before-exit, failure/retry, focus handoff and broken-image fallback.
- `TEST_BASE_URL=http://localhost:3109 TEST_SESSION_SNAPSHOT=test-results/density-restart-private.json npm run test:integration` — pass. Sessions, owner permissions, interest/attendance, private voting, duplicate rejection, match reveal, approval, RSVP, calendar authorization, profile edits, joining, secure-cookie configuration/CSRF/no-store/sensitive URL checks.
- `TEST_BASE_URL=http://localhost:3109 npm run test:multiuser` — pass. Four independent personal users plus an outsider, creation/invites, ordered private chat, exact vote results, constraints, fixture extraction, unanimous match, planning revisions/reapproval, RSVP/calendar, activity creation/ownership, concurrent capacity.
- After stopping/restarting the regression server against the same SQLite file, `TEST_SESSION_SNAPSHOT=test-results/density-restart-private.json npm run test:persistence` — pass. Original sessions, shared membership, votes and match survived. Private cookie snapshots remain ignored under test-results and are not committed.
- New fixture tests confirm 3 profiles / 4 Circles / 36 activities, deterministic content order, distinct owner IDs, cross-owner access denial, private individual votes, zero seeded attendance/approval/RSVP, and unchanged default starter when opt-in is absent.

## Rendered browser verification

Actual in-app Chromium browser, six emulated viewport widths: **375, 390, 430, 768, 1024, 1440**, all at 900px height. `before/` and `after/` each contain all four primary destinations. `after/measurements.json` records window/client/scroll dimensions and broken images. All 24 final views have no measured horizontal root overflow and no broken visible images. Client width reserves a 15px scrollbar; do not confuse this with the requested window width.

Performed real CDP mouse press/move/release input into the rendered SwipeSurface, not button-only simulation:
- 390px: held right/left progressive stamps, below-threshold snapback without advance, committed right interested vote, next card, committed left pass, and Undo restoring that card.
- 375/430/1440: held right and left feedback with incomplete-release recovery. Existing automated interaction tests cover keyboard/touch pointerType and duplicate prevention.
- At 1440px, stopped the local server, physically swiped, verified `idle` phase with the same Bouldering card and explicit “Your vote wasn’t saved” alert. Restarted SQLite-backed server and repeated the drag successfully. Reload retained the changed deck and saved interest. This also exercises presentation-session restart continuity.
- Final-build browser keyboard check: ArrowLeft advanced Pickleball to Bouldering and Undo restored Pickleball.
- Settings identity switching remained usable. Through browser controls, approved the sample proposal as Mohit, Edwin and Paxton, observed it move to Upcoming, then RSVP’d as Paxton and observed one RSVP. These were explicit QA actions, never seeded or fabricated commitments. The clean final presentation screenshots use a separate untouched owner namespace.
- Conversation preview now opens the correct Circle's Chat & AI tab. Pending plan summaries expand to the real approval/editor controls. Calendar response/content and permission checks are covered by integration; no calendar invitation was sent.

Gesture images include idle, partial/commit-held green DITTO and red PASS, release-saving state, next card, snapback and network failure. Release snapshots caught the acknowledgement/saving phase, not a guaranteed animation midpoint; do not describe them as frame-perfect exit recordings. The unchanged exit transaction is covered by the interaction suite and visually observed next-card transitions.

## Visual iteration

1. Baseline: desktop centered card stranded in empty space; Circle collection absent; oversized join/empty planning blocks; technical Profile.
2. Initial implementation: useful desktop rails, four photographic Circles and distinct planning sections. First screenshots revealed unsuitable stock-photo associations and an oversized inline proposal editor. Replaced asset mismatches, used expandable proposals, moved sample disclosure above the content, and shortened the right rail.
3. Independent final review: fixed mobile hint collision by reserving 40px in invitation sizing; moved pending decisions before saved interests in DOM order; compacted mobile identity and replaced repeated profile facts with functional interest exploration. Rail category targets increased to 44px. Conversation shortcut preserves Chat & AI context. Final phone hint bottom is 811px versus navigation top 830px at all three requested phone widths.

## Boundaries and remaining limitations

- No physical iPhone Safari or Android Chrome hardware was available. Chromium viewport checks and synthetic pointer tests do not certify native touch/trackpad hardware, mobile address-bar behavior or safe-area cutouts.
- No full screen-reader session, 200% text scaling or native reduced-motion UI audit was performed in this pass. Existing reduced-motion behavior and pointer-cancellation code remain unchanged.
- Live Muse Spark, SerpApi discovery and routing calls were deliberately disabled; provider contracts/error paths and fixture workflows were tested without paid calls. This pass does not claim a fresh live-provider smoke test.
- Figma Starter tool quota was previously exhausted; existing design explorations are linked in README. No new Figma output or quota upgrade is claimed.
- Some activities share representative category photography. Photos are not verified local venue depictions. The source/license manifest is under public/activities.
- Fixed bottom navigation appears across the middle of tall full-page captures because it remains fixed at the viewport position during capture. This is not proof that content stays hidden while scrolling; layout reserves bottom padding. The mobile Discover hint was separately measured against navigation.

The preview server is a local deliverable at port3108; the dedicated regression server was stopped. No production services, data or repository visibility were changed.

Implementation commit: `ae26afa`. Final production preview process: port 3108, local-only binding; stop with Ctrl-C in its terminal. The compact upcoming summary was verified after the final build and expands to the existing RSVP and calendar controls. Its cover now prefers the matching itinerary idea over an unrelated first Circle idea.
