# Ditto

**Less scrolling. More living.** Ditto helps friends turn “we should hang out” into a plan they actually agree to.

[Live app](https://ditto-production.up.railway.app) · [Judging and recording guide](docs/submission/REHEARSAL.md) · [Persistent showcase](docs/SHOWCASE.md)

Friends discuss an outing, ask **Meta Muse Spark** to turn selected messages into an editable proposal, vote independently, then approve a shared itinerary. **SerpApi** supplies real venue search results and available route information. AI proposes; people decide.

## Core experience

- Physical left/right swipe cards in Discover and Circle Ideas, with touch, mouse, horizontal trackpad, keyboard and button support. Progressive PASS/DITTO feedback, guarded submissions, recoverable failures and persistent Undo.
- Private Circles with invites, member chat, saved independent votes, consensus and optional constraints.
- Muse Spark conversation extraction, natural-language discovery and grounded planning. Structured responses are validated; unknown venue IDs are rejected.
- Custom activities, stored profile photos, per-member approvals, voluntary RSVP, seven-day calendar and authenticated `.ics` export.
- SQLite persistence and five-second polling across independent browser sessions.

No reservations or invitations are automatically sent. Interest is not attendance. Venue hours, prices, availability and AI suggestions still need human review.

## Quick start

Node.js **22.13+** with `node:sqlite` is required; the production Docker image uses Node 24.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Ordinary development can create legacy sample sandboxes; production starts with an empty anonymous identity. For the intended populated judging environment, use the dedicated command below instead.

```sh
npm run showcase
# http://showcase.localhost:3120/
# Stop the showcase before deliberately resetting its test data:
npm run showcase:reset
npm run showcase
```

The showcase contains Mohit, Edwin and Paxton, four Circles, 36 activities, conversations, voting examples and upcoming plans. Separate sessions select a sample identity in Profile → Settings. Original photos are loaded only from ignored local storage when available; a clean clone shows initials. `data/showcase/` is persistent, backed up before reset, and never sent to production. See [SHOWCASE.md](docs/SHOWCASE.md).

**The repeatable showcase deliberately disables live providers.** Its labeled sample planning must never be presented as live AI. Use the public app with three fresh personal sessions for the live Muse Spark demonstration, or an isolated rehearsal instance configured for live providers. Do not enable production flags on the protected showcase database.

## Public judging demo

A visitor-isolated `/demo` entry is prepared for deployment approval. It generates the familiar sample people, four Circles and 36 activities with fresh IDs, separate cookies, own-demo reset and persistent AI usage caps. It never copies real users or sessions. See [public demo setup, limits and judging flow](docs/PUBLIC_DEMO.md).

## Provider configuration

Keep credentials in `.env.local` or private Railway variables, never Git or client code.

| Variable | Purpose |
|---|---|
| `MODEL_API_KEY` | Server-only Meta Model API credential |
| `META_MODEL` | `muse-spark-1.3`; checked against the account's model list |
| `MODEL_BASE_URL` | `https://api.meta.ai/v1` by default |
| `SERPAPI_API_KEY` | Real Maps venue searches and directions |
| `ALLOW_LIVE_PROVIDERS` | Explicit `true` to enable billable provider requests; default off |
| `DATABASE_PATH` | Local SQLite file; production `/data/ditto.sqlite` |
| `COOKIE_SECURE` | `true` for HTTPS; `false` for local HTTP |
| `PUBLIC_ORIGIN` | Exact HTTPS production origin |
| `REQUIRE_PERSISTENT_VOLUME` | `true` in the Docker production service |

Muse Spark receives explicitly selected Circle messages or relevant planning context. It cannot approve a plan, RSVP, or send messages on a user's behalf. SerpApi results have source links; unknown metadata is omitted or labeled as an estimate. Provider failures are actionable errors; the separate no-AI sample draft is visibly labeled.

## Architecture

Next.js App Router, React, TypeScript, Motion, Lucide, Zod and custom responsive CSS. SQLite repositories and authorization live in `lib/db.ts`; HTTP handlers enforce membership and same-origin writes. Stable IDs, transactions and unique constraints protect votes and retries. `SwipeSurface` and `useSwipeDeck` share input behavior without merging Discover and Circle backend operations.

SQLite uses one persistent Node service, one replica and a mounted `/data` Railway volume. The Docker entrypoint checks storage and secure production configuration. Migrations are additive and idempotent. Photos are stored with profile/activity records; databases, backups, environment files and private test captures are ignored. [Deployment runbook](docs/DEPLOYMENT.md).

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
# Run these only against a separate local test database with DITTO_DEMO_SEED=true:
TEST_BASE_URL=http://localhost:3124 npm run test:integration
TEST_BASE_URL=http://localhost:3124 npm run test:multiuser
TEST_BASE_URL=http://localhost:3124 node scripts/discovery-recovery-test.mjs
TEST_BASE_URL=http://localhost:3124 node scripts/profile-photo-test.mjs
```

`TEST_SESSION_SNAPSHOT=/private/path.json` on integration saves credentials for `npm run test:persistence` after restarting that server. Keep snapshots private. Live acceptance is explicit and creates only labeled QA sessions/private records:

```sh
RUN_LIVE_SMOKE=true TEST_BASE_URL=https://ditto-production.up.railway.app node scripts/submission-smoke.mjs
```

This calls real providers and may incur usage charges. Do not run it repeatedly for filming. Use the existing captured real response or conduct one deliberate live demonstration.

## Scope and honest limitations

Anonymous browser sessions are device-bound, not verified/recoverable accounts. Clearing cookies loses access. Collaboration uses polling, not WebSockets or Supabase Realtime. No automatic email/SMS, calendar-account synchronization, venue booking or guaranteed availability is implemented. Safari may reserve browser-navigation gestures; mouse dragging and buttons remain alternatives. This single-instance hackathon deployment does not claim distributed abuse controls or production-grade account recovery.

## HackTX submission and provenance

Ditto is prepared for HackTX 2026's Meta human-connection track. Muse Spark is central to turning conversation into actionable proposals and grounded plans; consensus and commitment remain explicit human actions. Development used OpenAI Codex for code, debugging, tests and documentation, with AI image generation for some original artwork. Disclose all other team-used tools in the final submission.

Git's first recorded commit is October 24, 2026, 8:24 PM America/Chicago. This is evidence of repository history, not proof that every asset or line was created during the event. The team confirms that all Ditto-specific code and assets were created during the event, with no pre-existing Ditto project materials. This is the team’s originality declaration; libraries, fonts and reference products are credited separately. See [submission requirements and release audit](docs/submission/READINESS.md).

[HackTX rules](https://hacktx26.devpost.com/rules) require public code and transparent AI-tool disclosure. Repository visibility is controlled by the owner; no automated visibility change is made. Reference screenshots are research evidence, not Ditto assets or an implied license to reuse third-party branding. Review historical research media before public release. [Third-party notices](THIRD_PARTY_NOTICES.md).
