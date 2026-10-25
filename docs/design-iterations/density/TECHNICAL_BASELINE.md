# Density overhaul — technical baseline and fixture boundary

Read-only independent review, 2026-10-25. Scope: the latest density brief in the user attachment; Impeccable `reference/layout.md`; current page/consumer/discovery source; SQLite schema; session/state/action paths; and existing integration/privacy tests. No application edits or browser actions. Layout interpretation must be synthesized with the other reviewer's independent rendered assessment before implementation.

## Mechanical layout scan

Ran the installed command exactly:

```sh
.agents/skills/impeccable/scripts/impeccable detect --json --scope layout app/page.tsx app/consumer.css app/discovery.css
```

Result: exit 0, JSON `[]`, **zero findings**. Raw output is `layout-detector-baseline.json`. No rule names, locations or false positives to adjudicate. CSS files were included as requested, but this is a markup-oriented detector; manual cascade review supplies CSS evidence. A clean result does not demonstrate good density, photo quality, reading order or touch behavior. No ignore file exists.

### Verified source constraints to change deliberately

- `app/discovery.css:3,40,253`: Discover caps at 520px/580px and its grid is block flow. A 1440px screen cannot have a three-region discovery composition under these rules. Add a wide-screen grid with a bounded dominant center and purposeful supporting rails; leave the phone single-card model intact. Use a separate intermediate breakpoint rather than only the existing 760/761px split.
- `app/consumer.css:124–128`: Circles uses a vertical flex list capped at 850px; the current join tile is a separate padded block. This is structurally incompatible with the newly requested desktop group collection. Introduce an actual responsive collection and reduce join to a compact action while preserving membership/invite controls.
- `app/consumer.css:262–263`: Plans remains capped at 800px. The data grouping matters more than widening it: upcoming/proposed/interested are distinct states. `app/page.tsx:1406` already suppresses the large empty state when either shortlist or plans exists; preserve that guard while adding section-specific emptiness.
- `app/consumer.css:306`: Profile is two columns, but the second is settings. Change the content hierarchy to interests/membership/preferences; move infrastructure and sandbox tools behind a separate settings/developer disclosure without deleting their functionality.
- `app/discovery.css:214`: Undo uses CSS `order:-1` while source order is Pass, Undo, Ditto. That creates visual versus tab-order disagreement. Reorder DOM to match the intended decision dock if touching this block.
- Swipe clipping/stacking is intentional: card overflow clips photo/feedback, page overflow clips flyout, and the next card is inert. Supporting rails must not intercept drag or place live controls under the moving card. Keep the focus and server-save sequencing contract in SwipeSurface.
- Long-name wrapping was added near the bottom of discovery.css; retain it. Verify caption text scaling rather than assuming fixed-height photography accommodates arbitrary text.

No rendered geometry or contrast measurements were taken in this pass. The required 375/390/430/768/1024/1440 screenshots and actual gestures remain the main agent's verification work.

## Existing persistence and privacy contract

| Boundary | Current evidence | Preserve |
|---|---|---|
| Database | `lib/db.ts:17–23`: DATABASE_PATH defaults to data/ditto.sqlite; one global connection per process | Choose isolated database before importing db; changing env in a live process does not switch its cached connection |
| New sandbox | `createSession` creates random owner/token, four demo people, one circle, six activities in one transaction | Keep this default behavior for existing regression tests |
| Browser continuity | `/api/state` reuses HttpOnly/SameSite=Lax `ditto_session`, max-age 30 days, Cache-Control no-store | Refresh must not reseed or reset votes |
| Demo resources | `requireMember` requires membership plus matching demo owner; `accessibleActivity` rejects another owner's demo activity | Every fixture circle/activity must retain demo:true and correct owner |
| Identity switching | Action switch requires profile owner to equal session owner | Never share a fixed fixture owner/profile IDs across unrelated sessions |
| Private votes | `circleState` returns viewer's vote only; yes/match aggregates appear only after the whole round completes | No raw vote, other-person vote, or premature aggregate in new social rails |
| Plan confirmation | `planState` derives status from approvals for eligible members | Setting status in seed JSON cannot legitimately confirm a plan |
| Personal profile | Editing a demo person clones a new non-demo ID; shared circles require non-demo profile | Do not copy sample memberships or decisions into the new real profile |
| Live providers | Disabled unless ALLOW_LIVE_PROVIDERS=true | Presentation setup should explicitly leave provider calls disabled |

Activities with demo:false are returned across owners by design. Consequently, forgetting the demo flag is a privacy leak, not a cosmetic labeling issue. Demo invite joining is denied; do not weaken that rule to make sample people appear multiplayer.

## Recommended opt-in fixture design

