# Ditto interface audit — 2026-10-25

## Implementation integrity: partial pass

The swipe interaction now expresses Ditto’s actual product: an individual decision becomes a persisted multiplayer vote. The surrounding application is not yet a fully cohesive consumer design. Desktop promotional filler and Circle headings still compete with the task. This is an Impeccable **technical audit**, with a separate screenshot assessment; it is not the skill’s independent dual-agent critique.

Sources: installed Impeccable 4.7.0 `context --target app/page.tsx`, `reference/audit.md`, source inspection, current local production build and real pointer input in the in-app browser. Supporting screens are documented in `../design-references/DESIGN_RECOVERY.md` and its before/after library. No production deployment or additional paid provider calls occurred in this audit.

| Dimension | Initial score / 4 | Evidence |
|---|---:|---|
| Accessibility | 2 | Labeled alternatives and live errors exist, but replacing a focused card lost arrow-key focus. Fixed and regression tested. Full VoiceOver audit remains open. |
| Performance | 3 | Motion values update transforms directly; next photo is preloaded by preview. Broad permanent will-change and a monolithic client page remain optimization opportunities. |
| Theming | 2 | Root tokens exist; many historical raw colors remain. Green/red vote semantics were missing from buttons. Shared vote tokens now cover both decks. Light theme only; no dark theme claimed. |
| Responsive | 3 | Actual mouse drags at 375/390/430/1440; earlier layout coverage at 320–1440. Pan-y, directional intent, capture/cancel handlers exist. Native touch/Safari not verified. |
| Integrity | 2 | Stable backend-linked cards, real provenance when available. Desktop promotional panels and mixed photo treatment weaken coherence. |
| **Total** | **12/20 — significant work remains** | This is a scoped audit score, not a WCAG certification. |

## Findings, prioritized

- **P1 — Keyboard focus lost after commit** (`app/swipe-surface.tsx`, both parent decks). A keyboard user could vote once, then had to tab back to the next card. Fixed with a shared focus handoff ref and layout-effect cleanup. Browser verified two successive arrow votes; automated test ensures button focus is never stolen. Recommendation: Impeccable harden.
- **P1 — Touch acceptance evidence incomplete** (swipe surface). Pointer handling is touch-compatible, vertical scrolling is preserved in CSS and handlers, cancellation is tested. The available browser CDP bridge rejects touch injection; viewport emulation and MouseEvents marked touch in jsdom are not physical-device evidence. Real iPhone Safari and Android Chrome remain a release gate. Recommendation: Impeccable adapt.
- **P2 — Decision semantics conflict** (`app/discovery.css`, discovery controls). Red affirmative control contradicted progressive green DITTO feedback. Fixed: shared green Ditto actions, red PASS stamp, readable text in addition to color. Recommendation: Impeccable colorize.
- **P2 — Group imagery lacks visible provenance** (`app/group-voting.tsx`). A generic arcade photo accompanies Bowling. Alt text said inspiration, but sighted users could infer an actual venue. Fixed with visible “Illustrative photo.” No synthetic venue assets added. Recommendation: Impeccable clarify.
- **P2 — Design-token drift** (`app/globals.css`, `app/discovery.css`). Legacy raw colors and overlapping CSS overrides remain. Vote colors are now semantic tokens; broader migration remains. Recommendation: Impeccable extract.
- **P2 — Desktop and Circle content density** (`app/page.tsx`). Promotional sidebars and large headings delay the actual activity. See real 1440 and group screenshots. Subsequent screen work should replace filler with real group progress or remove it. Recommendation: Impeccable distill.
- **P2 — Large client boundary** (`app/page.tsx`). UI/UX Pro Max Next.js guidance favors smaller interactive leaves; this app still carries most screens in one client module. Do not refactor transaction orchestration during the P0 gesture fix. Recommendation: Impeccable optimize.

Detector output contained one advisory: `bounce-easing`, discovery.css’s old cubic-bezier. Inspection found it was overridden by the new Motion rule, so it was not an active animation bug. Removed dead CSS. The requested physical spring is retained deliberately; a detector preference does not override the interaction brief.

## Screenshot assessment and iteration

`../design-iterations/skill-audit/discover-before-390.png`: the photo and light metadata block have a clear hierarchy; the green action was missing, the dock was visually inconsistent, and long titles must continue to fit without shifting the next card. `discover-before-1440.png`: the deck is usable with mouse/keyboard, but generic rail copy contributes no decision information.

Largest scoped fixes: consistent green decision action, keyboard continuity, truthful group photo label. Rendered after captures and held red/green frames accompany the test report. The full application redesign is not declared finished by this audit or a passing build.

Positive findings to preserve: real venue provenance, stable activity IDs, frozen group rounds, server-confirmed transitions, recoverable failed saves, accessible click alternatives, touch-safe vertical intent, reduced-motion fade, and private votes until everyone finishes.

Next sequence: adapt on physical phones → distill supporting screens → extract remaining shared tokens → polish after rendered inspection. Re-run the audit after those changes. These follow-up commands are already within the authorized design work; no new permission is needed except production deployment.
