# Ditto silent submission video

Open `ditto-demo-silent.mp4` in a video player. The master is exactly 180 seconds, 1920×1080, H.264, 30 fps, and contains no audio stream. Add the separately recorded narration using `VOICEOVER_TIMING.md`.

- `STORYBOARD.md`: exact scene/shot timing.
- `VOICEOVER_TIMING.md`: unchanged narration and speaking rates.
- `RECORDING_SOURCES.md`: genuine UI/AI/multiplayer evidence and capture limitations.
- `VIDEO_QA.md`: validation and review findings.
- `clips/`: original timestamped compositor frames and derived source MP4s.
- `graphics/`: original branded plates, diagrams, and phone mask.
- `edit.py` + `edit-decision-list.json`: reproducible editing project.
- `thumbnail.png`: actual app interface and official branding.

## Rebuild

From the repository root, use Python 3 with Pillow installed and `ffmpeg` / `ffprobe` on PATH:

```sh
python3 -m venv /tmp/ditto-video-tools
/tmp/ditto-video-tools/bin/pip install pillow
/tmp/ditto-video-tools/bin/python docs/submission/video/edit.py
```

The renderer reads the local captured sources; it does not call providers, access cookies, or alter application state. Run it only after source capture. Videos, captured frames and generated graphics are ignored by Git to avoid committing private imagery or large binaries. Keep a local copy of the entire video directory to preserve the editing project.

To view in a browser locally:

```sh
python3 -m http.server 3130 --bind 127.0.0.1 --directory docs/submission/video
```

Open `http://localhost:3130/review.html`. This does not deploy the app or publish the video.
