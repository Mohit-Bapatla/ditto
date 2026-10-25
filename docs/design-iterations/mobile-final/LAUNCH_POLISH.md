# Focused launch polish — October 25, 2026

## Changes

- Replaced white outlined swipe placards with large green DITTO/red PASS text directly on the card. Text scales progressively with drag distance. Kept the immediate exit, directional wash, brief screen pulse, reduced-motion behavior, transaction lock and failed-save restoration.
- Activity state now includes the creator's saved profile photo. Discover uses the shared Avatar component, including next-card previews. Mobile navigation now shows the active profile photo. Agenda participants and activity hosts use the same cropped avatars as Profile, Circles and chat.
- Removed main-screen sandbox banners, demo footnotes, demo Circle labels and the Circle perspective switcher. Identity switching remains in Settings. Kept factual venue-selection and provider limitations in contextual details/settings; representative activity photography is not asserted to be a verified venue photo.
- Plans shows upcoming entries when the selected day is empty. Rows include photo, date/time, neighborhood, concise context, Circle, member photos and real approval/RSVP counts. Expanded approved itineraries use Scheduled and Chicago time consistently. Main tab navigation resets scroll position.

## Seeded plans

Local presentation fixtures add Pickleball doubles, Bouldering session, Arcade night and Sunset hike to the existing chess/coffee proposal. Each gets a persisted future date on first seeding; subsequent reads and restarts do not move dates or duplicate plans. Pickleball has sample approvals/RSVPs for all three fixture members; the other added plans have one approval and remain proposed. Existing calendar authorization therefore enables export for the confirmed example only.

Seeding requires the existing explicit presentation-mode guard and dedicated local database. Normal users' plans, approvals and live deployments are unaffected. Tests assert the five-plan count, actual approval-derived status, idempotent IDs/dates, owner isolation and unchanged normal seed behavior.

## Rendered review and iteration

Used the existing Impeccable/UI/UX Pro Max workflow and incumbent visual direction. Reviewed mobile at 375/390/430 and desktop at 1440. No horizontal overflow at the checked compact/large phone widths. Initial agenda review found overly long copy beside small centered photos; final rows use larger top-aligned thumbnails, one-sentence descriptions and a compact Austin-time legend.

Private screenshots are in `test-results/launch-polish/` (gitignored because they include the supplied profile photos):

- `discover-desktop.png`, `discover-mobile.png`
- `ditto-drag.png`, `pass-drag.png`
- `plans-mobile.png`, `circles-mobile.png`, `profile-mobile.png`
- `iphone-discover.png`, `iphone-profile.png`, `iphone-circles.png`
- `iphone-plans.png`, `iphone-plans-scrolled.png`

Earlier before/after evidence remains in this directory's `before/` and `after/` folders. Personal pictures were not added to source control.

## Verification

- 47 unit/component tests pass, including pointer capture transfer, immediate movement during delayed saves, slow failure restoration, duplicate prevention, wheel handling, seeded commitments and photo isolation.
- Lint, typecheck and production build pass.
- Integration, multiplayer and profile-photo HTTP regression suites pass against an isolated production server with providers disabled.
- Restart test passes for original sessions, shared membership, saved votes and unanimous match.
- Actual iPhone 14 Pro Safari through Mirroring: right/left drags advanced; green/red feedback cleared; real photos appeared on Discover, Profile, Circles and Plans; agenda scrolling worked; switching from a scrolled agenda to Circles returned to the top after the final fix. Screenshots captured from the device, not emulation.
- Confirmed-plan Add to Calendar control was verified in the rendered app. ICS authorization/content are covered by integration tests; no test event was added to the user's personal calendar.

## Limits

The user's prior direct-finger test confirmed the touch-capture fix works. This final visual pass was exercised through Mirroring, not a new subjective finger-feel assessment. Android, physical trackpad momentum, landscape and phone-camera capture remain outside this pass. Live AI/place providers were paused, so this does not claim a new live-provider test. Dates are intentionally persistent and eventually become past dates; fixtures do not silently reschedule commitments. Temporary phone preview included only sample data and the three explicitly approved photos; no production deployment was performed.
