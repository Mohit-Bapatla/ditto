# Public judging demo

Intended entry: `/demo` on the existing Railway service. Normal fresh visitors also see **Try Demo**; existing profiles can open it in Settings. This change is awaiting deployment approval. Do not claim the production route is live until tested after deployment.

Each visitor explicitly starts a private sample namespace containing Mohit, Edwin, Paxton, four Circles, 36 activities, chat, sample votes and upcoming plans. The fixtures are generated from source definitions with fresh IDs. No production/local database, real session, uploaded profile photo or private chat is copied. Initials represent the sample people.

The separate HttpOnly `ditto_demo` cookie is scoped to `/api/demo`, lasts 24 hours and uses secure cookies in production. `/` retains the normal `ditto_session` cookie. The Demo menu switches only among the visitor's sample identities, resets only that namespace, and exits to the normal app. A private browser window gets an independent demo. Tabs sharing the same cookie are the same visitor.

## Judge sequence

1. Start demo → drag Discover cards; Undo restores the last choice.
2. Open Weekend Crew → vote on its current ideas. Use Demo → Explore as to switch to Paxton and finish his votes; Edwin has a visibly pre-seeded perspective. Consensus appears only after the actual round completes. Start a new round to cast all three perspectives yourself.
3. Chat & AI → select messages and consent → Suggest with Muse Spark. Accept the proposal. New ideas enter the next round, not a round already in progress.
4. After consensus, create a live plan, or choose the explicitly labeled no-AI sample draft if the provider limit is reached. Switch sample people to approve it; RSVP separately.
5. Open Plans and choose its future day. Existing confirmed examples have actual seeded approval records. Calendar export and copied invitation links are blocked in this demo.
6. Demo → Reset my demo → confirm. Other visitors and the normal account are unchanged.

No email, SMS, booking, reservation or external calendar-write integration exists. The public demo additionally rejects external Circle joins and calendar downloads; real account functionality remains available outside `/demo`. Sample profile editing/uploads are blocked to prevent confusion and copying personal data into a public demo.

## Limits and persistence

SQLite stays on the existing persistent volume. Additive `demo_sandboxes` and `demo_usage` tables isolate ownership and retain quotas. Existing tables and records are preserved. Demo graph deletion requires a marked demo owner. Expired demo graphs are removed in bounded batches when a demo starts; usage counters older than one extra day are pruned then.

Hard limits (not client-side): 300 starts/resets globally per UTC day; six resets per visitor/day; 300 actions per visitor/day and 12,000 globally; 48 activities and eight Circles per namespace. Uploaded custom photos are disabled. Provider calls reserve quota atomically immediately before actual outbound fetches, including retries/model lookup: 30 per visitor/day, 12 per minute, 300 globally/day. Reset preserves the visitor quota ID. New cookies cannot bypass the global cap. Cached searches do not consume outbound-call quota. Existing model output is capped at 4096 tokens. No dollar-cost guarantee is made; provider pricing and account-level billing controls still apply.

`PUBLIC_DEMO_LIVE=false` pauses demo provider calls while preserving real-user provider settings. `ALLOW_LIVE_PROVIDERS` and provider keys remain necessary. Exceeding limits produces a recoverable message; manual/sample planning stays honestly labeled. Ordinary user calls are unaffected by demo quotas.

## Validation and rollout

Run `npm test`, lint, typecheck, production build; `TEST_BASE_URL=http://localhost:3126 node scripts/public-demo-test.mjs` against an isolated production-mode test database with normal fixtures disabled. `LIVE_DEMO=true` runs actual Muse/SerpApi calls, never simulated responses. The test refuses remote targets to prevent accidental creation of real QA accounts in production.

The local verification build can use `DITTO_BUILD_DIR=.next-demo` so it does not disturb the existing showcase/phone preview. Do not set that variable on Railway. Keep `DITTO_SHOWCASE` and `DITTO_PRESENTATION_FIXTURES` unset in production; the public demo does not rely on those local-only flags.

After explicit deployment approval: take a consistent production backup, deploy this commit to the existing service, check `/demo` in fresh private browsing on desktop and iPhone, verify role switching/swipe/reset, run one bounded real-provider demo flow, and verify a pre-existing normal session remains intact. Until then, actual public-route and physical iPhone acceptance remain unverified.
