# Venue discovery — 2026-10-25

## Implemented

Search calls `/api/places` with `deck:true`; normalized SerpApi venues become private saved suggestions in SQLite. A per-user persisted search selects those IDs in the existing swipe deck. Simple category queries skip the model. Natural-language queries use Muse Spark, bounded to two venue searches, with owner/global request limits and existing provider cache/demo quotas.

Venue identity remains the provider ID; the private discovery activity has a deterministic user/place ID. A Circle proposal receives a separate Circle-scoped activity ID and an idempotent idea. Friends cannot access the private original but can vote on the shared proposal. Selected venue data survives both manual and live planning without another venue search. Existing voting, Undo, approvals, RSVP and calendar paths remain in use.

SerpApi supplies names, photos, addresses, Maps links, coordinates, ratings, listed prices and hours when available. Muse Spark interprets query/timing/budget/preferences; it does not verify a reservation, opening hours, chess availability or price compliance. Missing prices stay unknown. Suggested timing, hours at retrieval and published event time are distinct. Device distance is optional, permission-driven and straight-line, not travel time.

## Actual live checks

Only three user searches were submitted, with one Muse Spark interpretation (at most two downstream venue queries for that request):

- `bouldering in Austin`: real Bouldering Project – Springdale card/photo; actual mouse drag right saved, Undo restored it.
- `pickleball near UT Austin`: Urban Pickleball Club, its actual returned address and rating; UI Details → Weekend Crew proposal succeeded, queued for the next round rather than altering a round in progress.
- `Coffee shops near UT Austin where three friends could play chess tomorrow under $25`: Muse Spark extracted tomorrow and constraints; SerpApi supplied Lucky Lab Coffee Co., UFO Coffee & Tea and other listings. Cards say Coffee at, not a claim that a café hosts chess. A left drag advanced to the next card.

Search state and decisions survived reload. No production deployment or provider secret changes occurred.

## Automated verification

- 71 unit tests: discovery orchestration with mocked providers, missing fields, empty/error responses, deduplication, persistent saved search/Undo, privacy, stable identity, selected-venue planning; existing swipe/touch/wheel thresholds, multiplayer, photos, showcase and persistence coverage.
- `npm run lint`: no errors; three pre-existing unused-variable warnings in the video capture helper.
- `npm run typecheck`: pass.
- Production build: pass.
- `test:integration`: pass (auth, isolated sessions, votes, approvals, RSVP, calendar, security checks).
- `test:multiuser`: pass (four users, chat, exact votes, consensus, planning, reapproval, RSVP, capacity).
- `scripts/discovery-recovery-test.mjs`: pass (Undo, custom activities, photos, Circle consensus and calendar).
- `scripts/venue-discovery-test.mjs`: pass. Mock normalized venue → private interest → positive/negative Undo → idempotent Circle proposal → three real HTTP client votes → unanimous agreement → all approvals → RSVP → authorized calendar. Outsider access denied. Manual plan keeps the chosen venue. Live planner grounding is covered separately with mocked providers.
- `test:persistence`: original sessions/membership/votes/match survived server restart and a production build change.

Reproduce venue HTTP acceptance on a disposable server with live providers disabled:

```sh
TEST_BASE_URL=http://localhost:3134 TEST_DATABASE_PATH=/tmp/ditto-venue-regression.sqlite node scripts/venue-discovery-test.mjs
```

The test intentionally rejects non-local hosts and database paths outside its disposable prefix.

## Visual review

Actual rendered captures at 375/390/430px and 1440px; baseline and final images are local in this directory. Real mouse drags in both directions and horizontal wheel input exercised the existing engine. No synthetic vote responses. Reviewed image prominence, long titles/queries, truthful metadata and scrollable details. Shortened desktop card height so search and decision controls fit together; separated search loading from vote saving; labeled user preferences and hours at retrieval explicitly. Impeccable detector run once; its type-size advisories concern 12/14/16px values consistent with neighboring existing app controls, including 16px input text to avoid iOS zoom. React review preserved stable keys, hook ordering, server authorization and parallel bounded provider lookups.

Limitations: iPhone Mirroring connected but failed to enter a valid local Safari address; this change has NOT received a fresh physical iPhone finger-swipe pass. In-app browser does not support CDP touch injection. Existing touch-engine tests pass, but these are not a hardware substitute. Fresh physical MacBook trackpad feel was not user-tested; automated horizontal wheel input and wheel unit tests pass. Device geolocation permission/distance was not exercised against the user's location. Missing/empty/provider-error cases use mocked unit tests, not paid live fault injection. No live AI plan-generation request was purchased for this pass.

## Isolated showcase

`lib/showcase-venues.json` contains three actual retrieved listings and original retrieval dates/source URLs, marked cached. The dedicated local showcase appends them idempotently as three private suggestions per sample person. It makes no startup provider calls and does not reuse relative timing such as “tomorrow” from the original search. Cached examples appear ahead of generic browse cards and are labeled cached. The 36 generic activities remain.

Before adding entries, SQLite backup: `data/showcase/backups/before-venue-examples.sqlite`. Exact row comparison: profiles/photos (3), Circles (4), votes (64), plans (4), approvals (8) and interests (5) unchanged. Activity count 36 → 45 (three private venues × three sample profiles). Original dates were not reset. Seed twice remains idempotent; reset tests pass.

## Previews

- Live-provider development preview: http://venues.localhost:3133/ — isolated copy `/tmp/ditto-venue-preview.sqlite`, sample Mohit session loaded only in the task browser. Existing real provider keys remain server-side. Never put its session cookies in documentation or URLs.
- Permanent offline-provider showcase: http://showcase.localhost:3120/ — `data/showcase/ditto-presentation-showcase.sqlite`; `npm run showcase` starts it, `npm run showcase:seed` safely appends missing fixtures. Profile settings select sample identities. `npm run showcase:reset` is an explicit destructive-to-demo reset with backup and requires stopping its server; it is not needed for this change.

Venue thumbnails are remote source-linked references, not copied proprietary artwork. Availability of those remote images can change; missing-photo fallback remains available. SerpApi listings do not guarantee that a place matches every preference or meets a stated budget; users must confirm before committing.

## Phone preview follow-up

The pre-existing temporary HTTPS tunnel was still targeting an older build on port 3122, with live providers and keys disabled. Updated that same temporary preview to the latest production build and enabled live providers using existing server-side configuration; kept `/tmp/ditto-presentation-final-phone.sqlite` and its sessions/photos intact, with a consistent backup at `/tmp/ditto-phone-before-live.sqlite`. HTTPS secure cookies and explicit origin retained. Railway untouched.

Also narrowed model input to query/city/budget so UI request flags cannot become interpreted preferences. Discovery orchestration tests (4) and the production build pass. Mirroring text entry requires paced key presses; bulk typing dropped characters. Real live retrieval succeeded on iPhone Safari through the existing HTTPS link.

Fresh iPhone Safari follow-up PASSED through Mirroring: paced entry of `bouldering tomorrow`, live Muse Spark + SerpApi cards, real right drag saved Bouldering Project – Springdale (verified in SQLite), left drag passed Crux South and advanced to Westgate, then Undo restored Crux South. This supersedes the earlier Mirroring-blocked status for this preview. No new Railway deployment.
