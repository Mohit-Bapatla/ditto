# Persistent showcase verification — 2026-10-25

## Decision and implementation

Inspected the recovered presentation database and earlier fixture implementation before adding storage. The recovered database contains multiple sample-owner namespaces and accumulated history, so reusing it as a reset target would risk unrelated data. It remains intact. The dedicated, ignored `data/showcase/ditto-presentation-showcase.sqlite` reuses the original 36 activity definitions/images and the selected recovery owner's original Mohit, Edwin and Paxton photo crops. Stable media copies live under `data/showcase/media/`.

Versioned deterministic IDs, owner/version checks, additive schema initialization and explicit backup-before-reset make startup repeatable. Seed preserves mutations; only expired, unedited fixture dates advance. Reset restores the known baseline with the latest three profile photos. Production/platform, foreign-path, symlink and live-provider guards fail closed. Runtime configuration is checked before SQLite opens.

The baseline has three profiles, four Circles, 36 activities, four interests, four conversations, historical and current voting rounds, two pending proposals and two genuinely approved plans with three approval and RSVP rows each. Future dates use Austin local time. Identity switching uses existing session authorization and permits only the three stable sample identities; personal accounts cannot be selected.

## Verification results

- `npm test`: **57 passed**, zero failed, including gesture regressions and new showcase tests.
- `npm run lint`, `npm run typecheck`, `npm run build`: **passed**.
- Existing integration and multiplayer suites: **passed** against a separate non-showcase SQLite database.
- Discovery recovery and profile-photo regression scripts: **passed** against that separate database.
- `node scripts/showcase-test.mjs`: **passed** on the showcase: three independent sessions, original stored photos, two approved plans, both Undo directions, actual votes and consensus, template planning, all approvals, ICS export, shared custom activity and rejection of personal-account switching.
- After stopping/restarting the server, `node scripts/showcase-test.mjs --restart`: **passed** an exact state fingerprint comparison, including custom records, photos, votes, approvals and plans.
- Repeated seed, stable IDs, date rollover/DST, preserved edited dates and uploaded photos, reset baseline/backup recovery contents, foreign keys, unknown versions and unsafe environments: covered by the new unit tests.
- Managed-server reset refusal verified. Server then stopped, explicit reset backed up all test changes, seed repeated, and final preview restarted with the clean baseline.

Logs for this run: `/tmp/ditto-showcase-{tests,lint,types,build}-final.log`, `/tmp/ditto-showcase-{integration,multiuser,recovery,photos}.log`.

## Rendered interface review

Applied the installed Impeccable and UI/UX Pro Max guidance to the small Settings change and preserved the existing consumer interface. No screen redesign was needed for data restoration.

Before: `test-results/restored-demo/sample-identities-mobile.png`.
After (local, ignored because they include supplied personal photos):

- `test-results/showcase/settings-mobile.png` — 390px, explicit sample notice and three selectable photo identities.
- `test-results/showcase/settings-desktop.png` — desktop identity controls remain in Settings.
- `test-results/showcase/discover-desktop.png` — 1440px, original photography, Mohit's avatar, four Circles, Edwin/Paxton conversation avatars and two approved calendar plans.
- `test-results/showcase/plans-desktop.png` — upcoming plans and approval counts.

Critique: the developer notice is confined to Settings; photo identities are distinguishable without cluttering discovery. Mobile controls remain readable without horizontal overflow. Desktop discovery retains the central activity hierarchy, with group conversation and upcoming plans visible alongside it. All three rendered profile images loaded successfully. Switching to Paxton and back to Mohit worked through the UI. Discover's add control opened the real custom activity form directly in showcase mode, retaining the selected sample identity and all four Circle options.

## Limits and handoff

No new physical-iPhone or live-provider verification was performed in this pass. Swipe/Undo is covered by existing gesture tests and real API acceptance checks; these screenshots are not claimed as fresh physical-device drag evidence. Same-Wi-Fi access is an explicit `--lan` option documented in `docs/SHOWCASE.md`; the running final preview remains loopback-only. Live AI/venue providers are deliberately disabled for repeatable, no-cost sample demonstrations. Production was neither deployed nor modified.

Final command: `npm run showcase`. Final preview: `http://showcase.localhost:3120/`. Start as Mohit; Settings selects Edwin/Paxton. The walkthrough, backup recovery and LAN instructions are in `docs/SHOWCASE.md`.
