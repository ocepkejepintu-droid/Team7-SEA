import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Beach, Report, Size, TrashType } from "../../shared/types";
import { beaches } from "../../shared/coast";
import { cleanPoints, isHotspot, league, reportPoints, weekStart } from "../../shared/game";
import { createStore, type Store, type StoredPlayer } from "./store";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/** mulberry32 */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAYERS: [string, string][] = [
  ["Wayan", "🐢"], ["Komang", "🐬"], ["Made", "🦀"], ["Ketut", "🐙"], ["Putu", "🐠"],
  ["Sari", "🌊"], ["Lena", "🏄"], ["Tom", "🦈"], ["Aiko", "🐚"], ["Marco", "🌴"],
];
const NOTES = ["Near the lifeguard tower", "Washed up after the rain", "Behind the warung", "By the river mouth", "Under the pandan trees", "Next to the boats", "Plastic cups and straws", "Tangled in seaweed"];
const TYPES: TrashType[] = ["plastic", "bottles", "nets", "organic", "mixed", "other"];
const BIAS: Record<"S" | "M" | "L", [number, number, number]> = { S: [0.75, 0.22, 0.03], M: [0.3, 0.5, 0.2], L: [0.15, 0.4, 0.45] };

type Profile = { match: (name: string) => boolean; n: number; cleaned: number; bias: "S" | "M" | "L"; openSize?: Size };
const eq = (x: string) => (n: string) => n.toLowerCase() === x.toLowerCase();
const starts = (...xs: string[]) => (n: string) => xs.some((x) => n.toLowerCase().startsWith(x.toLowerCase()));

// Order sets the story: Sanur spotless, Kuta in bad shape.
const PROFILES: Profile[] = [
  { match: eq("Sanur"), n: 7, cleaned: 6, bias: "S", openSize: "S" },
  { match: eq("Pecatu"), n: 5, cleaned: 3, bias: "S" },
  { match: starts("Padangbai", "Padang Bai"), n: 5, cleaned: 3, bias: "S" },
  { match: eq("Jimbaran"), n: 5, cleaned: 3, bias: "M" },
  { match: eq("Purwa Kerthi"), n: 4, cleaned: 2, bias: "M" },
  { match: eq("Seminyak"), n: 5, cleaned: 2, bias: "M" },
  { match: eq("Canggu"), n: 6, cleaned: 2, bias: "M" },
  { match: eq("Legian"), n: 6, cleaned: 1, bias: "L" },
  { match: eq("Kuta"), n: 8, cleaned: 1, bias: "L" },
  { match: eq("Tibubeneng"), n: 2, cleaned: 0, bias: "M" },
  { match: eq("Pererenan"), n: 2, cleaned: 0, bias: "M" },
  { match: eq("Tanjung Benoa"), n: 2, cleaned: 0, bias: "L" },
  { match: eq("Benoa"), n: 2, cleaned: 0, bias: "L" },
];
const FILL: Omit<Profile, "match">[] = [
  { n: 5, cleaned: 2, bias: "M" }, { n: 5, cleaned: 1, bias: "M" }, { n: 4, cleaned: 2, bias: "S" }, { n: 4, cleaned: 1, bias: "L" },
];
const TOTAL = 60;

function assetsDir(): string {
  if (process.env.ASSETS_DIR) return path.resolve(process.env.ASSETS_DIR);
  let here = process.cwd();
  try { here = path.dirname(fileURLToPath(import.meta.url)); } catch { /* cwd */ }
  const c = [path.resolve(here, "../assets"), path.resolve(here, "./assets"), path.resolve(process.cwd(), "server/assets"), path.resolve(process.cwd(), "assets")];
  return c.find((d) => fs.existsSync(path.join(d, "placeholder-1.svg"))) ?? c[0];
}

function pointOnCoast(b: Beach, rnd: () => number): [number, number] {
  const lines = b.coast.filter((l) => l.length > 0);
  if (!lines.length) return b.center;
  const len = (l: [number, number][]) => { let s = 0; for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); return s; };
  const lens = lines.map(len);
  const total = lens.reduce((a, x) => a + x, 0);
  let pick = rnd() * total, li = 0;
  while (li < lines.length - 1 && pick > lens[li]) { pick -= lens[li]; li++; }
  const l = lines[li];
  if (l.length === 1 || total === 0) return l[0];
  let d = rnd() * lens[li];
  for (let i = 1; i < l.length; i++) {
    const seg = Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
    if (d <= seg || i === l.length - 1) {
      const t = seg ? Math.min(1, d / seg) : 0;
      return [+(l[i - 1][0] + (l[i][0] - l[i - 1][0]) * t).toFixed(6), +(l[i - 1][1] + (l[i][1] - l[i - 1][1]) * t).toFixed(6)];
    }
    d -= seg;
  }
  return l[l.length - 1];
}

