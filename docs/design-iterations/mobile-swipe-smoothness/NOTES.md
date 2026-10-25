# Mobile swipe continuity — 2026-10-25

Removed Discover's redundant AnimatePresence handoff. The shared swipe surface now hides its outgoing bitmap at exit completion until the keyed card is replaced, restoring visibility only on a failed save. Undo's restored-card override clears before publishing the server response. Removed per-vote success toasts from Discover and Circle voting; directional feedback still confirms acceptance. Touch exit is 280 ms; trackpad timing remains unchanged.

Verification: production build, typecheck, lint (three existing video-script warnings). Full suite: 79 passing, including the demo-photo regression. Tests include slow-save invisibility, failed-save recovery, interrupted spring, keyed handoff, duplicate prevention, keyboard and wheel input.

Actual iPhone Safari through Mirroring on the existing temporary HTTPS preview: six consecutive Discover drags saved exactly six decisions, yes/no/yes/no/yes/no (history 118–123). Three consecutive Circle drags saved exactly three decisions, yes/no/yes (124–126). Saved screenshot samples show the deck advancing without the old card returning. Mirroring serializes some capture/input calls, so these samples are not a complete 60-fps recording or a measurement of subjective finger feel.

Original profile photos were intact; the fresh public-demo namespace intentionally started without personal assets. Added PUBLIC_DEMO_PHOTO_DIR, an explicitly configured source of consented sample JPGs. Only missing photos of the three marked sample profiles in demo namespaces are repaired. Enabled against existing private showcase media for this authorized temporary preview. All three stored photo references verified; Mohit navigation and Paxton Discover avatar verified on actual iPhone. No private photos added to Git, no real account reset, no Railway deployment.

Preview: https://served-carmen-photos-football.trycloudflare.com/demo
