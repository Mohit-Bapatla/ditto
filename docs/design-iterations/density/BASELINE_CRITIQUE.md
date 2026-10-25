# Density baseline — independent design and layout assessment

Method: independent visual assessment; no detector output read or mechanical scan run. Read the user’s density/social-content attachment and installed Impeccable `reference/layout.md`, using the previously read critique rubric. Inspected the current `rebuild/after/{discover,circles,plans,profile}-{1440,390}.png` files. No app edits. These saved screenshots represent different session states (Maya profile, one Circle, an approved demo plan); no claim that all frames depict one synchronized session. Other viewport widths, focus order, errors, and gestures require implementation QA.

## Verdict

The current interface has a recognizable brand and strong central photograph, but its desktop topology is a phone experience surrounded by empty space. Other screens alternate between sparse account information and a long technical document. This is a product-information problem as much as a spacing problem: reducing padding alone cannot create people, current decisions, or a reason to return.

The new user request changes the acceptance bar. Previous bounded fixes resolved clipping and chat placement; they did not establish a populated social experience. Preserve the physical card, the clear rose identity, source attribution and transaction semantics. Rebuild the supporting composition with real, authorized records and deterministic isolated fixtures.

## Layout assessment

| Dimension | Rendered baseline evidence | Design consequence |
|---|---|---|
| Reading order | Discovery’s photo clearly wins the squint test, but there is no secondary social region. Circles puts its Join banner on almost equal footing with the only group. Plans begins with a generic large title and explanatory prose before actionable plan details. Profile gives “Your session” visual weight comparable to the person. | Preserve photo primacy; give secondary attention to actual decisions and people, not onboarding or infrastructure. |
| Grouping | Circle name, avatars and counts belong together, yet its trailing demo label and open arrow sit far away on a very wide row. Profile interests and budget are isolated vertically. Plans scatters date, approval status, participants and RSVP across a long document. | Group each decision’s identity, status and action; use compact metadata lines before adding more panels. |
| Rhythm | Desktop Circle row and large pink invite block are followed by hundreds of empty pixels. Profile’s sparse left column has large intervals despite tiny content. Plan stops repeat several paragraphs at generous spacing. | Use 4–8px for metadata, 12–16px within a meaningful block, 20–24px between blocks, 28–32px between true sections; keep 44px interactive targets. This is a proposed scale, not a new measured invariant. |
| Structure | Discovery is one narrow column at 1440. Circles is a stretched list with only one item. Plans exposes an expanded itinerary and editing/approval information as the default collection view. Profile is half person, half session administration. | Use a three-region Discovery workspace, a Circle collection, a Plans overview with drill-down, and a personal/social Profile. Each screen needs a distinct topology. |
| Density | Discovery’s informative content is confined to about 550px of a 1440px screen. Circles contains one group and one large invitation ad. Profile has two interests but a full technical section. Plans has substantial text, but low useful information per vertical inch. | Optimize useful decision content, not raw text count. Empty space can remain around the swipe path while bounded side regions contain relevant information. |
| Adaptation | Mobile Discovery is appropriately singular; moving its desktop support regions into phone sidebars would be a regression. Circles and Profile fit width but have little to scan. Mobile Plans requires a long scroll to reach RSVP/calendar and saved activities. | At 1440 use meaningful columns; at 1024 collapse lower-priority support; at 768 use a main region plus drawer/disclosure or a linear sequence; at 375–430 retain one task column. Verify DOM/focus order when CSS reorders regions. |
| Extremes | Saved Plans frame includes a test title “Undo acceptance.” Long-title risks were previously found. Full-page images show fixed navigation across document content; this alone is not proof of inaccessible content. No genuine empty-state image is in this reviewed set. | Use deterministic natural fixtures; test long names, zero versus many records, all filters empty, pending/error states, scrolling past bottom nav, zoom and keyboard focus. Never infer extreme-state success from populated screenshots. |

## Highest priorities

