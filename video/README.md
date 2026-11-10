# Hai Pantai launch film

A 1:43 launch video for the hackathon presentation: 1920×1080, 60 fps, with a soundtrack.

**Watch:** [`out/hai-pantai-launch.mp4`](out/hai-pantai-launch.mp4)

Everything in it is made in code: vector illustrations, the app's real colours and font (Nunito), the real Bali map (716 village polygons and 173 beach coastlines from `web/public/land.json` and `shared/coast.json`), and a synthesized score. There is no stock footage or stock audio, so nothing needs a licence.

## The script

The film is 43 bars at 100 BPM, so every cut lands on the beat.

| Time | Scene | What it says |
|---|---|---|
| 0:00 | Cold open | The tide brings Bali a little gift. Plastic. Bottles. Nets. And it's back tomorrow. |
| 0:09 | The problem | The real Bali coast draws itself: 173 coastal beaches. Trash pops up along it. No one knows where it is, and no one keeps score. *What if the coast was a game?* |
| 0:19 | Logo (the drop) | **Hai Pantai** ("hi, beach"). Report it. Clean it. Win the beach. |
| 0:26 | How it works | One loop, three moves: Report → Clean → Compete, and the beach gets healthier. |
| 0:31 | Step 01: Report | On the phone: tap *Report trash*, take a photo, Claude vision finds the bottles and the bag and tags them *Bottles, size L*, the pin snaps to the Kuta coast, +40 points (10 × size) and the *First report* badge. |
| 0:45 | Step 02: Clean | The report is a hotspot. *I cleaned this*, after photo, before/after wipe, Claude's clean score climbs to 92, verified. 30 × 4 × 92% = 110, × 2 for the hotspot = **+220**. The pin turns green. Under 40, Claude still sees trash and the report stays open. |
| 1:00 | Step 03: Compete | Kuta's health = 100 − open trash (S 5, M 10, L 20). Reports drop it from 100 to 35 and to the bottom of the league; cleanups bring it to 95 and the crown. A beach with no reports this week isn't ranked, so hiding trash never wins. |
| 1:14 | Game layer | Six badges, hotspots pay ×2, the weekly *Clean 50 spots* challenge, and the players' leaderboard. |
| 1:24 | Under the hood | Phone app (React, Tailwind, MapLibre, Map and Satellite) polls a Node service with no runtime dependencies every 5 s; Claude vision tags photos and checks cleanups; the Bali data and one shared rules file. Without an API key it still works. |
| 1:33 | Finale | A green wave sweeps the coast and open reports count down to 0. *Hai Pantai. Bali's coast is the scoreboard.* Play the demo. |

All numbers on screen follow the real rules in `shared/game.ts`.

## Rebuild

Needs Node, ffmpeg and Playwright's Chromium.

```bash
cd video
node build-geo.mjs          # Bali geometry -> src/geo.js (already committed)
node audio.mjs              # soundtrack -> out/soundtrack.wav
node render.mjs             # frames -> out/hai-pantai-launch.mp4 (about 10 min)
```

- Preview live in a browser: open `src/index.html?play` (or `?play=45` to start at 0:45). `?t=52.5` shows one frame.
- `node render.mjs --from 31.2 --to 45.6 --fps 30` renders one scene for review.
- `node snap.mjs <dir> 10 20 30` saves stills at those times.

## How it is built

| File | What it does |
|---|---|
| `src/timeline.js` | Scene start times and every sound cue. The page and the soundtrack both read it, which keeps them in sync |
| `src/lib.js` | A small motion engine: easings, springs, kinetic type and stroke drawing. Every frame is a pure function of time, so frames render exactly and in parallel |
| `src/art.js` | The logo mark (built from the app's favicon, split into parts so the sun can rise and the wave can draw), beach photo illustrations, the phone, map pins |
| `src/scenes-*.js` | The ten scenes |
| `audio.mjs` | Tropical house in D major (pad, marimba arp, bass, kick with sidechain, clap, shaker), ocean noise, about 20 kinds of UI sound effects, and a Schroeder reverb |
| `render.mjs` | Three headless Chromium workers pipe JPEG frames into ffmpeg (x264, CRF 16), then the audio is muxed in and normalized to −14 LUFS |

The Nunito font in `assets/` is from Fontsource under the SIL Open Font License (`assets/NUNITO-LICENSE`).
