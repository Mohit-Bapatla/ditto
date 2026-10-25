# Ditto

**Less scrolling. More living.** A mobile-first social app that turns shared interests into plans people approve together. Built for HackTX 2026.

## Run locally

Requires **Node.js 22.13+** (tested on 26.10) and npm. SQLite is built into Node; no database service is required.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The first visit creates a private demo sandbox automatically. Data persists in `data/ditto.sqlite` across reloads and restarts. No API key is necessary for the interactive demo.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
# Against a running development or production server:
npm run test:integration
```

The integration script creates isolated test identities and records on the running server. Run it only against a development/test instance. `TEST_BASE_URL` overrides localhost:3000.

## What works

- Responsive Discover card stack, drag/touch/keyboard controls, persisted interest and passes, city/category/budget/open-spots filters, activity publishing, join/withdraw, accurate attendance and transactional capacity limits.
- Personal browser sessions and onboarding with avatar, city, interests and budget. Personal profiles are separate from fictional demo identities.
- Private Circles, high-entropy invite links, joining from independent browsers, member-authored ideas, immutable round rosters and idea decks, independent saved votes, everyone/majority thresholds, private votes until reveal, and ranked matches.
- Five-second polling synchronizes shared state between sessions. This is not Supabase Realtime.
- SerpApi Maps place search, normalized real results, source links, on-demand directions, bounded caching, server-only keys, timeouts and actionable errors.
- Meta Muse Spark natural-language discovery and itinerary planning using saved matches, actual member preferences and SerpApi venues. Model access is checked against `/models`; structured output is validated with Zod and unknown venue IDs are rejected.
- Explicit demo plan creation when live providers are unavailable. These drafts contain no fake venue results and are visibly labeled “no AI.”
- Per-member plan approval, unanimous confirmation, separate voluntary RSVP, copy invitation, and authenticated `.ics` downloads after approval. Calendar timestamps are UTC; the UI displays the viewer’s timezone. Verified drive durations are included in calendar duration where available. Unknown travel time is clearly flagged.

## Two-minute judging walkthrough

1. Open Discover. Click the heart or drag right. Open **Plans** to see the interested activity; interest does not imply attendance.
2. Open **Circles → Weekend Crew → Start a round → Everyone’s in**.
3. Vote yes on **Korean BBQ** and **Bowling**. Make different choices for the other two ideas. Use the Alex/Jordan/Maya/Sam buttons to repeat independently as each fictional member. Every vote is really stored; none is seeded or simulated automatically.
4. Click **Reveal your matches**. Korean BBQ and Bowling show “Everyone’s in” only if all four said yes.
5. Click **Plan our hangout**. With keys, run the live Meta + SerpApi flow. Without keys, explicitly choose **Create a labeled demo draft**.
6. In **Plans**, approve as each member. Once everyone approves, download the calendar invite and RSVP. Nothing is sent automatically.

To test genuine multi-session collaboration: create a personal profile, create a new Circle, copy its invite URL, and open it in another browser or private window. Create a second personal profile and join. Start a round after both members join. New members participate in the next round, not an already-started one.

## Configuration

| Variable          | Purpose                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_PATH`   | SQLite path on persistent disk; default `./data/ditto.sqlite`                                                          |
| `MODEL_API_KEY`   | Meta Model API credential, server-side only                                                                            |
| `META_MODEL`      | Desired model, defaults to `muse-spark-1.3`; verified with account model listing before inference                      |
| `MODEL_BASE_URL`  | Defaults to `https://api.meta.ai/v1`; an OpenAI-compatible provider with `/models` and `/chat/completions` can be used |
| `SERPAPI_API_KEY` | Real Maps search and directions                                                                                        |
| `COOKIE_SECURE`   | Set `true` behind HTTPS; leave `false` for local HTTP                                                                  |

The UI reports key presence as **configured**, not proof of a successful call. No credentials were provided during implementation, so live provider calls remain unverified. Add keys to `.env.local` and restart the server; never commit that file.

### Provider contracts