### P1 — Desktop Discovery has no social context or useful secondary task

**Evidence:** central image/card and dock are the entire body, with broad blank flanks. “With Alex QA” is the only human signal in the current photo frame.

**Change:** introduce a compact left rail for category/filter controls, quick Circle choice and a bounded popular-activity list; retain the central immersive card; place genuine recent member activity, active decisions and upcoming relevant plans at right. Use section headings plus plain rows, not a stack of equal dashboard tiles. Give the middle card the largest visual mass and preserve motion clearance. Avoid fake “live” dots or arbitrary activity counts.

**Acceptance:** at 1440 a user can answer “What is this outing?”, “Which group needs me?” and “What are my people doing?” without leaving Discovery. Every support row points to a real action/state. At 390 none of these supports crowds the vote dock.

### P1 — Circles lacks the identity and planning state needed for a social collection

**Evidence:** one wide Weekend Crew row, four initials, “4 ideas,” then a 157px-tall pale invitation banner. There is no current planning subject or pending-vote cue.

**Change:** show the four authorized fixture Circles as a responsive collection with distinct representative covers or purposeful identities, name, actual member avatars/count and one useful status line. Examples must come from seeded data: “Vote on 6 ideas,” “2 of 3 finished,” or a named plan. Keep Create and Join as compact header/supporting actions. One card style is appropriate for equivalent Circles; do not add gratuitous layout variation.

**Acceptance:** desktop shows several distinguishable groups and their next action at once; phone cards retain name, people and status without reading an essay. Long group names wrap naturally.

### P1 — Plans is a detailed document before it is a useful overview

**Evidence:** one expanded plan takes most of the 1632px desktop capture; saved activity appears only at the bottom. The mobile approved-plan view is about 1766px tall, with RSVP/calendar late in the flow. Its title “Your next good memory” gives less information than the actual itinerary.

**Change:** make Upcoming plans, Interested activities and Awaiting decisions separate recognizable sections. Upcoming cards should show representative photo, concrete title, date, Circle and true attendance/approval status with a clear primary action. Keep full stops, repeated caveats and editing in a detail surface. Saved activities remain compact photographic rows. Past appears only if supported. Show no whole-page empty illustration when any useful section contains records.

**Acceptance:** first desktop viewport contains a meaningful overview across relevant sections, and mobile reaches its first plan action before traversing every stop. Approval must never be represented as reservation or RSVP. Preserve prominent truthful warnings where they affect commitment; consolidate repeated explanatory text rather than deleting it.

### P1 — Profile makes infrastructure more prominent than social identity

**Evidence:** “Your session,” browser persistence explanation, demo switcher and connected services occupy nearly half the desktop content. Only name, city, two interests and budget describe the person; Circle memberships are absent.

**Change:** show a compact avatar/name/city/edit header, interests and preferences, budget, then actual memberships and appropriate saved/participation context. Move session details, services and sandbox switching into Settings or Developer tools. Keep clear sample-environment identification, but do not use the whole Profile to explain browser storage.

**Acceptance:** a glance identifies what the person likes and which groups they belong to. Editing remains easy. Settings remain reachable without being the focal screen.

### P1 — Sparse, inconsistent test content undermines the design

**Evidence:** “Alex QA,” “Undo acceptance,” one Circle, and only two visible interests make the view feel like testing infrastructure even when styling is tidy. A rich plan and a near-empty Circle collection do not form a believable social system.

**Change:** deterministic, isolated sample data for Mohit/Edwin/Paxton, the four named Circles and 30–40 ordinary activities. Derive visible social signals from stored actions and explicit fixture state. Separate presentation fixtures from regression-test records. Preserve fictional metadata and persistent sample-environment context; never manufacture production approvals, schedules or RSVPs.

**Acceptance:** refresh and fresh sessions reproduce the intended sample state; real users and multiplayer records remain untouched. Demo content is socially coherent and transparently sample, while real venue identity and prices remain sourced.

