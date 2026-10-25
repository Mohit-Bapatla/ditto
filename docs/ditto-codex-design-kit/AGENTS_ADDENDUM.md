# Ditto design quality workflow (paste into existing AGENTS.md after reviewing)

For any significant UI change, use the project-installed UI/UX Pro Max and Impeccable skills when available. Treat them as guidance, not as a substitute for product judgment.

Ditto is a mobile-first, photo-led group activity discovery and planning app. The flagship interaction is physically dragging an activity card left to pass or right to Ditto. The card must follow touch/pointer movement continuously, rotate, reveal progressive red PASS or green DITTO feedback, and fly out on commit. Releasing below threshold must spring back. Support touch, mouse drag, arrows, and secondary action buttons. Votes must use existing backend and avoid double submissions.

For each major screen: (1) capture current app at 390px mobile and MacBook width; (2) document first-viewport job and user-flow states; (3) pick 2-3 grounded production screenshots with the same purpose; (4) propose one coherent visual direction and distinctive elements, not a mash-up of brands; (5) implement one screen; (6) capture screenshots of rendered implementation; (7) critique hierarchy, typography, photography, density, and interaction clarity; (8) fix largest 3 flaws and repeat. Review edge cases such as long venue names, no images, errors, empty activity decks, and reduced motion.

Prioritize authentic venue images. Never generate fictional images implying a real venue is something it is not. Avoid generic SaaS kits, repeating feature cards, gratuitous gradients, decorative blobs, and excessive badges. Avoid blindly banning standard UI patterns. Preserve production APIs, multiplayer voting, RSVP, routing and calendar flows. No deployment without permission.

Provide before/after screenshots and actual drag gesture test evidence. Do not call a redesign completed solely because tests pass.
