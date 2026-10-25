# Ditto showcase

## Start after reopening the Mac/repository

```sh
npm run showcase
```

Open **http://showcase.localhost:3120/**. Use **http://127.0.0.1:3120/** if your browser cannot resolve `.localhost`. The dedicated hostname avoids cookies from other previews. Starts as **Mohit**. No login or new account is needed. Stop with Ctrl-C. The command verifies the database version and activity image files, seeds only when absent, and starts the existing Next.js app. It does not reset your work.

Use this command instead of `npm run dev`, the older presentation preview, or `localhost:3000`. Those intentionally use different configurations. Node 22.13+ and installed dependencies are required (`npm ci` once on a new checkout).

## Commands

| Command | Effect |
|---|---|
| `npm run showcase` | Verify and start the persistent local showcase on port 3120 |
| `npm run showcase:seed` | Initialize if missing; otherwise preserve existing records and refresh only expired, unedited fixture schedules |
| `npm run showcase:reset` | **Stop the server first.** Back up the showcase, discard its test mutations, restore the known baseline and dates |
| `npm run showcase -- --lan` | Opt into same-Wi-Fi access; prints this Mac's actual network URL |

Reset is deliberate and local-only. It refuses to run while the managed server is active, against an unrecognized database, with a different dataset version/owner, or with production configuration. Running seed twice does not duplicate profiles, Circles, activities, votes or plans. Reset keeps stable fixture IDs and the standard profiles' latest stored JPEG uploads. Custom records are test mutations; their images and all other prior state remain recoverable in the pre-reset database backup.

## Data and media

All paths below are relative to this repository and persist across builds, server restarts, Mac restarts and Git branch changes:

- `data/showcase/ditto-presentation-showcase.sqlite`: active SQLite database, including custom images and uploaded profile photos.
- `data/showcase/media/mohit.jpg`, `edwin.jpg`, `paxton.jpg`: stable local copies of the original profile crops; refreshed from the standard profiles' latest uploads before reset.
- `data/showcase/backups/before-reset-*.sqlite`: consistent SQLite backups including committed WAL contents.
- `public/activities/*.webp`: original representative activity imagery, already version controlled.
- `showcase_meta`: internal dataset version (`1`), owner and creation time.
- `showcase_schedule`: original schedule values and relative day offsets; edited dates are never silently overwritten.

The old recovered `data/ditto-presentation.sqlite` contained multiple independent sample owners and their accumulated history. It is preserved. This showcase reuses the original 36 fixture definitions and imports only the three photos from its explicitly selected recovery owner. Nothing is removed from the old database. The source `/tmp` databases are no longer needed for showcase operation. Private photos, active databases and backups are ignored by Git; retain `data/showcase/` in your local backups. A new machine without those files can seed the same scenarios, but will correctly show initials until the original photos are supplied.

Dates use **America/Chicago**, matching Ditto's Austin calendar, with daylight-saving handling. The baseline places activities over the next seven local days at 6 PM. On startup/seed, expired fixture schedules advance only if the stored start still matches their last seeded value. Swipes, approvals, RSVP records, custom activities, uploaded photos, and edited dates are preserved. Reset deliberately rebuilds the next seven days.

## What's included

- Mohit, Edwin and Paxton, with the available original uploaded photos.
- Weekend Crew, Build Break, After Hours and Side Quests; all three people are members.
- 36 original activities, local representative photos, budgets and descriptions.
- Four saved interests, four Circle conversations and four open voting rounds. Edwin has completed the current sample round; Mohit and Paxton still have their own votes.
- Historical unanimous votes supporting four sample proposals. **Bouldering session** and **Bowling with the crew** each have three actual approval rows and three RSVP rows in the isolated database. Pickleball and Sunset hike remain pending with one approval each.

All statuses come from the existing backend. There are no fake client matches, frontend-only votes, reservations, or fabricated production commitments. The ordinary Undo, custom activity, consensus, approvals, RSVP and ICS endpoints are used.

## Identity switching and independent sessions

Go to **Profile → Settings → Local showcase** and choose Mohit, Edwin or Paxton. The notice identifies the plans and decisions as samples. These developer controls stay in Settings.

For multiplayer, open the URL in a **different browser/profile or private window**. A second ordinary tab shares the first tab's cookie; it is not an independent user. Each fresh browser gets a different secure random session token pointing at the same showcase group. Switch that second session to Paxton. Switching one session does not change another session's identity. Only the three stable showcase IDs are accepted; personal accounts and unrelated IDs are rejected. A real personal profile created while testing cannot be impersonated through the showcase switcher.

