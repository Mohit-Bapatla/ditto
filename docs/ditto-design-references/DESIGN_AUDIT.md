# Ditto design review: real product, not generic hackathon site

## Anti-pattern screenshot supplied by user
See `images/anti-patterns-1.png` and `images/anti-patterns-2.png`. It contains subjective social-media opinions, **not universal rules**. Avoid generic combinations, not every listed ingredient. Lucide, Inter, soft corners, gradients, shadows, and skeletons can all be fine when deployed intentionally. Privacy protection and honest functionality are mandatory, not style trends.

## Product direction
Mobile-first, editorial photography-led, warm and social. Distinct from a finance dashboard and from dating apps. Visual hierarchy: activity image > activity name > time/location > host/attendees > one primary action. Show people and experiences before AI chrome.

## Design language proposal (refine after looking at actual live product)
- Canvas: #F7F5F1 warm porcelain; surface: #FFFFFF; ink: #17191C; subdued: #6D7078.
- Signature highlight: #FF624B vivid persimmon/coral; alternate accent: #E2F176 yellow-lime for mutually agreed moments. Use accent sparingly: calls-to-action and Ditto match only.
- Font: use current font if excellent; test a distinctive display face for headlines paired with a neutral UI sans. Don't add 3+ fonts. Avoid cosmetic font churn.
- Corners: purposeful token scale 10/16/24px; not the same radius on every element.
- Borders: 1px soft neutral where needed; use subtle elevation ONLY on draggable cards and modals.
- Large photography for discovery. No stock-illustration dashboard cards, gradient blobs, icon-grid hero, arbitrary emoji rows or faux social proof.
- Branding: one consistent 'ditto' wordmark and a visual 'two overlapping shapes = mutual agreement' system. Do not copy Tinder/Partiful logos.

## Screen-by-screen specification
### 1. Entry / onboarding
Instant app recognition; one CTA; minimal name/city/avatar and optional interests; eliminate persona/personality quiz. Option to explore first if security/model permits. Clear next action. Mobile keyboard safe areas.
### 2. Discover
Image-first 4:5 or taller card dominating mobile viewport, on-card copy: activity, day/time, location, host, spots, budget. Explicit pass and interested actions anchored above tab bar and safe area; visible second card behind. Drag with threshold, rotate/opacity, reversible in-session if feasible. Mouse dragging, click and keyboard. Do not show fake drive duration, no venue mismatch, controls large enough for thumbs. Secondary filters compact horizontal scroll.
### 3. Activity detail / RSVP
Hero photo transitions into practical details. Single primary Join/Request action with clear interested-vs-attending states. Host, attendees (with consent), time, venue, directions and share link. Clear cancel/withdraw state and accurate spots.
### 4. Create activity
Short grouped form, progressive disclosure. Select actual venue with SerpApi; don't confuse venue with user-hosted event. Photo preview. Sticky submit CTA; input validation inline; prevent duplicate posts.
### 5. Circles index
Visual group tiles with avatars, upcoming plan, 1 clear create action. No 3-column feature cards. Show recent activity. Empty state points to invite flow.
### 6. Circle interior
Member faces and one active 'What are we doing?' round; segmented tabs Ideas/Chat/Matches/Plans if needed. Don't bury important action in dashboard-style widgets. Activity suggestions should feel like shareable cards.
### 7. Group swiping
One highly tactile card at a time; visible round status; voting privacy until reveal. After last vote, a clear waiting state, not a fake match. Realtime polling states subtle.
### 8. Match reveal
A signature moment: overlapping avatars -> activity photo/title -> ‘Ditto. Everyone’s in.’ only for unanimous; majority explicitly labeled. One ‘Make a plan’ action, no confetti explosion with fake agreement. Simple motion reduced on prefers-reduced-motion.
### 9. AI plan
Beautiful itinerary timeline with REAL venues, estimated/verified indicators, per-stop chips for time/drive, compact ‘Why this fits’ referencing member votes, explicit pending approval and add-to-calendar only after permitted state. Show AI badge unobtrusively, not sparkles everywhere.
### 10. Circle chat / Social Autopilot
Native messaging rhythm, composer pinned above keyboard and nav safe area, AI suggestion as one concise inline proposal with Accept/Edit/Dismiss; user approval before adding idea. Don't make AI look like a fake group member.
### 11. Plans / calendar
Approvals and RSVP presented plainly; date+time legible; no confusing fake 'sent reminder' copy. ICS download and share. Future SMS optional only if time.
### 12. Profile
Useful profile, name/city/interests and activities history if valid. No personality labels, fake scores, gamified XP, pricing plans, fabricated testimonials.

## Critical responsive acceptance
- 320, 375, 390, 430, 768, 1024, 1440 widths, both short-height mobile Safari viewport and landscape.
- No horizontal overflow; no action hidden behind Safari toolbar; env(safe-area-inset-bottom) support; viewport dynamic units; touch-action scoped to swipe surface so vertical page scroll still works.
- Desktop deliberate design: centered max-width swipe deck + useful surrounding context (map/list or upcoming circle) rather than stretched 4:5 card. Trackpad dragging and mouse actions work.
- Accessible contrast, hover/focus/touch/keyboard states, reduced motion, 44px minimum touch targets.
- Performance: images responsive/cropped, loading transitions no jank, no layout shift, avoid API bursts during swipe.

## Inspect before refactor
Record screenshots of CURRENT Ditto at each width, then compare to refs and define concrete issues. Do not assert any listed anti-pattern is currently present without inspection. Reuse reliable components/API logic. No redesign may regress the previously verified live Muse and SerpApi workflows.
