# Discovery recovery — 2026-10-25

Scope: persisted Undo, exhausted Discover, custom activities through Circle consensus, and consistent stored profile photos. Preserve the incumbent brand, physical swipe mechanics, SQLite storage, and five-second polling. Production is unchanged; this branch needs deployment approval.

## Audit and direction

Reviewed the Impeccable hardening/craft-floor guidance and UI/UX Pro Max empty-state/recovery guidance. Kept Ditto’s established type, pink/red controls, smiling-card mark, photographic cards and compact navigation. Existing reference library: `docs/ditto-design-references/assets/reference-captures/tinder/official-gallery.png`, `partiful/event-mobile.png`, and `airbnb/discover-mobile.png`. These support clear directional decisions, readable event information, and one useful next step; no new reference imagery or proprietary assets were added.

Before captures: `test-results/discovery-recovery/before-empty-390.png` and `before-empty-1440.png` (existing production, QA account). The first viewport must answer what to do after the last card and retain the ability to correct a decision.

| Surface | Before | Implemented |
|---|---|---|
| Discover controls | Local, pass-only rewind; positive swipes cleared its state | Explicit Undo, server-issued operation identity, bounded persisted history, optimistic return and failure reconciliation |
| Exhausted deck | Refresh could delete decisions | Create activity, actual provider search with seen-ID exclusion, review interest, filter recovery; no vote reset |
| Activity form | Required venue/date/budget and no Circle route | Required title/description; optional venue/schedule/budget/image; private save or existing Circle idea/voting flow |
| Plans | Undated ideas had no valid calendar day | Separate Date to decide list; no invented schedule or premature attendance |
| Avatars | Most surfaces already read photos; broken images lacked fallback; some author contexts omitted the reusable avatar | Shared Avatar across author contexts; failed source falls back, changed source retries; chat includes photo field |

Visual iteration: the first completion render inherited six-pixel button margins and excessive vertical spacing, plus disabled vote buttons. Removed inherited margins, reduced spacing, and retained only Undo below completion. Phone Safari’s shorter content area prompted a further compact-spacing adjustment. Form labels remain explicit, images retain fixed bounds, and controls keep comfortable touch targets. No gesture physics were replaced.

## Persistence and safety

`decision_history` is an additive table; no original records are removed. It retains 40 operations per identity, previous swipe/participation values, and handled-undo markers. Requests use one SQLite transaction. A replay of a handled operation cannot reverse a subsequent card. Attendance changes and expired/cancelled activities prevent stale undo. Circle undo recomputes completion/matches and refuses rounds already used by a plan (including conservative handling of older plans lacking a round ID). Planning rechecks the round and exact vote snapshot after asynchronous provider work.

Custom activities use existing activity storage and submission nonce protection. Circle membership is checked; private activities are visible only to their creator, shared ones to members. Optional uploads are decoded/re-encoded, resized, stripped of EXIF, and stored in SQLite. Custom imagery is labeled appropriately; missing dates and budgets remain explicitly undecided. A date must be chosen before attendance. Custom Circle ideas flow into existing plans, approvals, RSVP and ICS export.

## Profile photo root cause

Photos are normalized JPEG data URLs in `profiles.data.photo`, not files on an ephemeral uploads directory. The state endpoint exposes `user.photo`, member photos and `hostPhoto`; most existing avatar components were already correctly wired. The local Mohit/Paxton/Edwin fixtures were not transferred to production, and identities with no stored photo correctly display initials. A production QA identity with an intentionally assigned public-logo test image still returns its photo after the previous Railway restart/deployment. Other QA identities in that Circle genuinely have no assigned photo. This change does not invent portraits or publish private uploads.

Railway’s established Docker configuration uses `/data/ditto.sqlite`, a persistent `/data` volume, one replica, and secure cookies. Local restart acceptance confirmed exact photo bytes, original session, custom activity, plan and undo history survive a process restart. The live site was checked read-only; production data was not reset or migrated.

## Verification

All checks passed on the final implementation:

