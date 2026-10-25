# Assessment A — Discovery design review

Method: independent design assessment A. No detector output read or detector run. Target: `/Users/mohit/Documents/ChatGPT/ditto/app/page.tsx`. Reviewed actual saved 390px and 1440px screenshots, plus a fresh background browser tab at `http://localhost:3102/` without resizing. Browser currently showed the next Games card; visual structure matched the saved captures. Source inspection covered Discovery and SwipeSurface. Scores combine visual evidence with source-supported behavior; this review did not exercise or certify drag gestures, backend mutations, dialogs, or network failures. No ignore file content was returned by the conditional read.

## Design specificity verdict

**Partially product-specific interaction inside a category-interchangeable shell. Rebuild the visual composition.** The physical yes/no deck is recognizably Ditto, but the interface frames it as a component in an administrative dashboard. A beige sidebar, muted terracotta CTA, restrained green button, thin separators, scattered brand slogans, and a serif card title could serve a travel wishlist or restaurant template unchanged. The many earnest lines about real life tell the brand promise instead of letting a vivid activity and visible people make it felt. The visual quality is tidy, not broken; its specificity and emotional energy fall below the consumer identity requested.

At desktop, the actual image occupies only roughly one tenth of the full saved frame. A sidebar plus top bar plus title band plus category band delays the card until y≈294. At mobile the picture begins at y≈193, with almost a quarter of the initial viewport used before the experience starts. Photography is the strongest material on the page but receives less authority than the application shell.

The opportunity is one coherent, photo-dominant consumer experience with compact chrome, saturated functional color blocks, confident sans typography, and motion that makes the card feel held in the hand. Vibrant & Block-based plus Motion-Driven should change the composition and visual grammar, not merely add bright colors to the existing shell.

## Heuristic scores

| # | Heuristic | Score / 4 | Evidence and limitation |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Active navigation and category are clear; desktop deck count, save phases, toasts, and loading state exist. Mobile hides the helpful deck count/hint from the captured first viewport; successful-interest meaning arrives after the decision. |
| 2 | Match with real world | 2 | Date and price are useful, but “Good food. New friends.” plus “Venue to be decided” does not name a concrete outing. “Ditto” and “0 of 8 going” do not establish whether a tap saves interest or reserves attendance. |
| 3 | User control and freedom | 3 | Source supports undo pass, filter changes, reset deck, dialog close/Escape. Only the last pass has explicit undo; affirmative interest reversal is not available beside the deck. |
| 4 | Consistency and standards | 3 | Navigation and buttons are orderly; arrow-up-right used for internal activity details suggests an external destination. Serif card title and sober dashboard shell have competing personalities. |
| 5 | Error prevention | 3 | Source locks in-flight swipe submissions, excludes nested controls from dragging, and springs back on failed/insufficient gestures. Pre-decision copy does not explain that Ditto is interest rather than RSVP. |
| 6 | Recognition rather than recall | 2 | Main vote buttons and bottom navigation are labeled; search, create, filter, details, and undo rely on icons visually. The mobile first viewport does not teach dragging. |
| 7 | Flexibility and efficiency | 3 | Source offers pointer dragging, buttons, keyboard path and reduced motion. Desktop content density and delayed card position squander the larger display; no interaction-speed testing performed. |
| 8 | Aesthetic and minimalist design | 2 | Card hierarchy is legible, but repeated Circle promotions, slogans, shell bands, and footer compete for space. Minimal-looking does not equal task-focused. |
| 9 | Error recognition and recovery | 3 | Source includes connection advice, initial retry, local failed-vote text and snapback preserving the card; some server errors fall through to generic wording. Error states not visually tested. |
| 10 | Help and documentation | 1 | Desktop has a small gesture hint, but mobile lacks that in the captured viewport. No visible explanation of Ditto versus joining; the most important clarification is deferred to a toast. |
| **Total** | | **25/40** | **Acceptable — significant improvements needed.** |

All ten apply to this task-oriented product. Usability score is not an endorsement of the rejected identity.

## Cognitive load

**Moderate: 3 of 8 checklist failures.**

- Single focus: fail on desktop. A green Ditto action competes with a wide terracotta “Plan with your Circle” CTA, plus “Open your Circle” in the sidebar.
- Chunking: fail. Desktop shows eight category alternatives in one undifferentiated row; mobile shows five plus a separate filter button.
- Grouping: pass. The date, cost, title and host stay with their photo; voting controls are adjacent.
- Hierarchy: pass for basic discovery, weak for brand. Photo is the strongest element once reached.
- One thing at a time: pass. Only one foreground activity is being evaluated.
- Minimal choices: fail. Eight category options plus filters form a >4-option decision point. This is a navigation scan rather than eight equally important tasks, so it merits reduction/progressive disclosure rather than an absolute ban.
- Working memory: pass on current evidence. Activity essentials persist while deciding, though missing venue information forces uncertainty rather than recall.
- Progressive disclosure: pass. Filters and details are separate; they should remain secondary.

The central vote is pleasantly binary. The extra load comes from the surrounding product introduction and imprecise consequence of that vote, not from the two buttons.

## Emotional journey

Entry: quiet, careful, institutional. The tiny warm logo and muted background communicate restraint; little suggests the spontaneity of deciding to go out.

Anticipation: the food image creates an immediate sensory peak, then the generic title and undecided venue reduce confidence. “0 of 8 going” makes the social promise feel empty even though the state is honestly labeled demo.

Decision: clear green positive action provides an easy next move, but an unfamiliar user can hesitate over what they are agreeing to. Mobile lacks a visible teaching cue that the picture itself is the flagship interaction.

