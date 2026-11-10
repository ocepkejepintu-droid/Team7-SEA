# Pantai League: design

Working name, rename freely. Status: agreed in chat on 10 Nov 2026, for a hackathon demo due the same day (about 2 hours).

## What it is

A phone-first web app where people report trash on the Bali coast and clean it up. Beaches compete in a league: the beach with the fewest **open** (reported, not yet cleaned) reports is the winner. Players also earn personal points and badges.

It is a new app with its own name and look. It reuses engine code from `ocepkejepintu-droid/BaliPropertyGodView` (Kering's MapLibre setup, the 716 village polygons, the shadcn components) to save time. It does not reuse the GodView or Kering visual identity.

## Decisions

| Topic | Decision |
|---|---|
| Purpose | Hackathon demo only. Polish and a complete flow over robustness |
| Core loop | Report (photo + pin) → anyone cleans it (after photo) → the beach gets healthier |
| Competition | **Beaches** compete. Rank by health = 100 − weight of open reports. A beach with no reports in the last 7 days is listed as "No data yet", not ranked, so not reporting never wins |
| Players | Nickname + emoji avatar, no login, token kept in localStorage. Personal points and badges. Teams: next phase |
| Location | The pin can go anywhere on the coast. GPS ("Locate me") pre-places the pin when the page runs on HTTPS or localhost, and is hidden otherwise. A pin outside the coastal band snaps to the nearest coast point |
| Coverage | Whole Bali coast. A "beach" is one coastal desa (village), named after it |
| Map | One MapLibre map, two modes: **Map** (village polygons, no tiles) and **Satellite** (Esri World Imagery raster tiles, with attribution) |
| AI | Claude vision tags the report photo (type, size) and compares before/after photos on cleanup (clean score 0–100). If Claude fails, the player's own tags are used and the cleanup counts as "unverified" with score 70 |
| Mechanics | Points, badges, hotspots (×2), beach health meter, one weekly challenge |
| Data | Shared live: one Node service with a JSON-file store and photos on disk. The app polls every 5 s |
| Deploy | The team's VPS 43.163.0.197 over plain HTTP, path `/pantai/`, behind nginx, run by systemd, installed by one `setup.sh` run over SSH. The Claude key comes from `/etc/kering-relay/relay.env` or a prompt |

## Game rules (server-side)

- Size multiplier: S = 1, M = 2, L = 4.
- Report: `10 × mult` points.
- Hotspot: an open report that is size L or older than 48 h.
- Clean: `round(30 × mult × score / 100)`, ×2 if the report was a hotspot. A clean score below 40 earns 0 points and leaves the report open ("Claude still sees trash").
- Health weight of an open report: S = 5, M = 10, L = 20. Beach health = `max(0, 100 − sum of open weights)`.
- League: beaches with at least one report created in the last 7 days. Sort by health (descending), then cleans this week (descending), then name.
- Badges: `first_report`, `first_clean`, `ten_cleans` (10 cleans), `hotspot_hunter` (cleaned a hotspot), `big_haul` (cleaned an L), `three_beaches` (reported on 3 different beaches).
- Weekly challenge: "Clean 50 spots this week". Counts cleans since Monday 00:00 WITA (UTC+8).

## Screens

1. **Onboarding:** nickname and an emoji avatar.
2. **Map:** beaches coloured by health, report pins (red = open, glowing = hotspot, green = cleaned), a Map/Satellite toggle, Locate me, a challenge banner and a big **Report trash** button.
3. **Report sheet:** take or pick a photo, see Claude's tags (editable), confirm the pin on the map, submit, see the points.
4. **Report detail:** photo, beach, status and an **I cleaned this** button that leads to the after photo, Claude's verdict and the points.
5. **League:** beach table (rank, health bar, open reports) with the winner on top; a Players tab with the top 20 by points.
6. **Profile:** points, badges and my reports.

## Seed data

About 60 reports from 10 demo players over Kuta, Legian, Seminyak, Canggu, Sanur, Jimbaran, Pecatu, Padangbai and Amed (Purwakerthi), dated over the last 6 days, a third of them cleaned. They are flagged `seeded: true` and the app labels them "demo". They use illustrated SVG placeholders, never fake photos.

## Out of scope (next phase)

Teams, accounts, GPS enforcement, duplicate detection, moderation, HTTPS, the Wayback time lens.

## Cut order if time runs out

The weekly challenge, then badges down to 3, then Satellite mode.
