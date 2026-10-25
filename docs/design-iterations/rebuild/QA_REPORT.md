# Ditto consumer rebuild — verification

Date: 2026-10-25. Local production build at http://localhost:3104. No deployment or paid provider call performed in this rebuild. SQLite remains the existing backend, with a dedicated local QA database at `/tmp/ditto-redesign-production-qa.sqlite`.

## Delivered

Immersive physical Discovery deck; compact four-item navigation; shared rose/Syne/Manrope identity; list-based Circles and shortlist; compact group voting; revised profile, native dialogs, chat and planning surfaces; generated invitation artwork integrated into onboarding/empty states. The working vote transaction and existing backend contracts remain intact. New hardening handles a window switch during drag, long activity titles and failed group photos.

Editable Figma concepts: https://www.figma.com/design/oiko126O5vL4IajWJunzQR (frames 4:8, 4:35, 4:59). The connector reached its Starter tool limit after creating all three. Corrected browser prototypes in `prototypes/a.html`, `b.html`, `c.html` and their real screenshots provide the final composition comparison. Concept A selected. These are prototypes, not fake functional app screens.

## Automated checks

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm test`: 34 passed, zero failures. Includes actual React pointer handlers, Motion state, distance/velocity decisions, vertical intent, pointer cancel, keyboard repeat/nested-control exclusion, save-before-exit ordering, duplicate prevention, recoverable failure, focus handoff, window-blur cancellation and broken photo fallback.
- `npm run build`: pass, optimized Next standalone output.
- `TEST_BASE_URL=http://localhost:3104 npm run test:integration`: pass. Sessions, access control, votes, matches, approvals, RSVP, calendar authorization, security headers/cookies and non-exposed sensitive routes.
- `TEST_BASE_URL=http://localhost:3104 npm run test:multiuser`: pass. Four independent sessions; invite joining, chat authorship/order/idempotency, exact 4/3/1/0 support, private results, sample extraction/consensus, revision/reapproval, capacity races and validation. No live provider calls.
- Restart check: integration wrote an ignored private snapshot; server stopped/restarted; `TEST_SESSION_SNAPSHOT=test-results/rebuild-restart-private.json npm run test:persistence` passed. Both identities, memberships, votes and unanimous match persisted. Snapshot cookies are not committed or printed.

## Real browser checks

In-app browser via CUA, actual mousePressed/mouseMoved/mouseReleased events; never direct calls to vote functions.

1. Discovery at 390: held right green DITTO + tint/rotation, server-backed accepted right exit, held left red PASS + tint/rotation, accepted left exit, next-card handoff, and incomplete movement returning without a vote. Individual exit frames saved.
2. Additional real drag feedback at 375, 430 and 1440 widths, both directions, returning to origin without submitting.
3. Network failure: stopped only the local QA server, physically swiped, verified same card and actionable retry; restarted and physically retried successfully. Reload retained the saved decision.
4. Circle voting: physical right drag advanced to the next real idea. Four fictional demo members finished independently, revealed saved consensus, generated an explicitly labeled non-AI itinerary, all approved, and RSVP changed to going. Calendar authorization/content are covered by integration tests.
5. Separate browser-cookie sessions on localhost and friend.localhost: Jamie QA created a personal profile and Circle; Taylor QA followed the invite, created a distinct profile without losing the invite, and joined. Jamie physically voted; Taylor saw 1/2 finished with their own pending card. Taylor physically voted; the real saved result showed everyone in. This is two web sessions in one browser engine, not two physical devices.
6. A 101-character activity title exposed metadata clipping at375. Smaller long-title typography and reduced caption top padding fixed it; before/fixed screenshots saved.
7. Broken image: temporarily changed only the newly created local QA idea's photo to a missing local URL. Render showed a truthful photo-unavailable fallback. Original image was restored. No production data was changed.
8. Loading: a loopback-only proxy intentionally delayed `/api/state` by4seconds; real loading skeleton and status captured. Proxy is test-only, outside the repository.

## Responsive evidence and review

`before/` contains major screen baseline captures at375/390/430/768/1440. `after/` contains the main screens plus activity details, filters, onboarding, Circle creation, invitations, voting, chat, consensus, plan creation/review/confirmation at those widths. Native dialogs and forms use the real app. Some full-page captures naturally show the fixed navigation at its viewport position, not the end of the full image.

`after/layout-measurements.json` verifies requested viewport sizes and no main-document horizontal overflow. `after/card-bounds.json` additionally checks the active card against **clientWidth**, not just innerWidth: exactly12px left/right gutters at320/360/375/390/430; centered at768/1280/1440. Browser scrollbars consume15px, so raster widths can differ from requested innerWidth.

Round1 fixed stale500px card sizing, Profile's orphaned location icon, and chat's sticky composer/empty gap. The finish reviewer closed the apparent gutter defect using measured bounds and accepted the refreshed chat. Technical review fixed category label-in-name and a missing dialog CSS class. Long-title and image-failure evidence were verified afterward by the implementation agent. See `FINISH_REVIEW.md` and `TECHNICAL_AUDIT.md`; their historical findings are retained with resolution addenda.

## Limits

No physical iPhone Safari, Android Chrome or trackpad hardware certification. The available browser driver could not synthesize native touch events; touch-type pointer intent is covered in DOM tests, and mobile dimensions are emulated. Actual Safari address-bar/safe-area changes, browser reduced-motion visual behavior,200% text zoom and throttled remote-photo loading were not certified. CSS includes safe-area/dynamic viewport handling and reduced-motion alternatives. No new live Meta/SerpApi calls were made; previous live evidence remains in the existing reports, with current provider adapters/fixtures covered by regression tests. This local rebuild is not a public deployment test.

## Preview

Open http://localhost:3104 while the local production preview is running. For development: `DATABASE_PATH=/tmp/ditto-rebuild-preview.sqlite COOKIE_SECURE=false PUBLIC_ORIGIN= ALLOW_LIVE_PROVIDERS=false npm run dev -- --port 3104` (stop the existing preview first). Keep live providers paused for fixture testing. Do not run against a production SQLite path.

The reference library is the existing actual27-capture manifest in `docs/ditto-design-references/assets/reference-captures/manifest.json`. Known inaccessible/reference gaps remain explicitly documented there; no generated screenshot is represented as a third-party interface. Skill dataset entries, full file inventory, provenance and recipe/template classification are in `research/` and `DIRECTION.md`.

Final edge-state addendum: the delayed-data loading state and empty deck were captured; the latter offers filter changes/revisit actions and disables vote controls. The new two-host browser test completed both physical votes and revealed the unanimous match. `after/long-title-voting-375-fixed.png` confirms the complete title, category, attribution and controls after hardening. Original QA photograph restored after the missing-image check. The final preview shows a real Epoch Coffee provider photograph, not generated venue art.

Browser keyboard addendum: focused the real Coffee activity card and pressed ArrowLeft. The saved card left the deck; Undo last pass restored the same activity. This supplements the automated keyboard/focus tests.

Implementation commit: `3e2e458` (visual rebuild and interaction hardening). The following evidence commit contains the reference comparison, responsive screenshots, critique records and test report.
