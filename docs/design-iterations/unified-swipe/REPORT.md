# Unified swipe verification — October 25, 2026

## Result

Discover and Circle Ideas now share the same stationary deck boundary and persistent momentum gate through `useSwipeDeck`, and the existing `SwipeSurface` owns pointer tracking, rotation, feedback, keyboard/buttons, snapback and exit. Their separate real backend operations remain intact.

Circle previously omitted the wheel gate, so its wheel listener was never installed. Discover waited for 180 ms of wheel silence even after acceptance, allowing momentum to extend the visible pause. The moving card also lost wheel hit testing beneath a stationary cursor. Circle horizontal overflow expanded the mobile viewport during a drag. These causes and the design direction were recorded in AUDIT.md before implementation.

Accepted travel now exits immediately from its current position while the save runs concurrently. The next card publishes only after save and exit; failure restores the original card. Exits take 460–500 ms with a gentler curve, tuned twice in response to the user's physical trackpad feedback. The gate suppresses residual momentum but recognizes renewed acceleration after decay. The user tested the final local preview and reported: “alr yeah it works well”. No hardware fault was assumed.

A further StrictMode effect replay bug stranded Undo entrance at a nonzero offset; its ownership is corrected and covered by regression.

## Evidence and checks

- 64 unit/component tests pass, including touch capture/cancel, keyboard, failures, duplicate protection, wheel normalization, momentum, fresh bursts, Circle backend submission and StrictMode Undo.
- Lint, typecheck and production build pass.
- Real browser input: 28 supported cases pass across both decks: mouse drags, slow drags, flicks, arrows, wheel sequences, incomplete snapback, momentum, delayed saves, offline recovery and Undo. Four synthetic touch cases are explicitly unsupported by the browser control API, not counted as passes.
- Integration, multiplayer, discovery recovery, profile-photo and database restart/persistence checks pass on a disposable database. Logs are `/tmp/ditto-unified-{integration,multiuser,recovery,photos,persistence}.log`.
- Final wheel Motion-value traces show continuation within 0.6–1.0 ms of acceptance and movement through approximately 449–462 ms. These measure Motion values rather than hardware paint. JSON traces and browser results are in `test-results/unified-swipe/`.
- Actual iPhone Safari through Mirroring: Discover and Circle left/right drags advance with red/green feedback; Undo, incomplete snapback and Details were exercised. Final build was rechecked on device for both directions in both decks, and Circle controls fit above navigation. Mirroring input is distinguished from human finger feel. Physical orientation, Android, and a complete custom-activity/multiplayer flow on the phone were not verified; backend/browser coverage is separate.
- The user directly verified the real MacBook trackpad after the final timing/guard adjustment. Browser automation separately verified mouse and synthetic wheel input.

## Visual review and metadata

Reviewed actual renders at 375, 390 and 430 px and MacBook width. Circle now has adjacent aggregate voting/participant context on desktop and compact in-flow controls on mobile. Individual decisions remain private. The final screenshot review caught and fixed the suggesting-member/Details collision.

Card metadata is limited to available location, suggested date/time and cost. Unknown price is omitted, estimated budget is labeled, and full provider address is in Details. No precise user location exists in this flow, so distance is omitted; no addresses, reservations or times were invented.

Reference evidence: existing captured Tinder match screen and Partiful event page in `docs/ditto-design-references/assets/reference-captures/`; used for interaction clarity and secondary-detail hierarchy, preserving Ditto branding. Impeccable and UI/UX Pro Max guided motion, responsive adaptation and rendered critique.

Before evidence: `test-results/showcase/circle-before-mobile.png`, `circle-before-desktop.png`, `discover-before-mobile.png`. After evidence: `test-results/unified-swipe/circle-390-final.png`, `circle-375-final.png`, `circle-430-final.png`, `discover-390-final.png`, `circle-desktop.png`, `iphone-circle-final.png`. Gesture evidence includes `circle-clipped-right.png`, `discover-drag-left.png`, `iphone-circle-left.png`, `iphone-circle-details.png`. Screenshots remain local because they include the approved personal profile photos.

## Isolation and preview

Local QA: http://swipe-qa.localhost:3122/ uses `/tmp/ditto-presentation-swipe-qa.sqlite`, a WAL-aware copy, with live providers disabled. Test votes never touched the permanent showcase. Existing legacy presentation plans in the QA copy were assigned their historical round to permit Undo testing; the original data was not changed.

The original business-data fingerprint remained `52e43251681f912014ff852d1076df4956d96e47cb2043d9f8c9ca254897ecf1` before and after QA (session rows excluded). Mohit, Edwin, Paxton, photos, Circles, activities and plans remain intact. No Railway changes or production deployment. The approved temporary HTTPS tunnel was only for isolated device QA and is stopped after verification.

Safari can reserve browser-navigation gestures; mouse drag, arrows and action buttons remain available. Universal interception of browser-owned gestures is not claimed.
