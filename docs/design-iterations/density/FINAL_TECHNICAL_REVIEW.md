# Final independent technical review

2026-10-25. Read-only review under Impeccable audit guidance. Primary files: `app/page.tsx`, `app/social-context.tsx`, `app/density.css`, `lib/presentation-fixtures.ts`, `lib/db.ts`, `tests/presentation.test.ts`. Also inspected the presentation launcher, ActivityPhoto helper and recorded `after/measurements.json`. No application edits, browser actions, or reruns of the parent's build/regression suite.

## Implementation integrity verdict

**Pass with small usability follow-ups; no blocking privacy or data-mutation regression found in the reviewed changes.** Fixtures are owner-isolated persisted data, social content is derived from authorized Circle state, and real interest/approval/RSVP distinctions remain intact. This is a bounded source review, not a penetration test or universal deployment certification.

Installed detector command:

```sh
.agents/skills/impeccable/scripts/impeccable detect --json app/page.tsx app/social-context.tsx
```

Exit 0; result `[]`; zero findings/false positives. Raw output: `final-detector.json`. CSS and fixture logic were manually reviewed; the detector cannot validate those boundaries.

## Audit health score

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility | 3/4 | Named controls, category pressed state, native disclosure; no new verified AA blocker |
| Performance | 3/4 | Small bounded fixture dataset and rail slices; additional images load eagerly; runtime profiling not performed |
| Theming | 3/4 | Existing rose/semantic vote tokens maintained; density additions use context text token and restrained surfaces |
| Responsive design | 3/4 | 24 recorded renders without root overflow or broken images; 40px category target declaration remains |
| Implementation integrity | 4/4 | Explicit isolated fixture entry, owner-filtered state, no private vote exposure or fabricated confirmation |
| **Total** | **16/20 — Good** | Minor follow-ups and explicit verification boundaries below |

Scores are source-review judgments informed by supplied geometry measurements, not WCAG certification.

## Findings

**P0: 0 · P1: 0 · P2: 1 · P3: 1**.

### P2 — Desktop/tablet category choices fall below the project's 44px target requirement

- **Location:** `app/density.css`, both `.browse-categories button` rules (including line 611).
- **Evidence:** Both declare `min-height:40px`; ordinary 13px labels plus padding fit inside that height. The project requires essential controls to retain 44px targets. These branches apply to touch-capable tablets/laptops as well as mouse users.
- **Impact:** Filtering is harder for users with reduced pointing precision, despite enough room in the supporting rail.
- **Recommendation:** Set a 44px minimum in both branches or consolidate the common rule. Retain the existing 8px gap.
- **Standard:** Project touch-target requirement; 40px alone is not a WCAG 2.2 AA target-size failure because AA's minimum is smaller and spacing exceptions exist.
- **Suggested command:** `$impeccable adapt`.

### P3 — Conversation previews open Ideas instead of the conversation

- **Location:** `app/social-context.tsx:152`, `app/page.tsx` `openCircle` helper around line 529.
- **Evidence:** Message buttons pass only circle ID; the shared handler always sets `circleTab` to `Ideas`. The user sees a quoted conversation but must choose Chat & AI after opening it.
- **Impact:** One avoidable navigation step breaks the context of responding to a social message. The visible “Open Circle” label is truthful, so this is an efficiency improvement rather than a misleading-action blocker.
- **Recommendation:** Pass a distinct onConversation callback or optional destination tab for messages, leaving decision/collection previews routed to Ideas.
- **Suggested command:** `$impeccable polish`.

## Privacy and fixture guard verification

