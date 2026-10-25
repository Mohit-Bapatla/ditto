# Final video QA

## Export

- Master: `ditto-demo-silent.mp4`.
- 180.000 seconds, exactly 5,400 frames.
- 1920×1080, square pixels, 16:9, H.264, yuv420p, 30 fps.
- No audio stream; ready for separately recorded narration.
- Fast-start MP4 for convenient playback.
- All application footage uses the mobile layout; no desktop app layout is included.
- Single-phone framing is approximately 91% of frame height including its thin surround. Architectural detail crops deliberately magnify the original UI without changing its aspect ratio.

## Review performed

The complete file was decoded from beginning to end without decoder errors and checked for blank/black intervals. Full-timeline contact sheets cover the beginning through closing; swipe motion was additionally inspected in 200 ms intervals. Real-time browser playback was started at zero and checked through the end. The finished edit was inspected for typography, photos, identity, actual plan status, cut timing, phone proportions, and caption accuracy.

Corrections made during review:

1. Re-recorded mobile captures after finding an incorrect compositor/device-size combination. Defective early clips are excluded.
2. Replaced a distorted architecture crop with a proportionate magnified excerpt.
3. Enlarged and centered the final supplied logo using its higher-resolution official stacked asset.
4. Excluded the empty Sunday calendar take and used the actual Monday confirmed plan.
5. Used settled real venue results rather than a pending search frame.

The video uses restrained straight cuts and authentic app motion. It does not add artificial card translations or fake match overlays. Success toasts seen in the app are genuine saved-vote/approval feedback. No debug panel, credentials, failed API result, or browser chrome is included in the master.

## Application verification

The recorded new Weekend Crew round has actual UI-submitted votes from three separately authenticated sample sessions. Bouldering received 3/3; pickleball received 2/3. Muse Spark extraction and planning used live providers. The plan contains a SerpApi venue and reached confirmed status only after three real approvals. An ICS file actually downloaded and is retained under `clips/confirmed-plan.ics`; this did not create an external calendar event. SQLite state was independently inspected. The four-user multiplayer regression passed again on a separate disposable test database after capture.

No product code was changed for recording. The permanent showcase and Railway production data were preserved. The newer public demo remains awaiting its separate deployment approval.

## Scope and remaining handoff

This is browser-emulated mobile footage with real pointer dragging, not a physical iPhone screen recording. Capture is variable compositor cadence, exported at 30 fps; it is not claimed to be native 60 fps. Static reading intervals retain genuine settled UI frames. Participant clips were recorded sequentially and combined editorially, not filmed simultaneously. The opening chat is visibly illustrative; architecture/technology diagrams and brand cards are explanatory graphics.

Add narration using `VOICEOVER_TIMING.md`, then review the combined audio/video before submitting. The original narration was retained in full. No public upload or submission has been performed. Large media and private source imagery are excluded from Git.
