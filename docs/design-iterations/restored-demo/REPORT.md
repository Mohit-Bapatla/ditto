# Populated demo restoration — October 25, 2026

## Root cause and evidence

No fixture removal occurred. `ae26afa` introduced the 36-activity presentation fixture and four Circles; `6dc0d77` documented it. Later `73cde09` added persistent sample plans and photo-related polish. The latest `3d10130` adds persisted Undo and custom activities while retaining those fixtures. Production seeding was separately made explicit in `e9a3a87`; that guard does not disable opted-in local presentation mode.

The discovery-recovery QA preview used `/tmp/ditto-discovery-recovery.sqlite` and Recovery Alex. The normal default is `data/ditto.sqlite`, which is also not the photo-populated presentation graph. Cookies are hostname-scoped, not port-scoped, and fixture records are owner-scoped. Changing the port/DB/identity can therefore show different content without deleting the old content.

Read-only inspection found the complete original group in `/tmp/ditto-presentation-density-v2.sqlite`: Mohit, Edwin and Paxton with JPEG data URLs in their profile records, 36 fixture activities, four Circles, 16 proposed ideas, existing votes/interests/messages and five plans. A second copy exists in `/tmp/ditto-presentation-launch-phone.sqlite`. The original three Messages attachment JPEG files also still exist. We restored the already-cropped stored photos, byte-for-byte, rather than recreating or replacing them.

## Restoration and isolation

Used SQLite backup (including WAL contents) to create `data/ditto-presentation.sqlite`. The original source, default database, regression databases and Railway production were not reset or overwritten. All other owners in the copied database remain intact. Only the intended recovered sample owner is selected by the ignored local recovery configuration.

Recovery command already executed twice successfully:

```sh
node scripts/restore-presentation.mjs /tmp/ditto-presentation-density-v2.sqlite 789d15a8-18a7-4a71-9ed5-78f11f7a8c40
npm run dev:presentation
```

The first command refuses to overwrite a target DB or a different recovery configuration. The launcher uses `DITTO_PRESENTATION_FIXTURES=1`, the dedicated database and `DITTO_PRESENTATION_OWNER` from `data/presentation-recovery.json`. Only explicit presentation recovery shares this existing sample graph; ordinary/demo/production behavior is unchanged. Reopening creates a new session token, not new people, activities or Circles. Existing valid identities are not overwritten.

## Preview and content

- MacBook: **http://restored.localhost:3118/**. Fallback: http://127.0.0.1:3118/ (may have another existing cookie).
- Default identity: **Mohit**. Profile → Settings → Explore the demo switches to Edwin or Paxton.
- SQLite: `/Users/mohit/Documents/ChatGPT/ditto/data/ditto-presentation.sqlite`.
- Circle names: Weekend Crew, Build Break, After Hours, Side Quests. All retain their three members, preferences, proposals and round state.
- 36 original activities and representative local WebP images remain intact, including pickleball, bouldering, chess/coffee, bowling, arcade, hiking, badminton and food crawls.
- Activities are dated October 26–November 6, 2026, all future relative to this recovery. Five plans fall October 26–29. Dates did not need rewriting. Pickleball has three stored approvals and three RSVPs; the four other plans retain their incomplete approval states. No new confirmation was fabricated.
- Live providers are intentionally paused by the local presentation launcher. Existing AI/venue integrations remain unchanged. This pass did not make paid provider calls.
- No iPhone-accessible URL is active: this server binds loopback only. No public tunnel or Railway deployment was created. Mobile rendering was tested at 390px; no new physical-phone verification is claimed.

## Verification

Passed lint, typecheck, production build and all 55 unit/interaction tests. Extended the presentation test to prove recovered sessions share only the configured group, use separate tokens, create no duplicate entities and reject a missing owner. Ordinary isolated sessions remain isolated.

Passed full integration, multiplayer, discovery-recovery and profile-photo API acceptance against a **separate** `/tmp/ditto-restoration-regression.sqlite` server: voting, approvals, RSVP, ICS permissions, both Undo directions, failed/duplicate saves, custom activity privacy/sharing, and photo upload/fallback/persistence.

On the recovered preview, verified all 36 activity records, original three stored photos, four Circles and five future plans; confirmed-state approval counts; calendar export; every Circle opening; and sample identity switching. Real browser pointer dragging on pickleball, Undo and refresh returned the card correctly. A fingerprint of full profiles, activity state and Circle state was identical after stopping and restarting the presentation server with the original cookie. Original source photos match the recovered stored bytes. Re-running recovery preserves the existing data.

Actual rendered screenshots, kept local and excluded from Git because they show the supplied photos:

- `test-results/restored-demo/discover-desktop.png`
- `test-results/restored-demo/circles-desktop.png`
- `test-results/restored-demo/plans-desktop.png`
- `test-results/restored-demo/plans-mobile.png`
- `test-results/restored-demo/approved-plan-mobile.png`
- `test-results/restored-demo/profile-mobile.png`
- `test-results/restored-demo/sample-identities-mobile.png`
- `test-results/restored-demo/swipe-restored-mobile.png`
- `test-results/restored-demo/discover-mobile.png`

The latest Undo, custom activity and discovery code remains in place. No production deployment, database reset, private-photo publication, or repository visibility change was performed.