### P2 — Small gray metadata and large pale areas weaken scanning

**Evidence:** several useful labels are tiny and subdued, while generic page headings and pink Join/service treatments consume more attention. The overall field is extremely pale and the interface’s apparent density is lower than its element count.

**Change:** use strong body contrast for time, location, plan state and names; reserve quieter text for provenance and tertiary help. Keep pink mostly for meaningful selection/action accents. Use photo variation and genuine content to create texture. Do not increase density by shrinking text or touch targets.

## Spatial thesis

**Primary path:** see an appealing activity → express interest → act with a Circle → review a plan → independently approve/join. Each surface should advance a different step, with honest state visible where a decision occurs.

**Relationships:** activity identity/time/place/people/action belong together. Circle identity/membership/current decision belong together. Plan date/status/attendance/action belong together. Profile identity/preferences/memberships belong together. Settings and sample-environment controls are separate supporting utilities.

**Leader and support:** Discovery’s photo leads; narrow, low-chrome supporting lists inform it. Circle covers identify groups, while current status provides meaning. Plans emphasizes the nearest actionable item, then saved ideas and unfinished decisions. Profile emphasizes the person and relationships.

**Density and rhythm:** aim for several meaningful items per desktop region, not one oversized card or an infinite feed. Bound support lists to a handful with “View all” when needed. Mix compact rows with focal photographic cards only when content roles differ. Use modest section separation and tight internal metadata grouping. Do not use blank space to simulate luxury or fill it with ornaments.

**Responsive model:** desktop Discovery approximately 200–240px left support, a flexible 440–560px center and 260–300px right support where the container permits; these are starting relationships, not fixed requirements. Below three-region capacity, drop the low-priority rail into a filter/Circle drawer and move relevant social content below or behind a clearly labeled destination. Mobile remains a single card and vote dock. Circle grid becomes a one-column scannable collection; Plans and Profile become deliberate ordered sections. At 1024, prefer two coherent regions over three squeezed ones.

**Input and extremes:** the center must retain free physical gesture motion, keyboard arrows, buttons, snapback and transaction locks. Supporting controls cannot cover its pointer path. Long titles, missing images, many Circles, zero matches, retry states and enlarged text require natural reflow. A short phone may scroll secondary information; it must not lose its primary action behind navigation. Rendered widths and measured bounds should be used together, avoiding the earlier screenshot-only gutter false positive.

## Critique lenses

**Strengths:** recognizable Ditto mark/rose accent; photographic invitation as one gesture target; four clear navigation destinations; meaningful distinction between interest, group approval and RSVP in copy.

**Cognitive load:** baseline has low choice count but high interpretation/scroll cost. More relevant choices can improve this product. Group the new support by task and limit visible rows; do not blindly enforce fewer than four categories if hiding them increases navigation cost.

**Emotional journey:** Discovery creates desire but no sense of an active community. Circles drops into emptiness after one row. Plans shifts from anticipation into administrative reading. Profile ends in infrastructure. The improved journey should reinforce “these are my people, this is what we might do next,” backed by actual or explicit sample records.

**Persona risks:** a returning member cannot see which Circle needs a vote; a first-timer sees testing terminology and may not trust that the service is active; a mobile user must scroll a full itinerary to reach key plan actions. A privacy-conscious user needs confidence that friend activity is authorized and sample identities are clearly isolated.

## Verification contract for the build

Capture all four screens at 375, 390, 430, 768, 1024 and 1440 with stable coherent fixtures. Compare both first viewport and full page: useful content per region, photo dominance, earliest actionable plan, group differentiation and removal of technical Profile emphasis. Test zero/one/many records, long labels and missing imagery. No screenshot can substitute for physical drag, failure recovery, persistence, multiuser voting, approvals and RSVP/calendar regression. No deployment is authorized.

Questions skipped: the user supplied explicit topology/content requirements; this is an assigned independent baseline report for the builder’s synthesis.
