# Ditto · three-minute Meta demo video

The revised silent master tells one connected product journey: Discover → Weekend Crew → real Muse Spark planning → independent votes → unanimous bouldering → three approvals → confirmed calendar → manual export.

- **Final:** `ditto-demo-silent.mp4` — 180 seconds, 1920×1080, H.264, 30fps, no audio.
- **Preview:** `review.html`, served locally at `http://localhost:3130/review.html` while the preview server is running.
- **Connected originals:** `clips/journey/*.mp4`; original JPEG screencast frames and timestamp/click manifests in corresponding folders.
- **Representative frames:** `work/journey-review/`; `thumbnail.png`.
- **Storyboard:** `STORYBOARD.md`; exact cuts: `edit-decision-list.json`.
- **Unchanged narration:** `VOICEOVER_TIMING.md` with revised visual cues.
- **Evidence and limits:** `CONTINUITY_QA.md`, `VIDEO_QA.md`, `RECORDING_SOURCES.md`.
- **Reproduction:** `edit.py`, `export-sources.py`, `capture-journey.js`.
- **Preserved first version:** `work/v1-backup/ditto-demo-silent.mp4`, `edit-v1.py`, original `clips/` takes.

## Rebuild

From the repository root, with Python + Pillow and FFmpeg installed:

```sh
python3 docs/submission/video/edit.py
python3 docs/submission/video/export-sources.py
python3 -m http.server 3130 --bind 127.0.0.1 --directory docs/submission/video
```

The renderer reads actual capture timestamps and adds only surrounding graphics and tap indicators. It does not invoke APIs, mutate app state, or generate fake product responses. Sources and media are intentionally local ignored artifacts, not committed to Git. Back them up with the deliverable folder before moving machines.

## Capture setup

Use `capture-journey.js` inside `cua_repl` after selecting the dedicated isolated recording tab and reading the browser/CDP documentation. Supply Node file access, an output folder, the documented CDP capability, and a pacing helper. Each `jRecord(name, async () => { ... })` records a connected sequence; use `jTap(locator, label)` for logged taps and native tab drag for genuine swipes. Derive locators from fresh UI observations. Independent sample-session setup remains off camera and is never stored in these scripts. Do not reuse real production sessions.

Two bounded live model requests produced the recorded suggestion and venue plan. No external invitations, reservations, SMS or calendar writes were performed. Railway production is unchanged.