- `npm run lint`, `npm run typecheck`, `npm run build`.
- `npm test`: 55 passing, zero failures. Includes physical pointer thresholds, velocity, wheel, keyboard, pending-save locking, failed-save recovery, persisted Undo and avatar fallback/replacement.
- `npm run test:integration` and `npm run test:multiuser`: authentication, independent sessions, voting, plans, approvals, RSVP, ICS and security regressions.
- `node scripts/discovery-recovery-test.mjs`: private/custom image creation, Circle sharing, validation, permissions, nonce replay, both Undo directions, concurrent retry, finalized-round protection, plan approval, RSVP, calendar and distinct stored photos.
- `TEST_SESSION_SNAPSHOT=/tmp/ditto-recovery-restart.json npm run test:persistence`: original sessions, shared membership, votes and unanimous match survived the final server restart. Separate snapshot comparison also verified exact photo data, custom activity, plan and undo history.
- Read-only production smoke: homepage, health, favicon, Apple icon and manifest returned 200; the production QA profile still exposes its stored test image. Production code and data were not modified.

Browser verification used actual pointer dragging at 390px and 1440px, Undo and reswipe, keyboard controls, offline Undo rollback, refresh, and layouts at 375/390/430/1440px. No horizontal document overflow was observed. Real provider search returned six unique places; repeating with all results excluded returned no new places with useful recovery actions. Paused-provider error and loading states were also exercised. No votes were reset.

Actual iPhone Safari was tested through iPhone Mirroring against an approved temporary HTTPS preview with a separate sample SQLite database and live providers disabled. Right drag → Undo, left drag → Undo, reswipe, exhausted deck, custom `picnic` creation with undecided details, sharing to Phone QA Circle, voting, second-session consensus and Circle Undo/reswipe all passed. Stored test photos rendered in navigation, Circle membership and custom-card authors. Group controls fit above navigation. The native datetime field initially overflowed; removing its native intrinsic sizing fixed it, confirmed in the final device screenshot. This is actual hardware verification through Mirroring, not a claim of measured finger latency. Physical trackpad hardware was not independently exercised; mouse dragging and automated wheel/trackpad gesture coverage passed.

Test images are intentionally assigned public brand fixtures, not personal portraits. Missing profile images remain initials. No private photo migration to production was performed. New plan regression tests used explicit demo planning; paid live Muse Spark generation was not repeated in this feature pass. Live venue search was verified separately. The temporary public preview is shut down after QA; production deployment remains pending approval.

## Rendered evidence

Files are local in `test-results/discovery-recovery/` (excluded from Git). Baseline images use the existing production QA account; after images use isolated local/sample accounts, so their activity data differs.

| Evidence | File |
|---|---|
| Before, mobile / desktop | `before-empty-390.png`, `before-empty-1440.png` |
| Completion at four widths | `after-empty-375.png`, `after-empty-390.png`, `after-empty-430.png`, `after-empty-1440.png` |
| Idle and progressive green/red drag | `after-discover-idle-390.png`, `after-drag-right-390.png`, `after-drag-left-390.png` |
| Desktop mouse drag | `desktop-drag-right-1440.png` |
| Undo failure recovery | `undo-offline-rollback-390.png` |
| Real additional venues / exhausted provider | `find-more-real-results-390.png`, `find-more-no-new-390.png` |
| Custom form / shared idea / voting | `custom-activity-form-390.png`, `custom-shared-circle-390.png`, `custom-activity-voting-390.png` |
| iPhone Undo in either direction | `iphone-undo-right.png`, `iphone-undo-left.png` |
| iPhone completion | `iphone-empty-final.png` |
| iPhone custom consensus | `iphone-custom-match.png` |
| iPhone corrected date field | `iphone-form-date-final.png` |
| iPhone group Undo and compact controls | `iphone-group-undo-final.png` |

Visual critique led to compact completion spacing, removal of useless disabled vote controls on an empty deck, an in-row Circle Undo control, explicit undecided metadata, and the native Safari date sizing fix. Swipe behavior and existing branding remain intact.