## Two-to-three-minute hackathon walkthrough

Prepare two browser sessions: normal as Mohit, private/another browser as Paxton. Start from a reset baseline for a predictable demonstration.

1. **0:00–0:25 — Discover:** show Mohit's photo and drag an activity right. Tap Undo, then drag left and Undo again. These actions persist through the actual API.
2. **0:25–1:05 — Decide together:** open Weekend Crew. Show Edwin and Paxton's photos. Vote on the four ideas: Ditto on pickleball, pass the others. In Paxton's independent session, make the same choices. Edwin's baseline votes are already stored; completion reveals the real match.
3. **1:05–1:50 — Plan and approve:** open Matches, select the supported activity and choose **Create a plan from your matches** (the template option; live providers are paused). Review the date and itinerary. Approve it as Mohit, Paxton, and Edwin (use Settings to switch one test session to Edwin). Once all approve, the backend marks it confirmed.
4. **1:50–2:20 — Calendar:** open Plans, select the plan's day in the seven-day calendar, expand it and export the `.ics` file. The export downloads a file; importing it into a personal calendar is a separate user action.
5. **2:20–3:00 — Your own idea:** Discover → `+`, enter a title and description, choose Weekend Crew, and save. It appears as a real Circle idea for the next round. Venue/time/budget may remain undecided. Mention the two already approved example plans and their participants.

## iPhone on the same Wi-Fi

Stop the default loopback server, then run:

```sh
npm run showcase -- --lan
```

Use the printed `http://<Mac-LAN-IP>:3120/` URL in iPhone Safari, **not** `localhost` or `showcase.localhost` (those would refer to the phone). Keep the Mac awake and both devices on the same trusted Wi-Fi. The phone gets its own session; choose Paxton in Settings for collaboration with Mohit on the Mac. The LAN option exposes the sample group and supplied profile photos to devices that can reach that Mac/port. Stop it with Ctrl-C when done. Do not port-forward it or put it behind a public tunnel.

If Safari cannot connect, check that both devices use the same network and that macOS permits this development server's incoming connections. Some guest/hackathon Wi-Fi isolates clients; use a trusted network that permits device-to-device access. HTTP LAN preview does not provide HTTPS-only PWA/install or camera-permission behavior; it is for app interaction testing. No new physical-iPhone test was performed in this implementation pass.

## Isolation and migration policy

Showcase uses the existing app with explicit `DITTO_SHOWCASE=1`, `DITTO_PRESENTATION_FIXTURES=1`, a fixed showcase owner, and its dedicated database path. The launcher disables live providers and supplies empty provider credentials. It creates no invitations to real recipients, emails, SMS, reservations or external calendar events.

The guard rejects production `NODE_ENV`, Railway/Vercel markers, CI, nonlocal configured origins, live-provider activation, alternative database paths and symlinked storage. Runtime validation happens **before opening the database**. Normal production receives no showcase setting and no showcase data. This is a development environment, not a public deployment mode.

Current schema changes are additive (`CREATE TABLE IF NOT EXISTS`). Unknown showcase versions fail closed; a future incompatible version needs an explicit, backed-up migration that preserves user changes. Never handle a version mismatch by deleting the database or silently reseeding. Stable UUIDs derive from versioned fixture keys. Do not alter the v1 key namespace for a cosmetic or additive change.

## Recovery from a reset backup

Stop the showcase. Preserve the current `data/showcase/` directory in your backup location first. Choose the desired `before-reset-*.sqlite`; it contains all former accounts, sessions, custom records, photos and choices from this isolated database. Use SQLite's backup API to restore into the stopped target (rather than copying a live WAL database):

```python
import sqlite3
source = sqlite3.connect('file:data/showcase/backups/CHOSEN-BACKUP.sqlite?mode=ro', uri=True)
target = sqlite3.connect('data/showcase/ditto-presentation-showcase.sqlite')
source.backup(target)
target.close()
source.close()
```

Replace `CHOSEN-BACKUP.sqlite` with the actual backup filename. Start with `npm run showcase`; the version/owner checks run again. Media copies remain available, and current profile photos also live inside the restored database.

## Verification

See `docs/design-iterations/showcase/REPORT.md`. `node scripts/showcase-test.mjs` performs deliberate mutations against an explicit local showcase, including real voting, approvals and custom creation. After it passes, stop the server, run `npm run showcase:reset`, then start again for the baseline demo. Run normal integration/multiplayer tests only against a separate non-showcase test database.