- Meta documentation: https://dev.meta.ai/docs/overview — lists `muse-spark-1.3` and OpenAI compatibility. Adapter calls `GET /models`, then `POST /chat/completions` with JSON output, server-side validation and a single retry for 429/5xx. An inaccessible configured model produces an error instead of silently changing providers.
- SerpApi search: https://serpapi.com/maps-local-results — `GET /search.json?engine=google_maps&type=search&q=...`; parses `local_results`. Missing prices/ratings/addresses are not invented.
- SerpApi directions: https://serpapi.com/google-maps-directions-api — `engine=google_maps_directions`, `start_addr`, `end_addr`, `travel_mode=0`, `distance_unit=1`. Reads `directions[0].formatted_duration`, `formatted_distance`, and duration seconds. Place cache is 10 minutes; directions cache is 5 minutes; both are bounded per process.
- Model prompts treat member ideas and venue content as untrusted data. The model cannot write database records, approve plans, RSVP, or send notifications. Only validated venue IDs enter an AI plan.

## Architecture and data

Next.js App Router + React + TypeScript; Tailwind v4 and custom responsive CSS; Motion; Lucide; Zod. `lib/db.ts` implements the SQLite repository and server authorization. `database/schema.sql` is the idempotent relational migration, automatically applied on startup. Foreign keys, unique vote/swipe/member keys, checked enums, indexes and `BEGIN IMMEDIATE` transactions protect consistency.

Tables: profiles, sessions, circles, members, activities, participation, swipes, ideas, rounds, round_members, round_ideas, votes, plans, approvals, rsvps. Seed data is created in `createSession()` and isolated by sandbox owner. Production state is never bundled into source or browser local storage.

Session cookies are HttpOnly, SameSite=Lax, random UUIDs, and optionally Secure. Server handlers authorize every private Circle/plan read and write. Switching identities only allows profiles owned by the current session; private demo Circles cannot be joined by invite. Only the current member’s votes and aggregate progress are returned until all participants finish. Expensive provider actions have per-owner process-local rate limits. Cross-origin writes are rejected by comparing Origin to Host.

Photos are illustrative Unsplash images selected by category, not venue photos. Seeded meetups are fictional even when a known public landmark is named. Real public activities come only from user submissions.

## Deliberate MVP limits

- SQLite replaces the preferred Supabase PostgreSQL/Auth/Realtime stack. No Supabase integration or RLS migration is claimed. Authorization is server-side; live collaboration uses polling.
- Browser sessions are anonymous, device-bound identities, not recoverable verified accounts. Clearing cookies loses access. Add production authentication before a public launch.
- No email/SMS, push, scheduled reminders, external calendars, or external private-message access. Sharing is manual; calendar support is a file download, not a write to an account.
- No chat/autopilot, wildcard mode, venue reservations, availability calendar, host approval queue, uploaded covers, geolocation request, or driving-distance filter. Activities use automatic joining; private activity ideas live inside Circles.
- No live provider success is claimed until valid credentials are supplied. AI can propose a start and venue; people must verify hours, prices, travel and availability.
- Single-server, persistent-disk deployment only. Do not deploy this SQLite implementation to ephemeral/serverless storage. Multi-instance production needs a shared database and distributed rate limiting. Automated session expiration/cleanup and distributed abuse controls are not yet implemented.

## Deployment

Use **one Railway Node service with a persistent `/data` volume**. The repository now includes a standalone Docker image, secure-cookie defaults, explicit production origin checks, database startup/integrity validation, health checks, online backups and cross-session restart tests. Local SQLite data and `.env` files are excluded from the deployment image.

See [the deployment runbook](docs/DEPLOYMENT.md) for exact provisioning, secret configuration, deployment, public acceptance, restart and backup commands. Live demo: **https://ditto-production.up.railway.app**. Public cross-session and persistence checks pass. SerpApi is live; Meta completion requests are blocked by provider billing (HTTP 402), so use the labeled demo itinerary option until billing is resolved. No Supabase migration is required.
