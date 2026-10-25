# Mobile swipe reliability — 2026-10-25

Preserve the current card identity, feedback and real voting transaction. Fix interruption, not visual styling. Use transform/opacity and retain reduced-motion behavior. Existing desktop wheel timing is intentionally unchanged.

Found three gaps:
- Tap/cancel/short swipe locked input through spring recovery. New touches can now take over immediately; recovery generations prevent stale completion unlocking an in-flight save.
- Ambiguous diagonal beginnings were permanently treated as vertical. Require directional dominance before choosing an axis. Genuine vertical scrolling remains native.
- A finger-down on the next-card preview during the prior save/exit had no listener that could survive replacement. The stationary deck now captures a still-held touch and transfers it to the new card only after the prior save succeeds. Completed/cancelled gestures are discarded rather than replayed against an unseen card. Failed saves keep the original card and cannot advance another vote.

Touch exits take 340ms, while trackpad/mouse duration remains 460–500ms. The next card still waits for the actual transaction. Offline/slow server requests can still require waiting; this change does not fake saves or guarantee instantaneous operation under all network conditions.

Automated tests include immediate retry during snapback, tap→swipe, diagonal→horizontal, six consecutive keyed-card votes, held-preview touch handoff, vertical scrolling, cancellation, duplicate prevention and failed-save recovery. 76 full-suite tests passed. Lint has zero errors (three pre-existing video helper warnings); production build passes. The shared surface fixes both Discover and Circle voting.

On-device iteration found that very rapid gestures can finish before the previous exit/save settles. One recent completed preview gesture can now transfer after successful publication (maximum age 1.5 seconds); cancellation removes it and stale input is discarded. The stationary Discover/Circle deck uses pan-y, preserving vertical scrolling while keeping horizontal preview touches from being cancelled by Safari. Added coverage for completed handoff and stale rejection.

Final actual iPhone Mirroring pass: two consecutive batches of three rapid alternating drags saved exactly six distinct activity decisions (SQLite sequences 66–71, yes/no/yes/no/yes/no) and advanced to Badminton doubles. Screenshot `iphone-after-six-swipes.png`. Final suite: 77 passed, plus production build and typecheck. Updated the existing temporary HTTPS preview only; Railway unchanged. Original preview data and sessions preserved.
