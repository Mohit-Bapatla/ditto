# QA report

Test databases are isolated under `/tmp`; production records are never reset or overwritten. Automated regression suites invoke no live Meta/SerpApi endpoints. Limited, separately authorized live acceptance tests are documented in API_STATUS.md.

## Automated results

- Baseline: 12 tests passed before changes.
- Current unit suite: **24 passed**, covering matching, calendar escaping/UTC, authorization, persistence, capacity, exact origins/cookies, disabled-provider guards, venue/direction fixtures, quota/timeout errors, invalid JSON, no billing retries, evidence validation, group synthesis, planning orchestration, and non-destructive migration/backup.
- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- `npm run test:integration`: passed; existing Discover, demo voting, matches, approvals, RSVP, calendar, two-user invites, cookie flags, CSRF and private-file URL checks preserved.
- `npm run test:multiuser`: passed. Alex, Jordan, Maya and Sam are four separate cookies, plus an unauthorized fifth session. Covers minimal profile setup, invites/duplicate joins, authored ideas, 4/3/1/0 support, private votes until completion, exact matches, a later no-match round, simultaneous chat, sender spoof attempts, duplicate message retry, consent/evidence, fixture proposal acceptance, new-round proposal matching, member constraints, Dinner + Activity, edit/reapproval, stale edits, four RSVPs, withdrawal, calendar authorization, public activity discovery, interest vs attendance, simultaneous capacity competition, host-only edit/cancel, cancelled joins and invalid inputs.

## Browser verification

Four independent host-scoped cookie jars: `127.0.0.1`, `jordan.localhost`, `maya.localhost`, `sam.localhost`, all targeting the isolated production build. No demo identity switching was used for this walkthrough.

Verified through the actual UI: fast name/city profile setup, invite joining, four member names, four authored messages, polling delivery without refresh, selecting messages and consenting, real Muse extraction, editable proposal review, explicit idea acceptance, four independent votes, unanimous reveal, real Meta/SerpApi plan, four independent approvals, confirmation only after fourth approval, four independent RSVPs, and grounded “Why this plan?” counts. Calendar content/download authorization also passed HTTP tests. Mobile width 390px had no horizontal page overflow; desktop and mobile screenshots are saved in this directory.

## Public release acceptance

Deployment `8e578db6-75cb-4e9e-ab2a-408ce24abbec` succeeded. Startup created the private migration backup and verified persistent database integrity/write access. Read-only persistence tests confirmed original public sessions, memberships, votes and matches. Four new fictional public sessions completed live AI planning with two real venues and one route in 8,090 ms, then four approvals, four RSVPs and calendar export. Public browser verification confirmed Discover, Circles, the Chat & AI entry point, and the period-free branding. Updated screenshot: `public-deployment.jpg`.

## Bugs found and fixed

- Personality wording for avatars removed; optional interests no longer inherit fictional demo selections. Name/city suffice.
- Live Autopilot category casing could fail validation; normalized recognized categories and clarified the schema contract.
- Existing integration test assumed the first activity was its own seed; after lifecycle tests a cancelled public activity could appear first. Test now selects its own active demo record.
- “Everyone agrees” prematurely described an unfinished round; changed to “Needs everyone’s yes”.
- Cancelled/past activities could be joined; now rejected server-side and filtered from the discovery deck.
- Activity retries lacked idempotency: stable nonce and unique user/nonce submission records added.
- Plan edits needed approval invalidation: revisions clear approvals/RSVPs and reject stale edits. Changed activities lose stale venues/routes.
- Proposal timing was not carried into ideas: editable timing and unresolved notes now persist and enter the planning context.
- Localhost cookies are shared across ports; testing alongside the old local app caused session replacement. QA uses distinct loopback hostnames.
- Removed the trailing wordmark period and visible Ditto brand punctuation throughout the UI.

## Security and release review

All new private actions authorize Circle membership; messages use the session's user ID, not client-supplied authorship. SQL parameters and database uniqueness constraints protect writes. Model outputs cannot approve plans, RSVP, send messages, or invite people. Evidence IDs/quotes and venue IDs are checked against authorized source data. Schema additions use CREATE IF NOT EXISTS; no dropped tables/columns. Deployment automatically creates a private consistent backup before first adding the coordination tables.

Scanned all 86 existing Git history blobs for current configured secret values and common private-key/GitHub/AWS credential patterns: zero matches. No tracked `.env` or SQLite/database paths. This is a focused scan, not proof that arbitrary unknown secrets can never exist. Repository remains PRIVATE; no visibility change was performed.

## Remaining limits

- Device-bound anonymous sessions, not recoverable accounts; original MVP limitation preserved.
- Chat displays the latest 100 persisted messages; older-message pagination/attachments/moderation are not implemented.
- No automatic background Autopilot, external-message access, invitations, reservations or notifications.
- Natural-language timing is a proposal, not a timezone-aware availability solver; users must review it.
- Templates select supported voted ideas into two slots; there is no separate per-slot voting engine. Surprise Us combines categories; it is not an independently live-tested AI surprise generator.
- Fixture demonstration is a fixed sample conversation, not simulated general reasoning. Separate group-synthesis inference is mock-tested only.
- UI/browser tests are performed through Codex browser automation; the reusable regression scripts cover HTTP/session behavior, not a checked-in Playwright runner.
- Full offline behavior is an error state, not offline editing. Server rate limiting remains process-local. Single Railway instance required.
