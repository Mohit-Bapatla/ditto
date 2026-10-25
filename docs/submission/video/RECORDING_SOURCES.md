# Recording sources and provenance

## Environment

All newly captured application footage is the real mobile layout in Chromium browser emulation at 390×844 CSS pixels, captured as browser compositor JPEG frames up to 780×1688. Pointer drags operate the existing swipe engine. This is **not physical iPhone capture**. The browser’s touch-dispatch API was unavailable; pointer gestures were used, not click-button stand-ins or synthetic card animations.

The recording server used `/tmp/ditto-video-showcase.sqlite`, a consistent SQLite backup of the isolated permanent local showcase. The original showcase and Railway databases were not modified. This copy contains the supplied Mohit, Edwin and Paxton profile pictures, four Circles and 36 original sample activities. Dedicated recording cookies authenticated the three sample identities, sequentially, on `video.localhost:3129`. These tokens and the database are not deliverables and are not committed. No real user account was impersonated.

## Authentic flow

- A real demonstration message proposed bouldering in Austin on Monday at 6 PM with a proposed budget under $30.
- Muse Spark produced the recorded “Bouldering in Austin” proposal. It was approved into Ideas using the interface. The raw model request and response were not stubbed.
- The previous fixture round was completed as preparation, then a **new unanimous round** was started through the UI. Every vote in that recorded round was submitted by a physical pointer drag. Mohit passed on the other four activities; Edwin and Paxton also liked pickleball. All three liked bouldering. The deterministic backend reported three bouldering votes, two pickleball votes, and zero for the other ideas.
- Live planning produced “Monday Bouldering Outing in Austin,” using the real SerpApi-sourced Bouldering Project – Springdale listing at 979 Springdale Rd. The model explicitly retained budget/availability uncertainty. Live venue search was recorded separately and returned that same venue plus other actual listings.
- Paxton, Mohit and Edwin each approved through their independent authenticated session. The actual plan became confirmed at 3/3 approvals. Edwin RSVPed. The calendar showed the plan on October 26, 2026; the ICS export really downloaded. No reservation, invitation or external calendar event was created.
- The second Muse extraction take is an authentic repeat request made only to correct capture framing. The accepted idea and plan belong to the first result. The final edit pairs a genuine processing shot with the accepted original result; waiting and navigation are shortened editorially.

## Source organization

`clips/<shot>/manifest.json` retains compositor event timestamps and original JPEG frames. `clips/<shot>.mp4` preserves those timings at a constant 30 fps, duplicating held frames where the compositor emits only on changes. Motion is not claimed to be native 60 fps. Original recordings are not sped up to manufacture results. Final edits trim navigation/waiting and may hold a settled result for narration.

The edit decision list identifies every used source. Clips 01–07 have a capture sizing defect and are excluded from the master. Clip 18 is an authentic longer live-plan request, retained for provenance but its loading/old-plan framing is excluded. Clip 23 shows an empty selected Sunday and is excluded. No old rehearsal MP4 is used in the finished master.

## Graphics and rights

The opening group chat is original illustrative motion graphics, visibly labeled as such. The architecture and technology plates are original explanatory graphics created by `edit.py`. They distinguish Muse Spark understanding, SerpApi retrieval, and Ditto’s deterministic voting/persistence/approval logic. No Meta logo or endorsement claim is added. The supplied official Ditto logo is used without redesign.

Activity-category photography comes from the app’s existing Unsplash assets and remains labeled as illustrative in the UI. Real venue images are those actually returned/displayed by the provider integration, not generated approximations. Profile images were supplied by the user for this showcase/video. Existing font licenses and asset provenance are documented in `THIRD_PARTY_NOTICES.md` and the app manifests. No third-party design-reference screenshots are included.

This is a local video deliverable. No upload, public release, repository visibility change or production deployment was performed.
