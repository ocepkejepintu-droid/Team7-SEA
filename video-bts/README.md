# Hai Pantai: built in one hour

A 30-second vertical film (1080×1920, 60 fps, with a soundtrack) for Reels, Shorts and TikTok. It shows what Hai Pantai does, then how we built the game and its launch film in about an hour.

**Watch:** [`out/hai-pantai-built-in-1-hour.mp4`](out/hai-pantai-built-in-1-hour.mp4)

## The script

120 BPM, so the cuts land on the beat. From 0:10 to the end, a live build clock sits at the top. It shows the time in WITA and the time elapsed since the first line of code (T+). A ticker at the bottom shows each commit as it lands.

| Time | Scene | What it shows |
|---|---|---|
| 0:00 | Hook | *One hour. One game. One film. For Bali's trash.* A 60:00 clock starts ticking over the Bali coast. |
| 0:03 | What we shipped | The Hai Pantai logo builds itself, then the phone: **01** snap the trash (Claude vision boxes the bottles: Bottles, size L, +40), **02** clean it up (before/after wipe, clean score 92, +220 on a hotspot), **03** win the beach (Kuta climbs to #1). |
| 0:08.5 | Rewind | *How?* The clock spins back from 16:15:00 to 15:14:41, the first line of code. |
| 0:09.75 | The brain | One **Fable 5.2** master session takes the prompt (a game for Bali's trash and its launch film, in one hour). It sends the 10 plan tasks to **Opus 5.5** executors and gives the launch film its own session. |
| 0:12 | The swarm | The master spawns **50+ nested sessions** in eight lanes (Assets, Backend, Game rules, Satellite map, Trash AI, Polygons, Web app, Deploy), all working at once. |
| 0:16 | Managed agents | Two agents at once: one traces the 716 village polygons and 173 beaches over a satellite-style map, the other types the trash in a real report photo. |
| 0:19 | Meanwhile, the humans | The team renames *Pantai League* to *Hai Pantai*, the logo appears, and four feature requests (Workshop tab, 中文 · Bahasa, share cards, dark mode) drop into sessions that are already running. |
| 0:22.25 | On GitHub, live | The real commit feed and a grid of the hour, minute by minute, up to the merge of PR #5. |
| 0:24.75 | Another session | The motion video session: the launch film's scenes land on a timeline and play in the preview, using frames from the real launch film. It commits `e52f791` at 16:14:50 (T+60:09). |
| 0:27.5 | Shipped | *Hai Pantai. Game + film in ~1 hour.* 1 Fable 5.2 master · 50+ Opus 5.5 sessions · 31 commits, 5 PRs merged. Team7 credits. |

The commits, hashes and times on screen come from `git log` for this repo, converted to WITA (UTC+8). The hour is counted from the first code commit, the scaffold at 15:14:41. It ends with the launch film at 16:14:50 and the motion explainer at 16:15:00, so the film says "~1 hour". The design spec was committed earlier, at 15:10:07, and is not counted. The session counts and the agent setup come from the team's account of the build.

## Rebuild

Needs Node, ffmpeg and Playwright's Chromium.

```bash
cd video-bts
node audio.mjs             # soundtrack -> out/soundtrack.wav
node render.mjs            # frames -> out/hai-pantai-built-in-1-hour.mp4 (about 3 min on 4 cores)
node render.mjs --from 13 --to 17.5 --fps 30   # one scene, for review
node snap.mjs /tmp/stills 4 14 26               # stills at those times
```

Preview live: open `src/index.html?play` (or `?play=13` to start at 0:13), or `?t=20` for a single frame.

## How it is built

| File | What it does |
|---|---|
| `src/timeline.js` | Scene times, the real commit list, the build clock (film time → WITA) and every sound cue. The page and the soundtrack both read it |
| `src/film.js` | The ten scenes, the HUD and the commit ticker. Each scene plays at the speed set in `SEG` in `src/timeline.js` |
| `assets/film/` | Nine frames from the launch film (`video/out/hai-pantai-launch.mp4` on the launch film branch), shown in the motion video scene |
| `src/lib.js`, `src/art.js`, `src/geo.js` | Motion engine, logo mark, phone and Bali geometry, reused from the launch film |
| `audio.mjs` | Synthesized score: a dark pulse, tropical house for the product, a tape stop, a D minor arpeggio that adds a layer each scene, and a D major finale. Plus about 25 sound effects |
| `render.mjs` | Headless Chromium workers pipe frames into ffmpeg (x264), then the audio is muxed and normalized to −14 LUFS |

Everything is made in code. There is no stock footage or stock audio. The report photo is a real player report from the live app. The Nunito font in `assets/` is under the SIL Open Font License (`assets/NUNITO-LICENSE`). The terminal text uses JetBrains Mono from the system, and falls back to DejaVu Sans Mono.