- `createSession` calls the opt-in helper inside the existing transaction; the fixture path creates fresh random owner, session and profile IDs. All four circles and 36 activities are demo-scoped. The default branch remains the original four-person/six-activity seed.
- Existing state filtering excludes another owner's demo activities. Circle membership plus demo-owner checks are unchanged. The independent fixture test checks cross-owner Circle access and swipe denial, disjoint activity IDs, and unaffected second-session participation.
- `circleState` remains the sole source of rail voting counts. Social UI uses completed/total, authorized messages and existing plan status; it never reads raw vote rows. Incomplete-round aggregate `yes` stays absent. Fixture Edwin votes are actual persisted sandbox rows, not UI-manufactured counts.
- Fixture participation seeds only interest. Attendance is zero; proposed plan approvals and RSVPs are empty. Status is still derived from eligible approvals. No sample plan is presented as confirmed merely because seed JSON says so.
- DiscoveryBrowse calls `.filter(...).sort(...)`: filter creates a new array, so sorting does **not** mutate `data.activities`. Message and upcoming collections similarly derive new arrays. No in-place React state mutation found in these selectors.
- `presentationEnabled` requires the flag, a dedicated filename pattern, rejects Railway/Vercel markers, and rejects an explicitly non-local PUBLIC_ORIGIN. The dedicated launcher binds `127.0.0.1`, pins the presentation database, and disables live providers. This is effective for the supplied setup.
- **Guard limitation, not a discovered remote leak:** the helper alone does not prove locality on every hosting platform. With no recognized deployment markers and no PUBLIC_ORIGIN, it accepts the explicit flag/path even if a generic server is run elsewhere. Do not describe it as universal production detection. Keep the documented launcher as the supported entry point; if this mode is later exposed through other launchers, enforce locality at that boundary. DATABASE_PATH guard also assumes a normal dedicated path, not malicious symlink manipulation.
- DB opening/schema initialization occurs before `createSession` validates the fixture flag. Invalid fixture configuration blocks fixture inserts but is not a guarantee of zero file creation/schema writes on import. No default production data overwrite was found in the supplied launcher.

## Recorded rendered evidence

Read `docs/design-iterations/density/after/measurements.json`: **24 records**, covering Discover/Circles/Plans/Profile at requested widths **375, 390, 430, 768, 1024 and 1440px**.

- Every record has `scroll == client`: **zero measured root horizontal-overflow cases**.
- Every record has `broken:0`: **zero broken images in these captures**.
- The recorded layout client width is consistently 15px smaller than window width, consistent with reserved scrollbar space. The report preserves requested/window dimensions rather than falsely treating client width as identical.
- These measurements do not establish text contrast, focus order, 200% text resizing, image-failure recovery, card-caption clipping, touch arbitration or absence of offscreen overlays. Parent browser pointer QA is separate and was underway when this report was written.

## Tests and remaining limitations

The fixture test explicitly verifies the 3/4/36 population, equivalent activity title order across isolated sessions, absent premature aggregate votes, zero fake attendance/approvals/RSVPs, cross-owner denial, saved interest through session lookup, and baseline seed when opt-in is removed. These are meaningful assertions.

The test name includes “persistence,” but its session reread uses the same connection/process. It does not independently prove restart persistence, fixture migration, or cookie continuity. Fixture dates anchor to the creation day's UTC 23:00 and are persisted; identical sessions created on different days intentionally have shifted dates. No explicit frozen-date override exists, so exact cross-day screenshot dates are not deterministic. Content and ordering are deterministic.

The fixture test leaves its temporary DB directory/connection for process teardown; adding cleanup is reasonable hygiene but not a user-facing blocker. Guard coverage omits Vercel and malformed/valid local-origin variants even though implementation has those checks. These do not justify rerunning all unrelated regressions; add focused cases when changing the guard.

Parent reports lint/build, 36 unit tests, integration and multiuser regressions passed. This reviewer did not rerun or independently certify those commands. Physical Safari/Chrome touch behavior, assistive technology and native devices remain unverified. The source retains pointer/keyboard/button transaction code; rendered pointer QA belongs in the parent's evidence artifact.

## Positive findings and next actions

The new desktop rails add authorized useful information while the center remains the swipe task. Tablet topology has a dedicated two-region branch and mobile hides rails. Plans groups confirmed, proposed and interested states separately; compact empty sections avoid fabricating attendance. Profile prioritizes interests/membership and retains infrastructure tools in settings. Representative images remain labeled by the sandbox context and data provenance.

1. `$impeccable adapt`: raise rail category hit areas to 44px and verify the two layout branches.
2. `$impeccable polish`: preserve conversation destination context if adopting the small navigation improvement.

Re-run the focused audit after fixes; retain the parent’s actual gesture and screenshot evidence alongside it. No app files changed in this review.

## Implementation closure

Parent applied both recommendations: category chips now have a 44px minimum at desktop/tablet; conversation previews call a dedicated onChat callback selecting Chat & AI. Final screenshot measurements were regenerated with no overflow or broken images. Presentation-session restart was additionally exercised through a failed swipe, restart, retry and reload; the normal integration restart verifier passed independently.
