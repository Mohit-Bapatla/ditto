# Ditto judge rehearsal and recording

## Devices and starting state

Primary: MacBook, power connected, browser at 100%, 1440×900 or 1280×800, notifications silenced manually. Backup: iPhone Safari with the public HTTPS URL and a charged battery. Have a second browser/private session ready. Do not clear cookies: identities are device-bound.

Public app: https://ditto-production.up.railway.app. Populated offline-capable fallback: http://showcase.localhost:3120/ after `npm run showcase`. The local showcase uses only local photos and SQLite. Its sample planner is explicitly **no AI**. Do not pretend cached or fixture results are a fresh model call.

Keep three participant sessions separate: ordinary browser, private window, and iPhone (or three distinct browser profiles). Label them Mohit, Paxton and Edwin only with the participants' agreement. The local showcase instead supports Profile → Settings → sample identity, independently per session. Merely opening three tabs in one browser profile does not create three identities.

## Reproducible live sequence (three people)

1. Each participant creates their own personal profile; upload a profile image only with consent. Host creates a new private Circle named “HackTX live demo”. Other two open its invite link and join **before** starting the voting round.
2. In Chat & AI, send: “Coffee and board games tomorrow after 6 PM in Austin?”; “I'm in, around $40 per person”; “Sounds good—check opening hours.” Select those messages, explicitly consent, and run live Muse Spark extraction. Show cited evidence and the editable proposal. Accept it into Ideas.
3. In Discover, search real places using the natural-language query “Coffee and board games in Austin under $40 per person”. Show SerpApi sources; choose/save a venue or create a **saved/private** activity. Drag right, then left on another available card; use Undo. Do not publish QA activities into the global feed.
4. Return to the private Circle. Start an Everyone round once all three members and ideas are present. Each participant physically votes yes for the agreed idea, independently. Allow up to five seconds for polling. Show aggregate progress until all finish, then the unanimous match.
5. Run live planning using that matched idea and a future date. Explain the real venue source, uncertain hours/cost, and any available route. A model-generated plan is still proposed.
6. All three explicitly approve the plan. Show the final approval changing it to confirmed. Each chooses RSVP separately. Open Plans, select the appropriate day in the seven-day calendar, then export the ICS. Export downloads a file; it does not send invitations.

The API acceptance runner `scripts/submission-smoke.mjs` performs this actual three-session sequence with real providers and private QA records. It verifies data, not a substitute for a recorded UI interaction. Run once deliberately; provider calls consume credits. Local named rehearsal uses `REHEARSAL=true` and original local photos, and refuses remote targets.

## Short shot list (aim for 2–3 minutes; confirm sponsor duration separately)

| Shot | Capture | Narration |
|---|---|---|
| 1 · 15 s | Three chat messages → selected-message extraction → cited proposal | “Muse Spark turns our conversation into an editable idea.” |
| 2 · 20 s | Real venue search, source, photo-led discovery | “SerpApi grounds suggestions in places we can investigate.” |
| 3 · 15 s | Real right/left drags and Undo | “Each person chooses independently.” |
| 4 · 25 s | Three independent votes, progress, unanimous reveal | “A match reflects saved votes, not a model guessing agreement.” |
| 5 · 25 s | Live itinerary result, venue and uncertainty | “AI handles coordination; people retain the decisions.” |
| 6 · 20 s | Three approvals; final confirmation; optional RSVP | “A proposal becomes a plan only after everyone approves.” |
| 7 · 15 s | Seven-day calendar and ICS download | “The group leaves with a concrete next step.” |

Record at native resolution. Start each take after images settle. Do not film keys, terminals, cookie files, debug tools, personal conversations or unrelated browser tabs. Trim network waiting time with an honest cut; never splice a fixture response into a live-AI claim. Retake failed actions rather than implying they succeeded. Local capture files belong under ignored `test-results/submission/`; review them before uploading. Public video/upload and submission are owner actions.

## Safe showcase reset

Stop the managed showcase with Ctrl-C. Run `npm run showcase:reset`, then `npm run showcase`. The reset refuses production, unknown databases and an active showcase server; it creates a timestamped backup, preserves the three standard photos, restores known scenarios and moves untouched examples to upcoming dates. It affects only `data/showcase/ditto-presentation-showcase.sqlite`. Do not point reset at Railway or the live rehearsal DB. Reopen or refresh all three showcase browser sessions after resetting; select the intended identity in each.

## Backup and troubleshooting

- Keep `data/showcase/` backed up privately with its three photos and database. A new clone does not include these photos.
- If Wi-Fi/providers fail: switch to the local populated showcase and play an already-recorded **real** AI clip. Clearly say the live service is unavailable. The no-AI sample draft can demonstrate approval mechanics, not model quality.
- If a swipe is intercepted by Safari history navigation: start inside the card, or use mouse dragging/arrows/buttons. Do not change OS gestures during judging.
- If a vote seems missing: wait one polling interval, refresh the same session, check the active round and member roster. Do not start a new round mid-demo.
- If a model call fails: check server configuration, provider billing/model access and network. Do not expose keys on screen. Retry once; then use the truthful backup.
- If the public service fails: use the local showcase and existing recording; inspect Railway health/logs afterward. Never reset production to make the demo look populated.
- If a plan does not confirm: every eligible member must approve; changing a plan clears prior approvals. RSVP is separate.
- If the calendar looks empty: navigate to the plan's actual future date; confirmation and date must both match.

## Before approaching judges

Verify the public URL in a fresh browser, all three sessions, invite membership, one small live provider request, future date, audio/screen recording, battery and backup clip. Close private windows and debugging panes unrelated to the demonstration. Keep the pitch factual: no Supabase, no automatic reservations, no fabricated consensus, no guaranteed venue availability.
