# Round 1 independent composition review

disposition: fix

Scope: concept A (`prototypes/a.png`), `DIRECTION.md`, and all eight round-1 Discovery/Circles/Plans/Profile captures at 390 and 1440. Read `consumer.css`, `discovery.css`, and narrow source excerpts to diagnose visible defects. Background browser inspection was attempted at localhost:3104 but unavailable (`Browser is not available: iab`); screenshot evidence supports this visual verdict. No application edits, detector runs, or paid providers. No interaction or native-device certification.

## Direction judgment

Discovery now expresses concept A: a contiguous photographic invitation, lower white-on-dark caption, compact tools, circular decision dock and four-destination navigation. The warm dashboard and duplicate Circle marketing are gone. Rose wordmark and Syne lettering provide a materially different consumer identity; the near-white pink ground follows the direction. The Games photograph is implementation content rather than the coffee prototype, an appropriate adaptation to authoritative backend state. Budget in Details is intentional per the user’s metadata scope, not a defect.

Circles is appropriately a people list with one invite action. Plans uses compact photographic shortlist rows, distinguishable from the Discovery deck. Profile has clear account/session sections and sensible two-column desktop-to-single-column mobile adaptation. These are coherent with Discovery without gratuitously cloning its giant card. Plans captures contain shortlist items rather than a formed itinerary, so chronological itinerary, approval and calendar states remain outside this review.

## Top three actionable defects

1. **P1 — Discovery mobile card is cropped at the right edge.** In `discover-390.png` the photo starts 12px from the left but extends through the right edge; right-side corner/space is lost. Concept A retains 12px on both sides. The toolbar also crowds the create control at the edge. Constrain the deck, foreground/preview card and toolbar to the available inner width (`min-width: 0`, `width: 100%`, correct box sizing); do not hide the defect with overflow clipping. Accept when 375/390/430 captures show matching left/right card insets and no truncated tool controls.

2. **P1 — A stale fixed card height defeats the viewport composition.** The reviewed stylesheet has `.physical-stack .outing-card { height: 500px; ... }` after responsive height rules, overriding the height budget. The 390 capture’s photo is noticeably shorter than concept A’s dominant invitation, while its extra provenance footer crowds the fixed navigation; the same constant cannot assure the whole dock at short laptop heights. Remove the stale override and derive the card height from the complete chrome/caption/dock/navigation budget. Integrate the honest demo notice without adding avoidable vertical bands. Accept with a complete decision dock and readable gesture explanation above navigation at 390×844 and a short phone, and above the fold at laptop height. Parent reported removing the override after this capture; that change remains unverified until recapture.

3. **P2 — Profile fragments identity metadata vertically.** In both `profile-390.png` and `profile-1440.png`, the location pin sits alone on a line, followed by “Austin, TX”; interests and budget then occupy separate widely spaced bands. The result feels like detached form fragments rather than a compact personal identity, and pushes session content much lower on mobile. Put pin and location on one baseline, group interests and preferred budget as a concise metadata cluster beneath the name, and keep the creation action directly after that cluster. Preserve desktop’s account/session split. Accept when the identity reads as one group with no orphaned pin and mobile reaches session controls with less dead spacing.

## Keep

Preserve the contiguous photo gesture target, actual backend content and provenance, strong Syne title, truthful interest-versus-RSVP hint, red/green decision semantics, existing transaction lock, and distinct list structures for Circles and Plans. Do not restore the sidebar, permanent category band or marketing slogans while fixing sizing.

This is a bounded visual fix verdict on the supplied captures. It is not a full accessibility, motion, error-state or multiplayer approval.
