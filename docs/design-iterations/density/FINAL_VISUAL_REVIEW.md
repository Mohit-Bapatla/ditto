# Density implementation — independent visual review

disposition: fix

Scope: inspected all 24 actual captures under `density/after/`: Discover, Circles, Plans and Profile at 375, 390, 430, 768, 1024 and 1440. Read `measurements.json` and narrow source context in `density.css` and `social-context.tsx`. No detector output, browser operations or application edits. This is visual/layout evidence, not interaction, data-isolation or accessibility certification.

## Density verdict

**The core density overhaul works.** At 1440, Discovery’s formerly blank flanks now contain category controls, four Circle entry points, three activity suggestions, two Circle messages, active decisions and a truthful no-upcoming-plan state. The photographic card remains the strongest visual element. At 1024 the right region collapses and the left region remains; at 768 the central experience stands alone. Phone does not inherit sidebar clutter.

Circles is now a recognizable four-group photographic collection rather than a lone row and oversized invitation banner. Plans exposes saved activities and a pending proposal beside a compact zero-upcoming state; it does not invent confirmations. Profile foregrounds membership and saved activities while moving infrastructure into a separate settings mode. Natural activity names and consistent sample context replace the prior QA presentation artifacts.

This is a substantial structural improvement, not merely less whitespace. The remaining work is a bounded hierarchy/phone-density refinement; no rebuild is warranted.

## Three highest-impact actionable problems

### 1. P2 — Mobile Discovery loses its decision explanation behind the navigation band

**Evidence:** in all three phone captures the card ends near y=760 and the three action buttons near y=824; navigation begins near y=830. “Swipe to decide. Ditto saves interest, not an RSVP” is no longer visible in the initial interaction region, although it is visible at desktop/tablet. The extra sample-context strip increases chrome without a corresponding photo-height budget adjustment. Buttons remain visible; this is discoverability/consequence clarity, not a claim that voting is blocked.

**Fix:** reserve the gesture/explanation line within the card-and-dock viewport budget. Reduce the phone card height just enough to fit the dock and its concise explanation above the fixed navigation. Preserve the top sample-environment identification; avoid solving it by hiding truthful state. Keep 44px targets and the large photo.

**Acceptance:** at 375/390/430 and a short-phone height, photograph, primary caption, three controls and one readable interest-versus-RSVP explanation all appear before bottom navigation. No dependency on scrolling to understand the vote.

### 2. P2 — Mobile Plans buries the action that advances the group

**Evidence:** phone order is empty Upcoming → four saved activities → Awaiting group decisions. The pending “Coffee, chess, and a proper break” proposal begins below approximately y=900, after the user has passed an entire saved list. In the wider view the pending proposal is visible beside the saved list, so the loss is caused by responsive reading order rather than insufficient content.

**Fix:** when a group proposal awaits this user’s action, order it before the saved list on narrow screens; keep confirmed upcoming plans first when present. Present the empty Upcoming state as a small line/block, not a large section that precedes all actionable content. Maintain DOM/focus reading order rather than relying only on CSS visual reordering. Preserve the distinction between group approval and RSVP.

**Acceptance:** the first phone viewport exposes the actionable pending proposal, its approval status and entry action. Saved activities remain easily reachable below. If no pending action exists, do not leave an empty priority slot.

### 3. P2 — Profile repeats the same facts instead of spending its height on social life

**Evidence:** the identity card shows Austin, Sports/Food/Games and $25 budget, then “Your kind of outing” repeats all three below memberships. On phone, the tall avatar/name/metadata card stretches roughly y=270–638; only one Circle row enters the first viewport. The Settings link also occupies its own full row above the identity. The new social content is valuable, but repeating unchanged information delays it.

**Fix:** compact the mobile identity into an avatar/name/city row plus one concise interests/budget group and the existing profile action. Move Settings to a quiet header action. Remove the duplicate preference table or make it a real edit/details disclosure only when it contributes additional information; do not invent preferences merely to fill it. On desktop, preserve the useful identity-versus-social split while eliminating duplicate facts.

**Acceptance:** the first mobile viewport shows a complete identity and multiple membership entries, with each preference fact presented once in the default view. The personal-profile action and settings remain accessible.

## Seven layout dimensions

- **Reading order:** Discovery photo still leads. Circles name/cover/status groups scan clearly. Plans tablet/desktop parallel structure is effective; phone proposal ordering is the remaining priority issue. Profile needs the duplication fix above.
- **Grouping:** photos, titles and costs are grouped well in saved rows. Circle avatars and count stay with their identity. Discovery repeats the same two Circle statuses in left “Your Circles” and right “Decide together”; roles differ but future refinement could make the latter explicitly actionable. This is secondary to the three fixes, not an expanded backlog.
- **Rhythm:** desktop support rows have useful consistent intervals. Large pink placeholder blocks are gone. Circle cards remain more spacious than lists, appropriately reflecting cover-led identity. Phone Profile is the main avoidable vertical expansion.
- **Structure:** three/two/one-region Discovery adaptation is deliberate; other screens use distinct collection/list/profile structures. This avoids a dashboard-template treatment.
- **Density:** materially better across desktop. Density comes from meaningful stored/sample content rather than ornaments. Phone Circles is a long but scannable photo collection; no need to shrink it into tiny cards just to fit all four at once.
- **Adaptation:** 375 headings wrap naturally; 768 two-column Plans has some title wrapping but remains readable; 1024 Discovery retains the left support region; 1440 exposes full context. Measurements report no horizontal scroll excess and no broken images at all six widths. This does not prove clipping/focus behavior, so no broader claim is made.
- **Extremes:** reviewed current populated/sample state only. Empty upcoming plans is compact and truthful. Long arbitrary titles, no-photo states, large memberships, errors, zoom, real touch and keyboard ordering remain regression responsibilities. Fixed navigation appearing mid-document in full-page screenshots is not by itself evidence of blocked content.

## Preserve

Keep photo-first Discovery, the authoritative swipe transaction, intentional sample-environment labeling, varied Circle covers, compact truthful upcoming-empty state, independent approval/RSVP meanings, and the move of technical controls out of Profile’s main content. Do not address these three refinements by reintroducing fictional activity or dense mobile rails.

Questions skipped: the user authorized autonomous implementation and bounded review. This fix verdict is scoped to the three actionable visual issues above; it is not a request to reopen the entire design.

## Bounded closure — refreshed 390px captures

Current disposition: **ship for the three reviewed fixes**. This supersedes the earlier fix disposition at that scope; original findings remain above as history.

- **Discovery explanation — resolved.** Updated `after/discover-390.png` visibly places the complete swipe/interest-versus-RSVP line below the action dock and above bottom navigation. The photo remains dominant and all three controls remain visible. Parent additionally reports measured hint bottom 811px versus navigation top 830px at 375/390/430; this closure directly inspected only the requested 390px image.
- **Plans mobile priority — resolved.** Updated `after/plans-390.png` puts “Awaiting group decisions” and the pending proposal directly after the compact Upcoming empty state, before saved activities. Proposal identity and approval state are now visible in the first viewport.
- **Profile duplicated facts and tall identity — resolved.** Updated `after/profile-390.png` puts avatar, name and location together, reduces identity height, and exposes multiple Circle memberships in the first viewport. The repeated preference table is removed; the subsequent interests section offers photographic exploration rather than repeating city and budget. Settings remains reachable.

No serious regression observed within these three refreshed images. No additional aesthetic cycle requested. This closes the named visual fixes only; it does not extend screenshot evidence to unreviewed changed states, backend behavior, touch devices, accessibility or the full regression suite. Questions skipped as authorized.
