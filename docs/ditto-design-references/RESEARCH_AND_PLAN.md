# Visual evidence and implementation plan

Research completed before any UI changes, October 24, 2026 Central. Existing pack preserved. Requested CODEX_PROMPT.md / REFERENCE_CATALOG.md / DESIGN_SPEC.md / QA_MATRIX.md do not exist in this checkout; the complete user prompt plus README, DESIGN_AUDIT, REFERENCE_SOURCES, TEST_MATRIX and references.html define scope. Both user anti-pattern images were inspected.

## Actual evidence

See assets/reference-captures/manifest.json for individually sourced browser screenshots, grouped by product. Captures include official Tinder chat/match/interests, Partiful discovery/event/organizer, DoorDash entry/restaurant discovery/navigation, Luma discovery/event, Airbnb discovery and mobile search, and YC company pages. Mobile 390 and desktop 1440 variants where useful. Other captures use the initial 849px browser width. These are real public-page captures, not generated UI or copied application assets.

Limitations: Bumble supplied third-party image returned HTTP405; official guide accessible but a privacy overlay prevented reliable interaction and no authenticated native screens were collected. Thus the target of three Bumble product screens was not met. Tinder direct download navigation was browser-blocked; official gallery lightboxes were accessible. DoorDash store navigation did not expose a stable detail page. Airbnb desktop filter captures are explicitly marked uncertain; mobile search sheet was visually verified. YC captures are directory/positioning pages, not product interfaces. No login, purchase, RSVP, paywall bypass or competitor asset reuse. Reference images remain outside public/. Reference pages can change.

## Current app audit

| Screen | Observed issue | Redesign |
|---|---|---|
| Discover | Large heading, tall card and secondary promotional panels push primary actions below mobile fold; generic category photo is not a verified venue | Compact app heading; bounded photo deck; labeled pass/save/detail actions; immediate real-place search; honest photo provenance |
| Activity detail | Dense ungrouped paragraphs; long scrolling form and unclear join availability | Photo hero, facts grid, sticky primary action; disabled unavailable join, preserved withdrawal |
| Create activity | Venue search requires leaving the form and copying an address; description has no required client validation | Inline real-venue picker with photo preview; grouped required fields and sticky submit |
| Circles | Decorative stars occupy tile space instead of current status | Real member initials and actual round/plan status; explicit join/create |
| Circle ideas | Active voting is a grid; no gesture parity | One focused swipe card per unvoted idea; exact progress; review of saved votes |
| Waiting/matches | Excess decorative glyphs; no precise wait guidance | Completion count, honest unanimity/majority labels, concise next action |
| Plan setup/review | Long labels and flat paragraphs obscure sequence | Date header, itinerary timeline, vote rationale disclosure and explicit approval progress |
| Chat | AI controls compete with conversation; checkbox on every message looks like an admin table | Message rhythm, optional selection mode, anchored composer, separate opt-in review panel |
| Plans | Empty state generic; shortlist lacks practical prominence | Clear proposed/confirmed status and compact saved activity rows |
| Profile/onboarding | Long optional fields distract from name/city; internal key wording dominates | Required essentials first; optional details disclosure; concise session explanation |
| Global | Muted text low contrast, small text, repetitive rounded surfaces; spinner only | Warm neutral tokens, consistent 44px controls, skeletons, semantic state messages and focus indicators |

Baseline screenshots in baseline/ cover discovery at 320/360/390/430/768/1280/1440, profile, join, onboarding, circle ideas, voting, matches, chat, plan setup/review and creation. Isolated SQLite database, paid providers disabled. Existing backend: single Next.js client application with server-authorized API routes, SQLite, five-second polling, Meta/SerpApi adapters. Preserve all contracts; extend only where safe undo and selected venue provenance need server support.

## Design system

Warm porcelain #F7F5F1, white surfaces, ink #20221F, secondary #656961, strong coral #C9432D for accessible action text/background, pale coral #FBECE5, agreement lime #E3EEA1. No decorative gradients/orbs/glass. System sans stack for fast familiar UI, tightly set bold headings. 4/8/12/16/24/32/48 spacing; 10/16/24 radius; 44px target minimum. Only swipe deck and dialogs elevated. Desktop centered two-column workspace with useful circle context; mobile bottom navigation and safe-area-aware controls. Motion 160–240ms, reduced-motion respected.

## Functional priorities

P0: persistent navigation, onboarding/join continuation, accessible dialogs, discovery click/key/pointer parity and reliable writes, group swipe and exact consensus, approvals/RSVP/calendar, existing tests.
P1: venue photo/search/selection, safe pass-only undo, loading/error/empty feedback, responsive overflow and screenshot iteration, four independent session tests.
P2: notifications deferred. Calendar export already supported; no SMS, permissions or provider additions needed.

No production deployment or repository visibility changes. Work on codex/mobile-redesign in manageable commits. Regression tests use fixtures; at most one bounded local live smoke is useful after implementation, within existing authorization limits. Never run production mutation tests for this redesign.
