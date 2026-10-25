# Physical swipe acceptance — 2026-10-25

## Implementation

Both discovery and Circle voting use `SwipeSurface`, backed by the existing Motion dependency. The card follows pointer movement with rotation and directional tint/stamps before release. A real next-card preview scales into place. Distance/velocity thresholds, spring snapback, vertical intent, cancellation and nested controls are handled. Arrow keys and accessible buttons use exactly the same commit path.

The request completes before accepted exit; new server state is published after exit. A synchronous lock prevents repeated pointer, key and button requests. Failed saves retain the same activity and provide a retry message. Polling is suspended during the transaction; stale GET state cannot overwrite committed state. No database or voting-contract migration.

## Tests executed

- `npm run lint` — pass. Installed third-party `.agents` tooling excluded; application checks remain active.
- `npm run typecheck` — pass.
- `npm test` — **32 passing**. Includes actual React pointer-handler/Motion DOM tests, not a separate simulated swipe implementation.
- `npm run build` — pass, Next.js 16.4.3 production build.
- `npm run test:integration` — pass against isolated SQLite production preview on 3102.
- `npm run test:multiuser` — pass: four independent sessions, exact vote outcomes, private reveal, duplicates, planning/reapproval, RSVP/calendar and permissions. No live provider calls.
- Browser: real CDP mousePressed → multiple mouseMoved → mouseReleased sequences. Successful left/right commits, held feedback, incomplete release, next-card reveal, stopped-server failure and retry availability. 375/390/430/1440 widths tested.
- Browser: two consecutive arrow-key votes; focus follows the next card. Refresh retained the persisted decision/deck. Group right drag saved Korean BBQ yes; left drag saved Bowling pass and advanced to Escape room.
- Existing earlier verification covered actual Muse planning, venue discovery, extraction, routing, approvals and persistent independent sessions. These paid checks were not repeated for this frontend-only change.

## Evidence index

| Requirement | Saved evidence |
|---|---|
| Idle | `swipe/idle-390.png`, `skill-audit/discover-after-390.png` |
| Progressive green right | `skill-audit/drag-right-390.png` |
| Progressive red left | `skill-audit/drag-left-390.png` |
| Accepted right exit | `swipe/right-exit-0-390.png` through `right-exit-7-390.png` |
| Accepted left exit | `swipe/left-exit-0-390.png` through `left-exit-7-390.png` |
| Next card | `swipe/next-after-ditto-390.png`, `next-after-pass-390.png` |
| Incomplete snapback | `swipe/snapback-in-motion-390.png`, `snapback-restored-390.png` |
| Other widths | `swipe/held-left-375.png`, `held-left-430.png`, `held-left-1440.png` |
| Failed save | `swipe/network-failure-recovered-1440.png` |
| Real group votes | `swipe/group-held-right-390.png`, `group-held-left-390.png`, `group-next-390.png` |
| Skill-led iteration | `skill-audit/discover-before-*`, `discover-after-*` |

Earlier swipe captures precede the final green button/label refinement; the transaction/gesture engine is the same. Skill-audit captures show the latest decision colors and wording. Dates and fictional test activities differ between some captures because real votes advanced the deck.

## Limitations and honest completion boundary

The browser bridge does not support `Input.dispatchTouchEvent`. Mobile widths are emulated layouts with actual mouse drags. Unit tests use pointer events labeled touch, but **neither proves physical touch behavior or Safari gesture arbitration**. Real iPhone Safari, Android Chrome and hardware trackpad testing remain unverified. No claim of native-device acceptance or full accessibility compliance is made.

Reduced motion is implemented (no rotation, short accepted fade, immediate snapback); an OS-level reduced-motion browser run remains unverified. This pass completes the physical pointer implementation and its local automated/visual evidence, not the entire multi-screen design recovery. Figma currently covers the swipe family; full three-direction exploration and other-screen design work are not represented as complete.

Production was not deployed or changed. Preview: http://localhost:3102/ (isolated test data, live providers disabled).
