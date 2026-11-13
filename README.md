# Hai Pantai

A phone-first web app for the Bali coast. People report trash with a photo and a pin, anyone can clean it up and post an after photo, and beaches compete: the beach with the fewest open reports wins the week. Players earn personal points and badges.

Hackathon demo, built 10 Nov 2026. Design: [`docs/superpowers/specs/2026-11-10-pantai-league-design.md`](docs/superpowers/specs/2026-11-10-pantai-league-design.md).

## How it works

| Part | Path | What it does |
|---|---|---|
| Game rules | `shared/game.ts` | Points, hotspots, beach health, the league, badges and the weekly challenge. Used by the server and the app |
| Coast | `shared/coast.json`, `shared/coast.ts` | Bali's beaches (one per coastal village) and their coastlines, derived from the 716 village polygons. Snaps a pin to the nearest coast |
| Server | `server/` | One Node service with no runtime dependencies: REST API, a JSON-file store, photos on disk, Claude vision for photo tags and cleanup checks |
| App | `web/` | React, Tailwind and MapLibre. One map with Map and Satellite modes (Esri World Imagery). English, 简体中文 and Bahasa Indonesia (`web/src/lib/i18n.ts`), light and dark themes (`web/src/lib/theme.ts`) |

The village polygons and the map engine patterns come from `ocepkejepintu-droid/BaliPropertyGodView`. The village boundaries are BIG RBI 1:10K. Satellite tiles stream from Esri World Imagery at view time and are never stored; Esri requires attribution and its terms limit some commercial uses.

## Languages and themes

The app starts in the browser's language (English, Chinese or Indonesian; anything else gets English) and in the system's light or dark theme. Players change either on the welcome screen or under **Me**, and the choice is kept in the browser.

All interface text lives in `web/src/lib/i18n.ts`, one dictionary per language. English defines the keys, the type checker rejects a language with a missing key, and `i18n.test.ts` checks that placeholders match. To add a language, add a dictionary and an entry in `LANGS`, then add it to `asLang` and `WRITE_IN` in `server/src/claude.ts` so Claude writes its photo notes in that language too.

Beach and regency names are place names and stay as they are. Notes Claude wrote for a cleanup are stored once, in the language of the player who cleaned.

## Develop

```bash
npm install
npm run seed -w server -- --reset   # demo players and reports into server/data
npm run dev                         # API on :8791, app on http://localhost:5173
npm test                            # game rules, coast, server and app tests
```

Claude features need `ANTHROPIC_API_KEY` in the environment of the server. Without it the app still works: players pick the tags themselves and cleanups count as unverified.

To rebuild the coast data (needs a checkout of BaliPropertyGodView next to this repo):

```bash
npm run coast
```

## Deploy to the VPS

```bash
bash scripts/release.sh
scp release/pantai.tgz ubuntu@43.163.0.197:
ssh ubuntu@43.163.0.197 'tar xzf pantai.tgz && sudo bash pantai/deploy/setup.sh'
```

`setup.sh` installs Node if needed, creates the `pantai` service on port 8791, reuses the Claude key from `/etc/kering-relay/relay.env` (or asks for one), seeds the demo data on the first install and writes `/etc/nginx/snippets/pantai.conf`. On the first install, add `include snippets/pantai.conf;` to the nginx server block and reload nginx. The app is then at `http://43.163.0.197/pantai/`.

Running it again updates the app and keeps the data.

### Domain and HTTPS (haipantai.online)

1. At the domain registrar, add two A records pointing at `43.163.0.197`: `haipantai.online` (host `@`) and `www`.
2. Once they resolve (`dig +short haipantai.online` prints the IP), run on the VPS:

```bash
ssh ubuntu@43.163.0.197 'sudo bash pantai/deploy/domain.sh haipantai.online'
```

`domain.sh` checks the DNS, adds an nginx site for the domain that proxies to the app on port 8791, and gets a Let's Encrypt certificate with certbot (HTTP redirects to HTTPS, renewal is automatic). The app is then at `https://haipantai.online/`, and `http://43.163.0.197/pantai/` keeps working.

## Limits

- On the bare-IP address (plain HTTP) browsers block GPS, so "Locate me" only shows on `https://haipantai.online` or localhost; the pin can always be placed by hand.
- No accounts, moderation or duplicate detection. A player is a nickname and a token in the browser.
- Seeded reports are demo data with illustrated placeholders, and are labelled "demo".
