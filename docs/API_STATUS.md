# API status — HackTX 2026

The initial no-live-testing restriction was followed until the user explicitly authorized limited live calls after Meta credits were activated on October 24 (Central). Regression tests still use fixtures only. Never infer authorization from the presence of keys.

## Implemented and verified

- **Meta:** `muse-spark-1.3`, Standard mode, `https://api.meta.ai/v1`. Existing model-list verification and OpenAI-compatible chat-completion adapter preserved. Structured output validated with Zod. No Contributor mode, images, billing changes or external messaging.
- **SerpApi:** Google Maps searches and driving directions. IDs, addresses, coordinates, ratings, photos, price strings and hours are preserved when supplied. Missing fields stay absent. Search cache: 10 minutes; directions: 5 minutes.
- **Joint planning:** four independent users, actual 4/4 dinner and 3/4 bowling votes, budget/availability constraints, two real venues, one real route, four approvals, four RSVPs, authorized calendar download. Passed locally and on the public deployment (8,090 ms for the public plan).
- **Natural discovery:** Meta intent parsing plus SerpApi returned 12 real venue results. These are venues, not invented public meetups.
- **Social Autopilot:** live extraction from selected in-app messages; exact evidence checked; human-reviewed proposal became an idea. Passed through HTTP and a four-user browser walkthrough.
- **Group synthesis:** actual vote classifications are deterministic and private until round completion. Muse compromise orchestration is fixture-tested; its separate synthesis button has not been live-tested to conserve credits.

## Usage before production acceptance

Eight Meta inference attempts and six SerpApi requests. Meta reported 6,995 input and 12,758 completion tokens across local calls, including reasoning tokens. Estimated Meta spend: **$0.06297**. SerpApi credits consumed are at most six; using published Starter pricing as a conservative credit value, approximately **$0.15** (not an assertion about the promotional account's cash charge).

First access check: HTTP 200 in 1,521 ms, 17 input / 128 completion tokens, no text because the deliberately tiny completion budget was exhausted. The second check returned valid JSON in 954 ms, 17 input / 238 completion tokens. The first live Autopilot output failed validation; category capitalization normalization and explicit schema instructions fixed it. No automatic retry of billing/auth failures.

Sources checked: [Meta pricing](https://dev.meta.ai/docs/pricing-rate-limits) ($1.25/M input, $4.25/M output; conservative estimate ignores cache discounts), [Meta overview](https://dev.meta.ai/docs/overview), [SerpApi pricing](https://serpapi.com/pricing) ($25/1,000 Starter searches). Do not purchase or change billing to run tests.

## Production acceptance

Deployment `8e578db6-75cb-4e9e-ab2a-408ce24abbec` passed one authorized live planning flow on October 25 UTC: two verified venues, one route, four approvals, four RSVPs and calendar export. No additional extraction/discovery calls were made in production. This added three SerpApi requests and one Meta inference flow (at most two attempts under the adapter retry limit), bringing totals to **9–10 Meta attempts and 9 SerpApi requests**. Production token usage was not collected; an approximate conservative allowance of $0.10 for this plan puts combined test credit value below **$0.40**, comfortably within the $2 budget. This is an estimate, not a billing receipt.

## Safe activation and testing

`ALLOW_LIVE_PROVIDERS=false` is the default. Every real adapter checks this switch **before** any request, including model listing. Production activation is an explicit deployment setting. Keep local regression runs disabled, even when `.env.local` contains keys.

```bash
npm test                         # mocked provider calls only
npm run test:integration         # demo calls, local test server
TEST_BASE_URL=http://localhost:3102 npm run test:multiuser
# Only after explicit authorization, once against the intended host:
RUN_LIVE_SMOKE=true TEST_BASE_URL=http://localhost:3102 npm run test:live
# LIVE_EXTRA_FLOWS=true adds one extraction and one discovery call.
```

The live script is disabled without `RUN_LIVE_SMOKE=true`. It uses its own fictional identities. A two-stop plan normally uses two Maps searches, one inference, and one directions request. No unbounded retries/load tests. Inference is limited to 4,096 completion tokens; one retry is allowed for 429/5xx, none for billing/credentials. Local `PROVIDER_USAGE_LOG` records only counts, latency and token usage. Test session snapshots are private, ignored, mode 0600.

## Limits

AI can miss conversational nuances or propose an inconvenient date. The proposal's timing is editable, evidence remains visible, notes carry into planning, and every final plan requires human approval. Prices, opening hours and availability must be confirmed by participants. No reservations are made. Demo drafts never claim AI or verified venues.