export function seed(store: Store, opts: { reset?: boolean; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const rnd = prng(20261110);
  const pickW = (w: number[]) => { let x = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return i; } return w.length - 1; };
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

  if (opts.reset) {
    store.db.players = [];
    store.db.reports = [];
    for (const f of fs.readdirSync(store.photosDir)) fs.rmSync(path.join(store.photosDir, f), { force: true });
  } else {
    store.db.players = store.db.players.filter((p) => !p.seeded);
    store.db.reports = store.db.reports.filter((r) => !r.seeded);
  }

  const src = assetsDir();
  for (const f of ["placeholder-1.svg", "placeholder-2.svg", "placeholder-3.svg", "placeholder-4.svg", "placeholder-clean.svg"])
    fs.copyFileSync(path.join(src, f), path.join(store.photosDir, f));

  // Beaches: profiles by name, then deterministic fill up to 9.
  const used = new Set<string>();
  const plan: { beach: Beach; p: Omit<Profile, "match"> }[] = [];
  for (const p of PROFILES) {
    const b = beaches.find((x) => !used.has(x.id) && p.match(x.name)) ?? (p.match("sanur") ? beaches.find((x) => !used.has(x.id) && /^sanur/i.test(x.name)) : undefined);
    if (b) { used.add(b.id); plan.push({ beach: b, p }); }
  }
  const rest = beaches.filter((b) => !used.has(b.id) && b.coast.length).sort((a, b) => a.id.localeCompare(b.id));
  let fi = 0;
  while (plan.length < 9 && rest.length) {
    const b = rest.splice(Math.floor(rnd() * rest.length), 1)[0];
    used.add(b.id);
    // Slot the fill beaches into the middle of the table.
    plan.splice(Math.min(3 + fi, plan.length), 0, { beach: b, p: FILL[fi % FILL.length] });
    fi++;
  }
  // Exactly TOTAL reports: trim from the end or add to the worst beaches.
  let sum = plan.reduce((a, x) => a + x.p.n, 0);
  const counts = plan.map((x) => ({ ...x.p }));
  for (let i = counts.length - 1; sum > TOTAL && i >= 0; i--) while (sum > TOTAL && counts[i].n > 1) { counts[i].n--; counts[i].cleaned = Math.min(counts[i].cleaned, counts[i].n - 1); sum--; }
  const bad = counts.map((c, i) => [c, i] as const).filter(([c]) => c.bias === "L").map(([, i]) => i);
  for (let k = 0; sum < TOTAL; k++) { counts[bad.length ? bad[k % bad.length] : counts.length - 1].n++; sum++; }

  const players: StoredPlayer[] = PLAYERS.map(([nickname, avatar], i) => ({
    id: `seed-p${i + 1}`, nickname, avatar, createdAt: new Date(now.getTime() - 7 * DAY + i * HOUR).toISOString(),
    seeded: true, token: crypto.randomBytes(24).toString("base64url"),
  }));
  const ws = weekStart(now).getTime();
  const reports: Report[] = [];
  let k = 0;
  plan.forEach(({ beach }, bi) => {
    const c = counts[bi];
    for (let j = 0; j < c.n; j++) {
      const cleaned = j < c.cleaned;
      const drawn = (["S", "M", "L"] as Size[])[pickW(BIAS[c.bias])];
      const size = !cleaned && c.openSize ? c.openSize : drawn;
      const [lng, lat] = pointOnCoast(beach, rnd);
      const age = 0.5 * HOUR + rnd() * (6 * DAY - HOUR);
      const created = now.getTime() - age;
      const by = pick(players).id;
      const report: Report = {
        id: `seed-r${String(++k).padStart(2, "0")}`, beachId: beach.id, lng, lat,
        type: TYPES[pickW([4, 3, 1, 1, 2, 1])], size,
        ...(rnd() < 0.35 ? { note: pick(NOTES) } : {}),
        photo: `placeholder-${1 + Math.floor(rnd() * 4)}.svg`, by, createdAt: new Date(created).toISOString(),
        status: "open", points: reportPoints(size), seeded: true,
      };
      if (cleaned) {
        const from = rnd() < 0.8 ? Math.max(created + 0.5 * HOUR, ws) : created + 0.5 * HOUR;
        const at = new Date(Math.min(now.getTime() - 5 * 60_000, from + rnd() * Math.max(0, now.getTime() - 5 * 60_000 - from)));
        const score = 60 + Math.floor(rnd() * 39);
        const cleaner = pick(players.filter((p) => p.id !== by)).id;
        const hotspot = isHotspot(report, at);
        const points = cleanPoints(report, score, at);
        report.status = "cleaned";
        report.clean = { by: cleaner, photo: "placeholder-clean.svg", score, reason: pick(["Spot looks clear of trash", "Trash removed, sand is clean", "Bottles and bags are gone", "Clean beach, nice work"]), verified: true, at: at.toISOString(), points, hotspot };
      }
      reports.push(report);
    }
  });

  store.db.players.push(...players);
  store.db.reports.push(...reports);
  store.save();
  store.flush();
  return { players: players.length, reports: reports.length, cleaned: reports.filter((r) => r.status === "cleaned").length, beaches: new Set(reports.map((r) => r.beachId)).size };
}

const entry = process.argv[1] ?? "";
if (/seed\.(ts|mjs|js)$/.test(entry)) {
  const store = createStore();
  const out = seed(store, { reset: process.argv.includes("--reset") });
  console.log(`seeded ${out.players} players, ${out.reports} reports (${out.cleaned} cleaned) on ${out.beaches} beaches into ${store.dataDir}`);
  const top = league(store.db.reports, new Date(), beaches.map((b) => ({ id: b.id, name: b.name }))).slice(0, 5);
  for (const s of top) console.log(`  #${s.rank} ${s.name}: health ${s.health}, open ${s.open}, cleaned this week ${s.cleanedThisWeek}`);
}
