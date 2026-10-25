# Discover → Plan with a Circle

Date: 2026-10-25. No Railway deployment or production data edits.

## Design and implementation

Operate-mode extension of existing Ditto identity. Details previously buried a venue-only selector below long metadata; ordinary/custom/saved activities had no equivalent. Replaced it with a visible Plan with a Circle action and an iPhone bottom sheet / centered desktop dialog. Actual Circle rows include member photos and count, native radio selection, optional local date/time and proposer-authored note. Success offers View in Circle. No-Circles creation returns to the original activity with the new Circle selected.

Used installed Impeccable and UI/UX Pro Max guidance: native controls, 44px+ touch targets, dialog focus containment, safe areas, recoverable submission, progressive disclosure within existing styling. Existing reference captures reviewed: Luma event-mobile (activity identity, metadata and decisive action) and Airbnb guests capture (actually a discovery listing, not a guest selector; not treated as proof of a picker). Retained Ditto's own established Circle rows and photo avatars. Desktop baseline and final screenshots, actual iPhone picker/success screenshots are in this directory. Visual iteration fixed optional-label spacing. Desktop screenshot output is clipped by the app panel; browser DOM viewport was 1280×720. Actual iPhone screenshots are complete.

Backend reuses Circle Ideas, access checks, rounds, votes and approvals. An atomic action copies the accessible activity into Circle visibility, preserves venue metadata/image/source/Maps URL, and creates one linked idea. Repeated requests return the existing idea. The original activity and saved/swiped state are untouched. Suggested time is stored as suggestedStart; the shared activity has no confirmed start. Optional note is attributed to the proposer in chat and on the idea. Existing active rounds retain their participant/idea snapshots; new suggestions become available for the next round. No automatic votes, approvals or RSVPs.

## Verification

- Full unit/component suite: 83 passed. After final label-only refinement: targeted component/backend tests passed again.
- Typecheck and production build passed. Lint: zero errors, three pre-existing unused-variable warnings in the video capture script.
- Integration and multiplayer suites passed: permissions, independent sessions, private votes, reveal/consensus, approvals, RSVPs, chat, calendar authorization, Undo and activity controls.
- Restart persistence passed using a disposable database and private session snapshot: sessions, membership, saved votes and agreement survived restart.
- `scripts/circle-activity-test.mjs`: fixture run and actual live Muse Spark + SerpApi run passed. A real discovered venue was stored, suggested once to a Circle, independently voted on by three clients, matched, planned, approved by all, RSVP'd and exported as ICS. Venue identity remained attached to the plan. Unauthorized access was rejected. Live provider results were not mocked; planning used the explicitly labeled group-template path.
- Desktop browser: actual venue Details → Weekend Crew → proposer note → confirmation → correct idea once in Circle; metadata and note visible. Separate custom saved activity: no-Circles state → create Circle → original activity restored with Circle selected → optional date/time and note → keyboard Tab/Return submission succeeded. Missing venue and no-time cases passed.
- Actual iPhone Safari via Mirroring: existing Discover activity → Details → Circle selection with all three original photos → Weekend Crew → no date/time → successful suggestion → View in Circle. Existing swipe card remained unchanged when returning to Discover. Mobile form scrolling and safe-area layout inspected.
- Failure and duplicate cases: component test holds pending submission while rapid duplicate submit fires; only one request occurs. Failed response retains form and allows retry; backend retry returns same idea/message. These are deterministic failure tests, not a physical network outage on the phone.

Temporary authorized phone preview: https://served-carmen-photos-football.trycloudflare.com/demo
Desktop live development preview: http://venues.localhost:3133/
Disposable tests: /tmp/ditto-venue-regression-circle.sqlite and /tmp/ditto-circle-empty.sqlite. Permanent showcase and Railway were not reset or migrated.
