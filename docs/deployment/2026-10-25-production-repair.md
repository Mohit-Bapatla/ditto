# Railway production repair — October 25, 2026

## Root cause and Git state

PR #1 merged `codex/mobile-redesign` into `main` at `449ff08d3d68fd82244d20c2a29c0a847f54380f`. That merge tree matched the tested redesign branch. Local main was simply behind and was fast-forwarded without overwriting unrelated untracked files.

Railway's existing production service had `source.repo=null` and an empty `repoTriggers.edges` list. Its active deployment `8e578db6-75cb-4e9e-ab2a-408ce24abbec` was a CLI upload created at 2026-10-25T03:15:28Z, before the merge at 07:00:04Z. The old build logs still listed `/icon.svg`. No commit SHA was attached to that old CLI upload, so an exact old Git revision cannot be truthfully inferred. This was missing GitHub integration, not browser caching or a failed merge.

## Repair

- Kept project `bb53170f-6766-4dc5-92ef-6e9e3a290e47`, production environment, existing `ditto` service, single replica, Dockerfile, `/data` volume, and public URL.
- Commit `e9a3a872d84b565040642cf4a94dfe8a52c23a17` adds Docker build ARG `PUBLIC_ORIGIN` so prerendered social metadata uses the configured HTTPS origin. Provider secrets remain runtime-only.
- New production sessions now create only their anonymous profile, without silently populating fictional friends, Circles, activities or plans. Existing data is untouched. `DITTO_DEMO_SEED=true` explicitly opts into legacy sandbox seed data; presentation fixtures retain their separate deployment guard.
- Initially deployed a clean Git archive of that commit through the authenticated CLI (`642b9bf9-6c0b-4b9c-a396-6d01f2c2ab9a`) while GitHub App access was unavailable.
- After repository access became available, connected `Mohit-Bapatla/ditto`, branch `main`, to the existing service. Verified a production deployment trigger and GitHub-sourced deployment metadata for the exact commit. Future pushes/merges to main use that trigger, with no watch-path exclusions.

Production URL: https://ditto-production.up.railway.app

## Storage and configuration

Verified real mount `/data`, volume `ditto-volume`, and `DATABASE_PATH=/data/ditto.sqlite`; secure cookies, required persistent volume, production NODE_ENV and the existing HTTPS PUBLIC_ORIGIN remain configured. No secrets were printed or changed. Domain routes to existing service port 3000. Docker starts `node server.js` through the existing storage preflight/permissions entrypoint. No database reset, fixture replacement, or destructive migration occurred.

Created a consistent SQLite backup on the persistent volume at `/data/backups/pre-logo-deploy-20261025.sqlite`, permission 0600. Backup and live database passed quick_check. Compared pre-deployment row identities across all 19 application tables: no original rows were missing. Baseline included 48 profiles, 13 Circles, 60 activities, 44 votes, 3 plans and 6 RSVPs. Test additions use clearly labeled QA identities and an isolated Circle.

A normal Railway restart preserved four original QA session cookies, their profile identities, profile image, Circle membership, exact vote counts, confirmed plan and four RSVPs. No session replacement was required.

## Verification

- Lint, typecheck, 50 unit tests and production build passed.
- Isolated integration and four-user regression suites passed (explicit local demo fixtures; live providers disabled for these tests).
- Public HTTPS, health API, 14 referenced static assets, manifest, favicon, Apple icon and Open Graph image returned successfully.
- Public logo SHA-256 matched the Git asset. Social metadata points to the real public origin.
- Cookies verified Secure, HttpOnly, SameSite=Lax; fresh production session has no seeded Circle.
- Browser: actual right/left pointer drags, progressive green DITTO/red PASS feedback, next-card advancement, saved interest and enabled undo after pass. No fatal console errors observed.
- Responsive checks at 375, 390, 430 and 1440px: no horizontal document overflow. Discover, Circles, Profile and seven-day calendar verified; next-week selection displays the approved QA plan. Profile image loads.
- Live provider acceptance: four independent QA users create/join a Circle and vote; Muse Spark planning returns two SerpApi venues, one verified travel route; all four approve and RSVP; authorized ICS export passes.
- Live chat extraction produces a Meta proposal with evidence, then an explicitly accepted idea. Natural-language venue discovery returns 12 venues.
- Source of truth for final deployed SHA/status is Railway deployment metadata compared with origin/main; the repair report commit itself also exercises the new GitHub push trigger.

## Evidence and limits

Actual live captures are stored locally under `test-results/production-repair/`: before.png; discover-375/390/430/1440.png; swipe-right-held.png; swipe-left-held.png; circles-1440.png; plans-1440/390.png; live-plan-390.png; calendar-approved-390.png; qa-profile-photo-390.png. They are ignored, not uploaded to GitHub. Browser verification uses an isolated QA session, with a public logo asset as its test profile photo; private personal photos were not copied to production.

At verification time iPhone Mirroring reported “iPhone in Use”; actual-device testing of the public URL was unavailable. Responsive browser tests are not a substitute for a fresh physical-device test. Existing local-device swipe testing is documented separately. Existing historical demo records remain preserved rather than deleted.

Railway warns that railway.json support ends December 1, 2026. It currently works; migration to Railway IaC is a separate follow-up, not part of this minimal repair.

References: https://docs.railway.com/services and https://docs.railway.com/builds/dockerfiles