1. **Explicit presentation mode with isolated storage.** Add a documented server-only flag, for example `DITTO_PRESENTATION_FIXTURES=1`, plus an explicit separate DATABASE_PATH such as `data/presentation/ditto.sqlite`. Add a dedicated launch script that supplies these, binds localhost and disables live providers. Refuse fixture mode when the path is absent or resolves to the default DB. Keep default `createSession()` unchanged unless the opt-in mode is active. Do not put fixture creation in browser code or overwrite existing profile records by name.
2. **Deterministic template, isolated instance.** Version one fixture definition containing the exact three fictional/sample identities Mohit, Edwin and Paxton; four circles Weekend Crew, Build Break, After Hours and Side Quests; and the requested 36 activities. Use stable fixture keys for content mapping, but fresh random owner and secure session/invite tokens for each new sandbox. Stable local entity IDs can be owner-namespaced; they must not be shared globally. “Consistent across browser sessions” should mean equivalent starting content for independent sessions and persisted changes when the same session cookie returns, not merging unrelated sandboxes.
3. **One atomic initialization.** Insert people, circles/members, activities, ideas and any explicit sample state in the existing transaction. Record fixture version/keys and a fixture anchor date in data-layer metadata or a dedicated metadata record. Initialize only for a new sandbox; never reapply on every state read. Preserve user edits and decisions across refreshes. Upgrading fixtures should create an explicit fresh sandbox, not silently overwrite one.
4. **Anchor scheduling once.** Store the chosen reference instant when the sandbox is created; derive deterministic relative future dates from it and persist them. Allow an explicit fixture date for reproducible screenshots/tests. Never recalculate dates from Date.now on every read. When old fixtures expire, show truthful past states or explicitly reset the sandbox; do not silently roll committed dates forward. Use location areas and “meeting place to be decided”; no invented venue opening hours, reservations or exact prices represented as verified facts.
5. **Explicit provenance.** Retain demo:true on people/circles/activities and source:'demo' on sample plans. Add typed optional fixture metadata (version/key, sample schedule, estimated cost, representative-image provenance) if needed. A consistent sandbox-level sample label can replace intrusive repeated badges while keeping the data boundary intact. Do not claim a representative photo is a named real venue. Record source/license for locally cached assets separately.
6. **Believable sample state without commitments.** Seed a small, explicit set of interested participation and yes swipes to populate the viewer shortlist; no attending rows. Four circles can have distinct legitimate data states: ideas only, an incomplete round, a completed round with fixture votes, and a proposed plan. Any sample decisions must be actual persisted fixture rows and clearly sandbox-only. Prefer proposed plans with eligible members but no approvals or RSVPs; never invent confirmed live plans to fill the screen.
7. **Keep production tests on baseline.** Run existing integration/multiuser tests against a separate fixture-disabled server/database. Do not mutate their expectations to accept the populated seed. Add fixture-specific tests in a fresh process/DB with the flag on. Restart when changing DATABASE_PATH because the connection is globally cached. Existing browser cookies are host-scoped, not port-scoped: separate ports alone do not isolate session cookies; use separate browser contexts/profiles or distinct local hosts to avoid cross-server cookie replacement during QA.

### Data model adaptations

- Categories are limited to Outdoors/Food/Sports/Games/Arts/Music/Fitness; map all 36 activities into those instead of inventing unsupported categories. Use tags/descriptions for movies, coffee, hack nights and thrifting. Capacity is the supported group-size ceiling; add optional recommended size metadata only if the UI needs a range.
- Circle has no cover/interests fields today. Add optional typed metadata or a frontend mapping from stable fixture keys for sample covers; do not key identity by array index or rename-driven string matching. For real circles, derive identity from actual ideas/interests or use initials until a real cover exists.
- Person.avatar is currently a string used directly in JSX. Initials/emoji fixtures work immediately; image avatars require an explicit render/type change rather than dropping URLs into the field and displaying them as text.
- State exposes only the current viewer's activity status/swipe. It does **not** authorize publishing friends' private saves. Use circle membership, message timestamps, idea creators, round.completed/total, proposed plans and post-completion match totals for live social signals.
- Swipes and participation have **no timestamps**. Do not label their array order “recent” or add invented “2h ago” labels. Add a timestamp schema/migration plus explicit sharing policy before implementing real friends' save chronology, or use clearly named sample-only social records bound to the current demo owner.
- A sample social projection must be generated server-side from current owner-scoped fixture records and omitted for non-demo viewers. Never attach data from a global fixture owner to live users. Fixture metadata must not override requireMember/access checks.

## Regression assertions to add for fixture mode

- New sandbox has 3 demo people, 4 demo circles with exactly those members, and 36 unique activity fixture keys. Two sandboxes have equivalent template content but disjoint owners/entity IDs.
- Sandbox B cannot access A's demo activity/circle, switch to A's profile, join A's demo invitation, or see A's sample social projection.
- Reusing a session after refresh/server restart preserves swipe, identity and edited state without duplicate seeds; unrelated new session gets the equivalent unmodified fixture template.
- An incomplete round returns no other member's vote and no yes/match aggregate, including any new sidebar/social endpoint. Completed rounds expose only the existing sanctioned aggregates.
- Seed participation remains interested, attending totals are zero, approvals/RSVPs are empty, and sample plan status is proposed. Viewer actions change those states through normal routes.
- Editing a demo profile creates a real identity without inheriting fixture memberships, private votes or social projections. The demo owner restriction still prevents cross-sandbox visibility.
- Flag off yields the existing four-person/one-circle/six-activity baseline and current integration expectations. Fixture DB setup never touches default or production DB.
- Frozen fixture anchor produces stable dates/order; failed transaction rolls back completely; no provider request is made during fixture creation.

## Action priority

1. Implement the opt-in owner-isolated fixture template and tests before deriving social density.
2. Build rail/section selectors exclusively from the authorized state projection; document any new sample-only metadata.
3. Change wide/tablet topology while preserving mobile card, semantic DOM order, 44px controls and gesture contracts.
4. Complete rendered comparisons and rerun the layout detector after implementation; then perform polish. The zero-finding baseline is not visual acceptance.
