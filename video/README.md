# Hai Pantai explainer video

A 76-second motion explainer of how Hai Pantai works, for people who have never played it. 1920×1080, 30 fps, with an original soundtrack and sound effects.

**Watch:** [`out/hai-pantai-explainer.mp4`](out/hai-pantai-explainer.mp4)

## What it shows

| Time | Scene | What a newcomer learns |
|---|---|---|
| 0:00 | Intro | The name and the promise: spot trash, clean it, help your beach win |
| 0:06 | The problem and the idea | Bali's real coastline draws itself, trash pins pop up, and every coastal village (173) becomes a beach team. The loop is Report → Clean → Climb |
| 0:14 | 1 · Report | Tap **Report trash**, snap a photo, Claude tags the kind and size, the pin snaps to the nearest beach. Points: a handful 10, a bag 20, more than a bag 40 |
| 0:26 | 2 · Clean | Anyone cleans any open report, takes an after photo, Claude gives a clean score (under 40 stays open). Points = 30 × size × score, ×2 on a hotspot (more than a bag, or open 48 h+). 30 × 2 × 92% = 55 → 110 |
| 0:38 | 3 · Climb: beach health | Health = 100 − the weight of open reports (5 / 10 / 20). Kuta drops from 100 to 35 as trash comes in, then cleans back to 100 |
| 0:48 | 3 · Climb: the league | Beaches are ranked by health each week; Kuta climbs from 5th to 1st and takes the crown. Beaches with no reports in 7 days show "No data yet" |
| 0:58 | Bonus | The six badges and the shared weekly challenge (clean 50 spots, resets Monday 00:00 WITA) |
| 1:08 | Outro | The loop again, the logo, "Grab a bag. Hit the beach." |

The numbers on screen follow the rules in [`shared/game.ts`](../shared/game.ts), and the copy follows the app's own wording.

## How it is made

Everything is code; there are no video or audio assets.

- `src/index.html` and `src/anim.js`: the whole video as one web page. `window.renderFrame(t)` draws the frame at time `t`, so every frame is exact and repeatable.
- `src/geo.js`: Bali's 716 village outlines and 173 beach coastlines, built from the app's own map data by `scripts/build-geo.mjs`.
- `scripts/music.mjs`: synthesizes the 120 BPM soundtrack (marimba, pads, bass, drums) and the sound effects, timed to the scenes. Writes `out/music.wav`.
- `scripts/render.cjs`: opens the page in headless Chromium (Playwright), captures every frame and encodes the MP4 with ffmpeg.
- Font: Nunito (SIL Open Font License, see `src/fonts/NUNITO-LICENSE`). Emoji: Noto Color Emoji from the system.

## Rebuild

Needs Node 18+, Playwright with Chromium, and ffmpeg.

```bash
node video/scripts/build-geo.mjs      # only if the map data changed
node video/scripts/music.mjs
node video/scripts/render.cjs         # about 5 minutes
```

To check single frames while editing:

```bash
node video/scripts/render.cjs --stills 3,20,45 --dir /tmp/stills
```

`--from` and `--to` render just part of the timeline (without audio).
