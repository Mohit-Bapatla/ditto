# Continuity QA · revision 2

## Verified from the real application

The recording used an isolated SQLite copy, `/tmp/ditto-video-journey.sqlite`, served at `http://journey.localhost:3131/`. The permanent showcase and Railway production were not modified.

- Discover filters, left/right physical pointer drags, saved-interest feedback, details, close, and Circles navigation were captured as a connected take.
- Weekend Crew was opened from the Circle list. Chat & AI was opened through its visible tab. Three stored sample messages were selected with explicit live-provider consent.
- Muse Spark returned the actual proposal **bouldering in Austin**, with Monday at 6 PM and uncertainty notes. The UI approved adding it to Ideas and began a new unanimous round.
- Three independent authenticated sample sessions each voted through the five-card deck. SQL verification: bouldering has three positive votes from three distinct participants. No frontend-injected vote or mocked response was used.
- The live planning request returned **Monday Evening Bouldering in Austin**, with the SerpApi-supplied Bouldering Project–Springdale venue. The unchanged model output includes hours/budget caveats.
- Paxton, Mohit, and Edwin approved through the real UI. SQL confirms three distinct stored approvals. The displayed approval state is derived by the app; the raw proposal record alone is not treated as confirmation.
- Plans → Next week → Monday October 26 → confirmed activity → RSVP → Add to Calendar were exercised. The export is a manual ICS download, not an external calendar mutation.

## Editorial checks and repairs

- Kept the same activity, Circle, participants and venue through AI, consensus, approval and calendar.
- Preserved navigation taps and destination states; removed only redundant holds and two portions of actual AI loading.
- Used a fixed phone frame. Architecture and technology appear beside the ongoing calendar instead of replacing it with a separate slide deck.
- Added 220ms tap indicators from captured coordinates. No synthetic cursor path or fake application transition.
- Labeled independently recorded Edwin/Paxton footage as separate sessions. Approval switches are also named.
- Rerecorded calendar navigation after selectors failed off camera. Failed attempts are excluded.
- Rerecorded the closing return-to-calendar to repair scroll anchoring that clipped the logo. Final logo/header remains visible.
- Preserved original MP4, original editor and original footage. The source manifest's A-take end was repaired to the recorder-reported 30.013 seconds after a recovery handler overwrote that field; frame timestamps and imagery were unchanged.

## Limits

This is browser-emulated mobile capture using real pointer drags. It is not a claim of new physical-iPhone testing or native 60fps capture. Original screenshots arrive at variable event cadence; delivery is 30fps. AI waiting is shortened and long final explanatory holds are intentional. There is no audio: use the unchanged narration script for a separately recorded voiceover. No publication or deployment is included.

Calendar export was additionally verified by an authenticated read: HTTP 200, `text/calendar`, one VEVENT, bouldering summary, and DTSTART 20261026T230000Z. The checked ICS is saved locally in `work/journey-calendar-export.ics`.

Full final-master browser playback completed from 0 to 180 seconds. The player reported `ended: true`, `currentTime: 180`, `duration: 180`, and no media error. Playback was inspected during Circle navigation, independent voting, architecture, and closing, alongside the full-timeline contact sheet and motion filmstrip. Evidence: `work/journey-playback.json`.
