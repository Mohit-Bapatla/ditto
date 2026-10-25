# Final technical audit

Date: 2026-10-25. Method: independent source audit following Impeccable audit instructions. Primary scope: `app/page.tsx`, `app/consumer.css`, `app/discovery.css`, `app/swipe-surface.tsx`. Read `DIRECTION.md`, the relevant global cascade, layout imports and swipe tests to resolve behavior. No application edits, browser actions, build or test reruns performed. Main agent owns rendered/device evidence. Scores below are provisional source-audit judgments, not WCAG certification or measured runtime performance.

## Implementation integrity verdict

**Pass, with one accessibility correction needed.** The implementation follows the product-specific immersive invitation direction: one active physical card, inert next-card preview, explicit interest-versus-RSVP copy, truthful venue/inspiration labeling, and one transaction path for drag, keyboard and buttons. The installed detector returned `[]` for `app/page.tsx app/swipe-surface.tsx`; raw output is `technical-detector.json`. Zero deterministic findings and zero false positives. CSS files were inspected directly rather than passed as markup targets. Static detector cleanliness does not validate layout or accessibility.

## Audit health score

| Dimension | Score | Key evidence |
|---|---:|---|
| Accessibility | 2/4 | Selected filter text is absent from its accessible name; other major controls have labels, native dialog and focus treatment |
| Performance | 3/4 | Motion values drive transforms; only active drag/exit has will-change; runtime frame rate unmeasured |
| Theming | 3/4 | Core semantic colors are tokens; some surface/overlay colors remain literals; light theme is the declared design |
| Responsive design | 3/4 | Fluid card dimensions, safe-area navigation and 44–56px decision controls; long-content and native touch remain verification gaps |
| Implementation integrity | 3/4 | Coherent transaction/photo system, but unmatched modal overrides create cascade drift |
| **Total** | **14/20 — Good** | Source findings require targeted correction; rendered validation remains separate |

## Findings by severity

Verified findings: **P0 0 · P1 1 · P2 0 · P3 1**. Responsive risks below are not counted as proven rendered failures.

### P1 — Filter button's accessible name omits its selected visible label

- **Location:** `app/page.tsx:785`.
- **Category:** Accessibility; WCAG 2.5.3 Label in Name.
- **Evidence:** The button's visible text becomes the selected category (`Outdoors`, `Food`, etc.), while its explicit `aria-label` remains `Filter activities`. The accessible name therefore does not contain that visible text. This follows directly from source and the accessible-name precedence rule; no browser measurement needed.
- **Impact:** A voice-control user asking to click the visible category cannot reliably address that control by its displayed name. Screen-reader users also miss the selected category at this entry point.
- **Recommendation:** Use `Filters: ${category}` as visible text and accessible name, or retain a stable visible “Filters” label with current selection in a description. Let the text content name the button where possible.
- **Suggested command:** `$impeccable harden`.

### P3 — Consumer dialog overrides target an unused class

- **Location:** `app/consumer.css:55` and the mobile `.modal` rule; `app/page.tsx:141`.
- **Category:** Implementation integrity/theming.
- **Evidence:** `Modal` renders `<dialog>` without `className="modal"`. Thus new `.modal` border/shadow rules and mobile max-height rule cannot apply. The old `dialog` rules in `app/globals.css:1515` and `:2654` remain authoritative, including the mobile bottom sheet with square bottom corners.
- **Impact:** The stylesheet advertises dialog behavior it does not implement. Later changes to intended dialog sizing can silently fail. Existing dialog scrolling, focus containment and Escape still work by native semantics; this is not a blocked modal finding.
- **Recommendation:** Target `dialog` consistently or add the intended class, then verify the chosen presentation on mobile.
- **Suggested command:** `$impeccable polish`.

## Responsive risks requiring rendered verification

These are specific source risks, not measured failures and not added to the issue counts:

1. **Long venue/host text:** `app/discovery.css:25–28` has no `overflow-wrap:anywhere`, host row shrink constraints or truncation strategy. The title explicitly has wrapping protection but the venue and host do not. `app/page.tsx:1914` accepts a manual meeting place without a frontend maximum length, and profile names allow 80 characters. An unbroken long host/venue string can exceed the caption width, which is then clipped by `.outing-card { overflow:hidden }`. Test 80-character unbroken names and long venue text at 375px; add wrapping/min-width constraints if reproduced.
2. **200% text scaling/long title:** The caption is absolutely positioned inside a fixed-height, overflow-hidden card (`discovery.css:15,22,49`); it cannot make the card grow. At larger text settings its content can collide with photo labels or extend above the card. Test the accepted 120-character title with venue/host at 200% text sizing. A growing card or readable fallback flow is preferable to hiding essential identity.
3. **Short screens:** Mobile card minimum height is 380px, and group cards have a 280px minimum. Short landscape windows necessarily require scrolling; do not claim an always-visible dock for every height based solely on the `svh` formulas. Validate the declared 390×844 and laptop targets separately.

