# HackTX submission readiness — October 25, 2026

## Release scope

Feature freeze: unified gesture engine and persistent showcase from `d069abb`, plus the submission-blocking Railway build fix `46d79d2`. Next.js build workers now use independent in-memory SQLite databases; the running service still uses `/data/ditto.sqlite`. No destructive migration, new product feature or broad UI change was introduced.

Public endpoint: https://ditto-production.up.railway.app. GitHub: `Mohit-Bapatla/ditto`, production branch `main`; development branch `codex/discovery-recovery`. Release documentation is committed after the runtime fix. Consult Railway's successful deployment commit and the final handoff for the exact deployed revision; a successful Git push alone does not prove deployment.

## Verification ledger

- Lint, TypeScript, production build, and 64 unit/component tests passed locally, including after the SQLite build fix.
- Isolated integration, multiuser, discovery recovery, profile photo and stop/restart persistence suites passed.
- A separate live-provider rehearsal passed with three independent sessions: profiles/photos, Circle create/join, chat, selected-message Muse Spark extraction, accepted proposal, real SerpApi venues, private custom activity, swipe/Undo, unanimous votes, grounded Muse Spark itinerary, three approvals, three RSVPs and ICS export. Eleven venues were returned. No frontend responses were stubbed.
- Actual browser right/left drags and Undo were exercised and captured. The preceding `d069abb` pass includes physical MacBook user acceptance and iPhone Mirroring gesture verification. These are not substitutes for repeating physical-device acceptance on a production URL.
- Production deployment and smoke results are recorded separately in the final handoff and private test artifacts. Do not interpret this checked-in ledger as a claim that every device or provider failure scenario was tested live.

## Data protection

Existing Railway project/service retained, one instance with persistent `/data` volume. Production has secure HttpOnly SameSite cookies, explicit public origin, persistent-volume enforcement and live-provider credentials. Showcase/fixture flags are disabled. Before release, SQLite quick-check passed and a backup was created at `/data/backups/ditto-2026-10-25T10-06-42-322Z.sqlite`. Baseline: 61 profiles, 14 Circles, 60 activities, 52 votes, 4 plans, 10 RSVPs. Smoke tests may add explicitly named QA profiles and a private QA Circle; they never import the showcase or publish sample activities to the public feed.

Permanent showcase: `npm run showcase`, http://showcase.localhost:3120/. Its database and three original photos remain in ignored `data/showcase/`. It has the named four Circles and 36 activities, upcoming examples, and per-session sample identities. The stop/reset/start workflow is documented in [REHEARSAL.md](REHEARSAL.md) and [SHOWCASE.md](../SHOWCASE.md). Live rehearsal data is separate in ignored `data/ditto-live-rehearsal.sqlite`.

## Repository publication audit

A scan of all 950 unique reachable history blobs found no current configured provider credentials, common token/private-key signatures, committed private databases or non-example environment files. This is a bounded audit, not a guarantee against every possible unknown secret. No credential rotation was indicated by that scan. Production dependency audit reported zero vulnerabilities; no dependencies were added. Missing Manrope and Syne OFL notices were supplied from their upstream repositories.

**Publication still needs owner review:** the repository contains historical third-party research screenshots (471 tracked media files total, approximately 44.7 MB; 430 under docs). Redistribution permission is not established. Historical screenshots may also contain names/avatars. Review or exclude these before public release; removing a file only from HEAD does not remove it from history. No history rewrite or visibility change was performed. Original profile uploads, SQLite files, private test session credentials, backups and recordings remain ignored. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).

## Originality and official requirements

The team confirms that **all Ditto-specific code and assets were created during HackTX**, with no pre-existing Ditto project materials. The first Git commit is October 24 at 8:24 PM America/Chicago; this corroborates the recorded timeline but does not independently establish creation dates. Third-party libraries/fonts are separately credited. Development used Codex and some AI-generated artwork; disclose other tools actually used by the team.

The [official rules](https://hacktx26.devpost.com/rules) require event-created work, public code/video and honest AI disclosure. The [event page](https://hacktx26.devpost.com/) lists the October 25 11:30 AM America/Chicago submission deadline and in-person judging. The Meta description emphasizes meaningful human connection and essential AI integration; numeric sponsor rubric weights in older internal documents were not independently confirmed. Check the actual submission form for current field and video-length requirements.

## Owner's final actions

1. Review historical research media and any personal material; explicitly approve repository visibility only when ready. The repository has not been made public by this task.
2. Rehearse using [the exact three-person sequence and recording checklist](REHEARSAL.md). Keep three separate browser identities. The protected populated showcase disables live AI; use the isolated live rehearsal or public app for actual Muse Spark calls.
3. Review captured raw clips, record narration and any missing participant/device shots, upload the final video publicly, and submit the Devpost entry before the deadline. No upload or submission is claimed here.
4. Keep a local showcase and a previously recorded real AI clip as the honest network-failure backup. Do not present a sample planner as live AI or a proposal as an approved plan.

## Observed public release results

Railway deployment `74fe92a7-95dc-45bb-a2ed-3f9b349821e9` successfully served `2791ba4` after the build fix. A complete public three-session acceptance run passed with 12 real venues, real Muse extraction/planning, saved votes, all approvals/RSVPs and calendar export. One earlier attempt encountered HTTP 502 during a deployment switch; the repeat after the deployment completed passed. Browser right-drag and Undo were also verified on the public URL.

After deployment, production SQLite quick-check passed. Comparing all original rows in profiles, Circles, activities, votes, plans and RSVPs against the pre-release backup found **zero prior rows missing or changed**. New private QA records account for increased totals. The protected local showcase independently passed quick-check and still has 3 profiles with stored photos, 4 Circles, 36 activities and 4 plans.

Raw actual-UI recordings are stored privately in `test-results/submission/footage/`. They include a real Muse extraction call/result, discovery, left/right drags, consensus, approval and calendar views. Some desktop captures are cropped by the browser capture surface; they are rehearsal evidence, not a finished submission movie. Record the final narrated take using the shot checklist. The saved approval/consensus views originate from real API transactions; the clips do not claim that all three people were filmed voting simultaneously.

The latest attempt to control iPhone Mirroring returned no available input window despite displaying a cached screen. Production finger-swipe acceptance must therefore be distinguished from the earlier physical-device pass of the same swipe code. Do not label current production physical-device QA complete without the participant's confirmation.
