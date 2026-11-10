# Hai Pantai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first web app where people report and clean coastal trash on Bali and beaches compete in a league, deployed to the team VPS within about 2 hours.

**Architecture:** One repo with three parts. `shared/` holds pure TypeScript game rules and coast geometry helpers, used by both sides. `server/` is a zero-dependency Node HTTP service (JSON-file store, photos on disk, Claude vision via `fetch`), bundled with esbuild into one `.mjs`. `web/` is a Vite + React + Tailwind app on MapLibre, served by the same service under `/pantai/`.

**Tech Stack:** Node 20+, TypeScript 5.9, Vite 6, React 19, Tailwind 4, shadcn/ui components copied from Kering, MapLibre GL 5.24, @turf/turf 7 (build script and server), Vitest 2, esbuild.

**Spec:** `docs/superpowers/specs/2026-11-10-pantai-league-design.md`

## Global Constraints

- Engine source to copy from: `/home/user/balipropertygodview/hackathon/kering/web` (MapLibre setup, `components/ui/*`, `lib/utils.ts`) and `land-scout/data/villages.js` (716 desa, properties `desa`, `kec`, `kab`).
- A new visual identity, not GodView/Kering: ocean teal primary `#0e9f9a`, sand background `#fbf6ec`, coral alert `#ff6b4a`, health green `#22c55e`, amber `#f59e0b`, rounded 16px cards, font "Nunito Variable" via `@fontsource-variable/nunito`. Dark mode is not needed.
- App base path `/pantai/` (Vite `base: "./"`, API calls relative: `api/...`).
- Claude model `claude-sonnet-5-5`, key from env `ANTHROPIC_API_KEY`, optional `ANTHROPIC_BASE_URL` for tests.
- Every game number is copied from the spec's "Game rules" section; they live only in `shared/game.ts`.
- Esri attribution text: "Imagery © Esri, Maxar, Earthstar Geographics". Tile URL: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`.
- Seeded data is flagged `seeded: true` and shown with a "demo" chip.
- Commit after every task. Push to `cc/stoic-babbage-svq0az`.

## Review Focus

- A photo over 5 MB from a phone camera: the client resizes it to at most 1280 px JPEG at quality 0.8 before upload; the server rejects bodies over 3 MB with 413 and a readable message. (Test in Task 4 and Task 6.)
- Claude is down or returns non-JSON: report still saves with the player's tags; cleanup counts as unverified with score 70. (Test in Task 4.)
- A pin dropped far out at sea or inland: snaps to the nearest coast point and its beach. (Test in Task 2.)
- Two phones clean the same report at once: the second gets 409 "Already cleaned" and no points. (Test in Task 4.)
- A missing or unknown player token: 401 on writes, `GET /api/state` still works without `me`. (Test in Task 4.)

---

### Task 1: Scaffold the repo

**Files:**
- Create: `package.json` (npm workspaces `shared`, `server`, `web`; scripts `test`, `build`, `dev`)
- Create: `shared/package.json`, `shared/tsconfig.json`
- Create: `server/package.json`, `server/tsconfig.json`
- Create: `web/` from a copy of Kering `web/` minus `src/views`, `src/lib` (keep `lib/utils.ts`), `src/components` except `ui/`; rename the package to `pantai-web`; drop `vite-plugin-singlefile` and `cmdk`; add `@fontsource-variable/nunito`
- Create: `web/src/styles.css` with the new tokens from Global Constraints
- Create: `.gitignore` (`node_modules`, `dist`, `server/data`, `.env`)

- [ ] **Step 1:** Copy the files and install: `npm install`. Expected: no errors.
- [ ] **Step 2:** `web/src/App.tsx` renders "Hai Pantai". Run `npm run build -w web`. Expected: `web/dist/index.html` exists.
- [ ] **Step 3:** Commit `chore: scaffold pantai league workspaces`.

### Task 2: Coast data and beach lookup

**Files:**
- Create: `scripts/build-coast.mjs`
- Create: `shared/coast.ts`
- Create: `shared/coast.json` (generated, committed)
- Test: `shared/coast.test.ts`

**Interfaces:**
- Produces: `shared/coast.json` = `{ beaches: Beach[] }` where `Beach = { id: string; name: string; kab: string; center: [number, number]; coast: [number, number][][] /* coast polylines */; polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon }`. `id` is a slug of `desa` plus `kab` (e.g. `canggu-badung`).
- Produces: `snapToCoast(lng: number, lat: number): { beachId: string; lng: number; lat: number; distanceM: number }` and `beachById(id: string): Beach | undefined` in `shared/coast.ts`.

Coast detection in `build-coast.mjs`: for each polygon boundary edge, take its midpoint, offset it 40 m along the outward normal on both sides, and mark the edge as coast if either offset point lies in no desa polygon (bbox prefilter, then `@turf/boolean-point-in-polygon`). A desa is a beach if its coast edges total at least 200 m. Join consecutive coast edges into polylines and simplify them to 10 m.

- [ ] **Step 1: Write the failing tests**

```ts
test("famous beaches are coastal", () => {
  for (const n of ["Canggu", "Kuta", "Sanur Kaja", "Jimbaran", "Pecatu"]) expect(beaches.some(b => b.name === n)).toBe(true);
});
test("inland villages are not beaches", () => {
  for (const n of ["Ubud", "Kintamani"]) expect(beaches.some(b => b.name === n)).toBe(false);
});
test("a pin at sea off Kuta snaps to Kuta's coast", () => {
  const s = snapToCoast(115.160, -8.720);
  expect(beachById(s.beachId)!.name).toBe("Kuta");
  expect(s.distanceM).toBeGreaterThan(0);
});
test("a pin far inland snaps to some coast within 40 km", () => {
  expect(snapToCoast(115.26, -8.45).distanceM).toBeLessThan(40_000);
});
test("there are between 100 and 400 beaches", () => {
  expect(beaches.length).toBeGreaterThan(100); expect(beaches.length).toBeLessThan(400);
});
```

If a named desa is spelt differently in `villages.js` (check with `grep`), use the spelling in the file and note it in the test.

- [ ] **Step 2:** Run `npx vitest run shared/coast.test.ts`. Expected: FAIL (no coast.json).
- [ ] **Step 3:** Implement the script and `shared/coast.ts` (`snapToCoast` uses `@turf/nearest-point-on-line` over the beaches whose bbox is nearest first). Run `node scripts/build-coast.mjs ../balipropertygodview/land-scout/data/villages.js`.
- [ ] **Step 4:** Run the tests. Expected: PASS. Check that `shared/coast.json` is under 1.5 MB.
- [ ] **Step 5:** Commit `feat: derive Bali beaches and coastline from desa polygons`.

### Task 3: Game rules

**Files:**
- Create: `shared/types.ts`, `shared/game.ts`
- Test: `shared/game.test.ts`

**Interfaces:**
- Produces in `shared/types.ts`:
  - `Size = "S" | "M" | "L"`
  - `TrashType = "plastic" | "bottles" | "nets" | "organic" | "mixed" | "other"`
  - `Player = { id; nickname; avatar; createdAt: string; seeded?: boolean }`
  - `Clean = { by: string; photo: string; score: number; reason: string; verified: boolean; at: string; points: number }`
  - `Report = { id; beachId; lng; lat; type: TrashType; size: Size; note?: string; photo: string; by: string; createdAt: string; status: "open" | "cleaned"; points: number; clean?: Clean; seeded?: boolean }`
  - `BeachStanding = { beachId; name; health: number; open: number; cleanedThisWeek: number; rank: number | null }`
- Produces in `shared/game.ts`: `MULT`, `WEIGHT`, `reportPoints(size)`, `isHotspot(r, now: Date)`, `cleanPoints(r, score, now)`, `beachHealth(reports, beachId)`, `league(reports, now): BeachStanding[]` (ranked first, then unranked with `rank: null`), `playerPoints(reports, playerId)`, `badges(reports, playerId): string[]`, `weekStart(now): Date` (Monday 00:00 WITA), `challenge(reports, now): { goal: 50; done: number }`.

- [ ] **Step 1: Write the failing tests** (`now = new Date("2026-11-10T12:00:00+08:00")`)

```ts
test("report points by size", () => { expect([reportPoints("S"), reportPoints("M"), reportPoints("L")]).toEqual([10, 20, 40]); });
test("L or older than 48 h is a hotspot", () => {
  expect(isHotspot(r({ size: "L" }), now)).toBe(true);
  expect(isHotspot(r({ size: "S", createdAt: "2026-11-08T11:00:00+08:00" }), now)).toBe(true);
  expect(isHotspot(r({ size: "S", createdAt: "2026-11-10T11:00:00+08:00" }), now)).toBe(false);
});
test("clean points: 30 × mult × score, ×2 on hotspot, 0 below 40", () => {
  expect(cleanPoints(r({ size: "M", createdAt: "2026-11-10T11:00:00+08:00" }), 80, now)).toBe(48);
  expect(cleanPoints(r({ size: "L" }), 100, now)).toBe(240);
  expect(cleanPoints(r({ size: "S" }), 39, now)).toBe(0);
});
test("health = 100 − open weights, floored at 0", () => {
  expect(beachHealth([r({ size: "S" }), r({ size: "L" }), r({ size: "M", status: "cleaned" })], "kuta-badung")).toBe(75);
  expect(beachHealth(Array(6).fill(r({ size: "L" })), "kuta-badung")).toBe(0);
});
test("league ranks active beaches only, health then cleans", () => { /* kuta (health 95) above canggu (80); a beach with only 8-day-old reports has rank null */ });
test("week starts Monday 00:00 WITA", () => { expect(weekStart(now).toISOString()).toBe("2026-11-08T16:00:00.000Z"); });
test("badges", () => { /* one report → ["first_report"]; a cleaned L hotspot → includes "first_clean", "big_haul", "hotspot_hunter" */ });
```

`r(partial)` is a test helper that fills a Report on `kuta-badung` created at `now − 1 h`.

- [ ] **Step 2:** Run `npx vitest run shared/game.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `shared/game.ts`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: game rules for points, hotspots, health and league`.

### Task 4: Server API, store and Claude

**Files:**
- Create: `server/src/store.ts` (in-memory state, debounced atomic write to `DATA_DIR/db.json`; photos to `DATA_DIR/photos/<id>.jpg`)
- Create: `server/src/claude.ts`
- Create: `server/src/app.ts` (request handler, no `listen`)
- Create: `server/src/index.ts` (`listen` on `PORT`, default 8791; serves `web/dist` for non-API paths)
- Test: `server/test/api.test.ts`, `server/test/mock-anthropic.ts`

**Interfaces:**
- Consumes: `snapToCoast`, `beachById` (Task 2); everything in `shared/game.ts` (Task 3).
- Produces HTTP API (JSON; writes need header `x-player-token`):
  - `POST /api/players {nickname, avatar}` → `{ player, token }`. Nickname 2–20 characters.
  - `POST /api/ai/tag {photo: base64 jpeg}` → `{ isTrash: boolean; type: TrashType; size: Size; summary: string; ai: boolean }`
  - `POST /api/reports {lng, lat, photo, type, size, note?}` → `{ report, points, newBadges }`. Pin snapped server-side.
  - `POST /api/reports/:id/clean {photo}` → `{ report, points, score, reason, verified, newBadges }`; 409 if already cleaned.
  - `GET /api/state` → `{ reports, league, players: {id,nickname,avatar,points}[] (top 20), challenge, me?: {player, points, badges} }`
  - `GET /api/photos/:id.jpg`
- `claude.ts`: `tagPhoto(b64): Promise<Tag | null>` and `compareCleanup(beforeB64, afterB64): Promise<{score, reason} | null>`; each asks for JSON only and parses the first `{...}` in the reply; `null` on any error or 20 s timeout.
- Limits: body ≤ 3 MB (413 `{"error":"Photo too large"}`), 30 AI calls per token per hour (429).

- [ ] **Step 1: Write the failing tests** (start `app` on a random port, `ANTHROPIC_BASE_URL` pointing at the mock)

```ts
test("join then report earns 20 points for M on the snapped beach", ...);   // beachId of a Kuta sea pin is kuta-badung
test("clean with mock score 90 marks cleaned and returns points", ...);
test("second clean of the same report is 409", ...);
test("mock Claude returning 500: report saves, cleanup verified=false score 70", ...);
test("write without token is 401; GET /api/state without token has no me", ...);
test("body over 3 MB is 413", ...);
test("state survives restart from db.json", ...);
```

- [ ] **Step 2:** Run `npm test -w server`. Expected: FAIL.
- [ ] **Step 3:** Implement. Claude prompts: tag = "You see a photo reported as trash on a Bali beach. Reply with JSON only: {\"is_trash\":bool,\"type\":one of plastic|bottles|nets|organic|mixed|other,\"size\":\"S\"(a handful)|\"M\"(a bag)|\"L\"(more than a bag),\"summary\":\"under 12 words\"}". Compare = "Photo 1 is trash reported on a beach. Photo 2 was taken after a cleanup at the same spot. Reply with JSON only: {\"clean_score\":0-100,\"reason\":\"under 15 words\"}. Score 0 if photo 2 is a different place or still has the trash."
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: pantai API with store, photos and Claude vision`.

