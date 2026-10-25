# Ditto: social density overhaul

The three-region Discover composition gives desktop users categories, Circle shortcuts and useful activity picks on the left; the physical swipe invitation in the center; and authorized Circle conversations, voting progress and upcoming-plan context on the right. At 900–1279px, the conversation rail collapses. Below 900px, the card stands alone. Mobile keeps bottom navigation.

Circles use photographic covers, member avatars, actual counts and planning state. Joining is a compact action. Plans separates upcoming, awaiting decisions, saved activities and supported past plans. Pending proposals and confirmed plans expand into the existing full review/approval/RSVP/calendar controls. Profile shows identity, interests, memberships and saved activities; session/provider/sandbox controls live in Settings.

## Isolated presentation setup

```sh
npm install
npm run dev:presentation
```

Open http://restored.localhost:3118 (or http://127.0.0.1:3118 if local subdomains are unavailable). The launcher binds only 127.0.0.1, disables live providers and writes **data/ditto-presentation.sqlite**. It does not modify data/ditto.sqlite or any deployed database. Stop with Ctrl-C. Do not enable presentation flags on production.

Without a recovery configuration, each fresh browser session gets its own random owner namespace, secure random session/invite IDs, and the same deterministic content template. Refreshing/restarting retains that session's votes and changes. Separate browser sessions intentionally do NOT share a sample graph; use personal profiles and real Circle invitations for actual cross-session collaboration. Cookies are hostname-scoped, not port-scoped—use different hostnames for simultaneous local apps.

The original fixture template contains fictional Mohit, Edwin and Paxton profiles; Weekend Crew, Build Break, After Hours and Side Quests; 36 structured activity ideas; four saved interests; four open rounds with one completed sample perspective; four sample messages; and one unapproved proposal. The later presentation-polish fixture adds four persistent sample plans: one has all three stored approvals and RSVPs; the others await approval. These are isolated sample commitments, not production attendance. The existing default four-person/six-activity starter remains unchanged when the flag is absent.

Dates are anchored once at session creation and then persisted; fresh sessions created on different days shift their illustrative dates. Content, activity order and sample choices are deterministic. Costs are planning allowances, not verified prices. All activity records carry `demo:true` and a versioned `fixture` metadata object. Representative photography never claims to depict an Austin venue. Sample notices appear in the first viewport, including after creating a personal profile in the same sandbox.

The backend requires both `DITTO_PRESENTATION_FIXTURES=1` and an explicitly named `ditto-presentation*.sqlite` database. Known Railway/Vercel deployment markers and non-local PUBLIC_ORIGIN are rejected. This is defense in depth; the local launcher is the supported setup, not a general production seeding tool.

## Evidence and design tools

- `before/`: actual previous implementation, all four destinations at six widths.
- `iteration-1/`: first implementation; review found mismatched photos and oversized plan editors.
- `after/`: final rendered implementation, measurements and physical gesture evidence.
- `index.html`: side-by-side comparison viewer.
- Independent Impeccable design and technical reviews are adjacent Markdown files. Questions skipped: the user authorized implementation and bounded iteration.
- UI/UX Pro Max actual `app-interface.csv` yielded interaction/navigation guidance, not social screen recipes. Searches and product-profile results are in `research/`.
- Existing Figma explorations remain at https://www.figma.com/design/oiko126O5vL4IajWJunzQR. The connected Starter tool quota was reached during the preceding rebuild; no upgrade or new Figma design was claimed. This iteration used actual rendered component exploration and screenshots.
- `public/activities/manifest.json` records local WebP sources, source pages where available, retrieval dates, license and representative usage. Unsplash's free-image license permits download and use; no Unsplash+ assets were used. These assets are app imagery, not a competing photo collection.

No deployment was performed.

## Recovered populated demo (2026-10-25)

The original photos and group are available in the recovered local database. See [restoration report](../restored-demo/REPORT.md). `npm run dev:presentation` reads ignored `data/presentation-recovery.json` when present, selecting that existing sample owner for fresh sessions instead of seeding another group. Sessions still have independent tokens and can choose Mohit, Edwin or Paxton in Profile → Settings. Changes to this explicit shared demo persist across browsers. Existing valid sessions are never forcibly reassigned; use the dedicated `restored.localhost` hostname to avoid cookies from unrelated previews.

The recovery script validates the original three sample profiles, 36 fixture activities and four named Circles, uses SQLite's WAL-aware backup, and refuses to overwrite an existing target or a different recovery configuration. Re-running it neither reseeds nor resets choices. Database files, photographs and recovery configuration remain ignored by Git. `PRESENTATION_PORT` can override the default 3118. The server is loopback-only; no iPhone/public URL is created by this command.
