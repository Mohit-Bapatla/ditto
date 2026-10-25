# Ditto design system — working contract

Ditto helps friends independently choose real activities, agree, and make a plan. Mobile discovery is an **Operate** surface with an expressive photographic object. It is not a marketing landing page or dashboard.

## Deliberate skill use

Read `.agents/skills/impeccable/SKILL.md` and `.agents/skills/ui-ux-pro-max/SKILL.md` for significant frontend changes. Impeccable context loaded successfully; its audit and craft-floor references informed the current pass. Eight installed skills were inventoried: Impeccable, UI/UX Pro Max, design-system, design, brand, ui-styling, slides and banner-design. Slides/banner work is irrelevant to the current product interaction. No hooks or additional tools were installed.

UI/UX Pro Max queries `social activity discovery editorial` and narrowed `consumer discovery app` returned landing-page structures and broad enterprise styling. Those recommendations were rejected rather than persisted as Ditto’s visual authority. Its exact `dragging movements` result supports visible button and keyboard alternatives. Next.js `client components` guidance supports a later narrower client boundary. No verified Motion-specific database result was found; existing Motion code and its documentation govern gesture mechanics.

## Visual roles

- Warm paper `--paper: #f7f5f1`; white card `--surface`; charcoal `--ink: #20221f`; secondary `--muted: #64685f`.
- Coral `--accent: #c9432d` identifies the brand and general creation actions. It does not mean an affirmative vote.
- `--vote-yes: #08753d` and hover `#065d31`: affirmative decision control and DITTO stamp. White label contrast exceeds 4.5:1.
- `--vote-no: #bd2428`: PASS stamp. Color is always accompanied by text and direction.
- Edge feedback uses `--vote-yes-edge: #138650` / `--vote-no-edge: #c93835`. Tint is confined to the dragged card.
- Discovery photo → activity title → venue/time/price → host. Preserve authentic provider photos; label stock imagery as illustrative. No generated venue substitutes.
- Utility typography remains the existing system sans; the activity title uses Georgia in the current implementation. Figma controls explore DM Sans; this font difference is explicit and is not claimed to be a pixel-identical full-screen design handoff.
- Spacing uses 4/8px increments where practical; interactive targets at least 44px, decision controls 52px. Responsive gutters 16px phone, larger desktop. Keep clear safe-area space under bottom navigation.

## Swipe state contract

Idle → dragging → saving → exiting → next persisted activity. Below threshold → spring back. Failed request → same card, actionable error, retry. Only one in-flight transaction. Right means positive/interested; left means negative/pass. Round consensus and privacy remain backend-owned.

Horizontal intent starts after 8px and must exceed vertical distance ×1.25. Distance acceptance is 24% of card width, clamped 64–110px. A deliberate flick needs at least 32px and recent velocity of 0.65px/ms. Old release velocity expires after 100ms. Transform rotation follows displacement; reduced motion removes rotation and uses a brief acceptance fade. Mouse, touch pointer events, focused arrow keys and buttons share one commit function.

Figma: https://www.figma.com/design/oiko126O5vL4IajWJunzQR
Current Figma scope: semantic swipe colors, six editable decision variants and a state specification. Broader three-direction screen exploration and full design-library expansion remain separate work; this artifact is not described as those completed deliverables.

## Validation rules

For each significant UI change: capture 390px and MacBook, compare relevant production references, critique hierarchy/photography/type/density, repair the biggest problems, then capture again. Passing lint/build is necessary but never sufficient. Physical-device gaps must be named. Preserve APIs, polling, persistence, approvals, RSVP and calendar export. Never deploy without approval.