### Task 5: Seed script

**Files:**
- Create: `server/src/seed.ts` (run with `npm run seed -w server`; writes into `DATA_DIR`; `--reset` clears first)
- Create: `server/assets/placeholder-*.svg` (4 simple illustrated trash scenes)
- Test: `server/test/seed.test.ts`

- [ ] **Step 1: Write the failing test:** after seeding, 10 players, 55–65 reports, all `seeded: true`, at least 9 distinct beaches, 15–25 cleaned, every `beachId` exists in `coast.json`, and `league()` ranks at least 9 beaches.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement with a fixed random seed. Points are computed with `shared/game.ts`, not hard-coded. Beaches: those in the spec's seed list, using their `coast.json` ids; pins are random points on each beach's coast polyline.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit `feat: seed demo players and reports`.

### Task 6: Web shell, API client and onboarding

**Files:**
- Create: `web/src/lib/api.ts` (typed wrappers for every endpoint; token in localStorage `pantai.token`, wrapped in try/catch)
- Create: `web/src/lib/photo.ts`: `resizePhoto(file: File, max = 1280, quality = 0.8): Promise<string /* base64 */>`
- Create: `web/src/lib/useGame.ts`: polls `GET api/state` every 5 s; exposes `{ state, me, refresh }`
- Create: `web/src/components/Onboarding.tsx` (nickname input and a grid of 12 emoji avatars: 🐢🐬🦀🐙🐠🦈🐳🌊🏄🌴🐚🦭)
- Create: `web/src/App.tsx`: bottom tab bar Map / League / Me; Onboarding when there is no token
- Test: `web/src/lib/photo.test.ts` (the output's longer side is ≤ 1280 for a 4000×3000 input, using a canvas mock)

- [ ] **Step 1:** Write the photo test. Run it. Expected: FAIL.
- [ ] **Step 2:** Implement the files.
- [ ] **Step 3:** Run `npm test -w web` (PASS), then `npm run dev` with the server running, and join as a player in the browser. Expected: the tab bar shows.
- [ ] **Step 4:** Commit `feat: web shell, onboarding and API client`.

### Task 7: Map view

**Files:**
- Create: `web/src/components/GameMap.tsx`
- Create: `web/src/components/ChallengeBanner.tsx`

**Interfaces:**
- Consumes: `shared/coast.json`, `state.reports`, `state.league`.
- Produces: `<GameMap reports league mode onPick?(lng,lat) pickPin? onSelectReport(id) />`

Layers, bottom to top: background sea `#cfe9ea`; desa land fill `#fbf6ec` (Map mode only); a Satellite raster source with Esri tiles (Satellite mode only, attribution shown); beach coast lines 4 px, coloured by health (≥ 80 green, ≥ 50 amber, else coral; grey when unranked); report circles (open = coral, hotspot = coral with a pulsing halo, cleaned = green, smaller). Map/Satellite toggle top-right; Locate me button shown only when `window.isSecureContext`; tapping a report opens the detail. In pick mode a draggable pin follows the tap and snaps with `snapToCoast`, showing the beach name.

- [ ] **Step 1:** Implement. Check in the browser: seeded pins show, the toggle switches to imagery, a tap at sea in pick mode snaps to the coast.
- [ ] **Step 2:** Commit `feat: game map with map and satellite modes`.

### Task 8: Report and clean flows

**Files:**
- Create: `web/src/components/ReportSheet.tsx` (photo input `accept="image/*" capture="environment"` → resize → `api.tag` → editable type/size chips → pick the pin → submit → a points toast)
- Create: `web/src/components/ReportDetail.tsx` (photo, beach, age, hotspot chip, demo chip, status; **I cleaned this** → after photo → spinner "Claude is checking…" → score, reason and points; low score shows "Claude still sees trash")
- Create: `web/src/components/PointsToast.tsx` (+N animation, new badge names)

- [ ] **Step 1:** Implement. Run through it in the browser at 390×844 with Playwright: report a photo at Kuta and clean it. Expected: points go up and Kuta's health changes on the next poll.
- [ ] **Step 2:** Commit `feat: report and cleanup flows`.

### Task 9: League and profile

**Files:**
- Create: `web/src/components/League.tsx` (tabs Beaches / Players; winner card with 🏆 on top; rows: rank, name, health bar, open count; an "No data yet" count at the bottom)
- Create: `web/src/components/Profile.tsx` (avatar, nickname, points, badge grid with locked ones greyed, my reports list)

- [ ] **Step 1:** Implement. Check in the browser.
- [ ] **Step 2:** Commit `feat: beach league and profile`.

### Task 10: Build and deploy kit

**Files:**
- Create: `deploy/setup.sh` (as root: checks Node ≥ 20 or installs Node 22 from NodeSource; creates user `pantai`; copies the release to `/opt/pantai`; `DATA_DIR=/var/lib/pantai`; reads `ANTHROPIC_API_KEY` from `/etc/kering-relay/relay.env` if present, else prompts; writes `/etc/pantai/pantai.env` mode 600; installs and starts `pantai.service`; writes `/etc/nginx/snippets/pantai.conf`; runs the seed once if `db.json` is missing)
- Create: `deploy/pantai.service`, `deploy/nginx-pantai.conf` (`location /pantai/ { proxy_pass http://127.0.0.1:8791/; client_max_body_size 4m; }`)
- Create: `scripts/release.sh` (builds web + server bundle into `release/pantai.tgz`)
- Create: `README.md` (what it is, dev, test, deploy steps)

- [ ] **Step 1:** Run `bash scripts/release.sh`. Expected: `release/pantai.tgz` holding `server.mjs`, `web/`, `deploy/`.
- [ ] **Step 2:** Smoke test locally: `PORT=8791 DATA_DIR=/tmp/p node release/server.mjs` and `curl -fsS localhost:8791/api/state`. Expected: JSON with a league.
- [ ] **Step 3:** Commit `chore: release script and VPS deploy kit`, push, open the PR.
- [ ] **Step 4:** Hand the user the commands: `scp release/pantai.tgz ubuntu@43.163.0.197:` then `ssh ubuntu@43.163.0.197 'tar xzf pantai.tgz && sudo bash pantai/deploy/setup.sh'`, then add `include snippets/pantai.conf;` to the nginx server block and `sudo nginx -t && sudo systemctl reload nginx`. Verify: `curl -fsS http://43.163.0.197/pantai/api/state`.