After-action: source provides a useful reassurance toast (“Saved to your interested list. Join when you’re ready.”) and physical exit motion. This is the right moment for a small, fast confirmation; do not turn every vote into confetti or a modal. Move the consequence explanation before the first vote too.

End: source empty state says “You’re all caught up” and offers filter changes or revisiting. It solves mechanical depletion but does not give the session an emotionally meaningful end, such as reviewing the activities already saved. This last impression risks making discovery feel like consuming a queue.

## Strengths to preserve

1. Authentic photographic material is the main attraction. The photo crop has enough detail and scale to create desire, and “Illustrative photo” makes the demo provenance honest.
2. The deck makes one decision at a time. Large labeled Pass and Ditto buttons give a discoverable fallback to dragging; preserve their common submission path and transactional protection.
3. Navigation stays compact and understandable on mobile, with four labeled destinations. The redesign can build on this instead of inventing a novel navigation system.

## Priorities

### P1 — Rebuild the shell around the activity, not the dashboard

Why: desktop looks like an app template containing an event card; mobile spends 193px before the picture. This is the central gap against the requested consumer identity.

Fix: collapse desktop header/title/location repetition and remove the duplicate Circle promotions from Discovery’s focal region. Make the card or its photographic region occupy the majority of the meaningful viewport, with concise navigation and tightly integrated categories. Use saturated blocks for deliberate control zones, a strong single sans typographic system, and a distinctive Ditto mark/gesture language. Do not solve it with an oversized marketing headline. Suggested command: `$impeccable shape` then `$impeccable bolder`.

### P1 — Make the decision concrete and explain its consequence

Why: “Good food. New friends.” is a slogan, not the outing identity. “Venue to be decided,” a precise late-night date, illustrative food and “0 of 8 going” present little firm evidence for a real commitment. Users should not learn what Ditto means only after pressing it.

Fix: lead with the real activity/venue name when known; keep category and expressive copy subordinate. Show time, price, locality and people as one compact decision layer. For honest demo states, use a persistent but unobtrusive demo cue. Explain once, close to the action: Ditto saves interest; joining is a later choice. Never invent venue proof or attendance. Suggested command: `$impeccable clarify`.

### P1 — Make the physical gesture visible at first encounter

Why: the captured mobile view reads as a static image card followed by two buttons. Source motion is capable, but that capability is not visible in the resting composition. It cannot supply the identity if users never discover it.

Fix: incorporate a short contextual left/right gesture cue, visually evident stack depth, and a restrained first-use gesture demonstration that stops after interaction and respects reduced motion. Preserve continuous pointer tracking, progressive PASS/DITTO color feedback, rotation, threshold snapback, and backend-confirmed fly-out. Validate on actual touch and mouse; this review does not certify them. Suggested command: `$impeccable animate`.

### P2 — Give social context one useful job

Why: two Circle promotions repeat a sales pitch while the activity has only a tiny initial avatar and zero attendees. The app promises people, yet the active decision contains little useful human context.

Fix: use only true information about the host, saved interest or Circle connection, located beside the decision it informs. Move broad Circle education to onboarding or the Circle destination; do not manufacture social proof. Suggested command: `$impeccable distill`.

### P2 — Finish the mobile viewport as a complete interaction

Why: the saved mobile view contains the main buttons but clips the lower demo notice against fixed navigation and omits the desktop drag hint. At a shorter live desktop height, the bottom of the card also falls below the viewport. Finishing a card should not require hunting for the action zone.

Fix: budget the photo, essential metadata and action row against available viewport height; reserve safe-area space above navigation. Keep caption/provenance readable without adding another band. Show details via a clear internal “Details” affordance rather than an external-link-style arrow. Test short screens and long titles, not only 390px width. Suggested command: `$impeccable adapt`.

## Persona red flags

**Jordan, first-timer:** sees “Ditto,” “0 of 8 going” and a heart together; cannot confidently tell whether the gesture joins an event, saves it, or votes for a group. The clarification toast is too late. On mobile the draggable nature is not taught within the initial viewport.

**Sam, distracted mobile user:** image creates interest, but the generic title and undecided venue force a details visit before deciding. Controls sit low and dense against bottom navigation, with provenance partially obscured. One-handed interaction needs a complete photo-to-action composition.

**Alex, frequent user:** source offers keyboard and gesture accelerators, which is a strength. Desktop wastes space on repeated Circle acquisition messages and repeated location/heading chrome each session. A repeat user needs the next activity immediately, not repeated persuasion to use another feature.

## Minor observations

- Small low-emphasis metadata is aesthetically quiet but may be harder to scan outdoors. Contrast was visually judged only; no numeric contrast claim is made.
- The disabled undo button looks like stray low-contrast chrome. Keep it available after a pass, with clear focus and accessible name.
- The serif title contributes an editorial hospitality tone, but it conflicts with the requested vibrant consumer identity; typography should be selected as a system, not merely swapped in isolation.
- Eight categories may reasonably be available overall. Only the currently relevant subset needs prime visual space; preserve reachability.
- Photo fallback exists in source. It should receive a purposeful graphic identity without implying a fictional real venue.

## Questions for synthesis

- If every sentence about “real life” disappeared, would the screen itself still feel social and immediate?
- What true information about this particular outing is compelling enough to replace generic promise copy?
- Can the complete first decision—from seeing the photo to understanding Ditto—fit in one glance on a short phone?

Questions skipped in this isolated sub-report: parent owns user-facing synthesis and follow-up. No application files edited; only this requested research artifact was written.