Suggested follow-up if reproduced: `$impeccable adapt`, followed by `$impeccable polish`.

## Measured static checks and positives

Computed WCAG sRGB contrast from actual token values (solid background pairs only):

| Pair | Ratio |
|---|---:|
| Muted `#716570` on paper `#fff9fa` | 5.31:1 |
| Rose `#e11d48` on white | 4.70:1 |
| Yes `#08753d` on white | 5.80:1 |
| No `#bd2428` on white | 6.09:1 |

These pass AA normal-text contrast. Photo-overlaid text contrast depends on the actual image, caption height and scrim position and was not pixel-measured in this audit.

- Decision buttons explicitly use 56×56px, undo 44×44px, details min-height 44px, and navigation min-height 48px desktop/60px mobile. This confirms declared CSS targets, not their final rendered bounds.
- SwipeSurface uses `touchAction: pan-y`, horizontal intent discrimination, pointer capture, pointer cancel/lost-capture cancellation, and new window blur/document-hidden cancellation. It uses a synchronous ref lock to gate duplicate submissions. Blur only cancels an active pointer gesture, preserving an in-flight saved vote.
- Reduced motion intentionally removes rotation, springs and flyout, replacing commit with a short opacity transition. CSS removes the confirmation pulse. No global near-zero animation kill is used.
- Focus handoff preserves card keyboard focus without taking focus from action buttons. Current nav state uses `aria-current`; category choices use `aria-pressed`; preview is both inert and aria-hidden.
- Native `<dialog>` supplies modality and Escape; explicit close control is named. Status/error regions are provided for saves and failures.
- Images report real venue attribution or clearly labeled illustration; image load failure exposes a fallback instead of a broken-image icon. Active and preview images intentionally load eagerly; only two deck images render. No evidence of an unbounded eager image list in this deck.
- Motion transforms do not perform per-frame layout-read loops; `will-change: transform` applies only while dragging/exiting. Local fonts avoid external font fetches.

## Test evidence boundaries

Inspected `tests/swipe-interaction.test.ts` and `tests/swipe-gesture.test.ts`. The interaction tests mount the actual React component in JSDOM and dispatch synthetic mouse events carrying pointer properties. They cover progressive movement, spring return, save-before-exit, duplicate requests, failed retry, vertical intent, cancellation, nested controls, key repeat, disabled state, focus handoff and the new blur cancellation. Geometry and pointer capture are mocked; `matchMedia.matches` is always false. Therefore these tests do **not** prove native touch gesture arbitration, native pointer capture, visual clipping, real reduced-motion behavior or assistive-technology operation. No separate document-hidden event or lost-pointer-capture regression is present in the inspected test file.

The parent reports core tests/build/integration/multiuser pass; this audit did not independently rerun or certify those results. Physical phone Safari/Chrome and screen readers remain explicitly untested. No browser overlay/live server was used because the main agent was capturing the shared browser. No temporary audit server or app changes require cleanup.

## Recommended actions

1. **P1 — `$impeccable harden`:** Fix the category-dependent filter accessible name.
2. **Validation — `$impeccable adapt`:** Exercise long content, text scaling and short-screen cases before declaring responsive completion; fix only reproduced overflow.
3. **P3 — `$impeccable polish`:** Align dialog selectors with markup and the chosen mobile dialog presentation.

Re-run the focused audit after fixes; source review and rendered gesture evidence serve different purposes.

## Resolution addendum — 2026-10-25

Verified current source after the implementation follow-up: `app/page.tsx:142` now gives the native dialog `className="modal"`, so the reported unmatched consumer selectors are resolved. The filter control now uses `Filters: all activities` by default and `Filters: ${category}` when selected. Both visible “Filters” and selected category text are included in the corresponding accessible names, resolving the reported label omission and default-state consistency concern. These are source confirmations, not new rendered or assistive-technology tests. The original score/counts above remain an archive of the pre-fix audit.

Design documentation was generated from the confirmed replacement direction and actual current implementation in root `DESIGN.md` and `.impeccable/design.json`. No pre-existing files were found at either target. This is a light-theme specification; no dark-theme support or native-device verification is claimed.
