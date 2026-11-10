#!/usr/bin/env node
// Derive Bali beaches (coastal desa) and coastlines from desa polygons.
// Usage: node scripts/build-coast.mjs ../balipropertygodview/land-scout/data/villages.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { simplify } from "@turf/turf";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2] || path.resolve(root, "../balipropertygodview/land-scout/data/villages.js");
const text = fs.readFileSync(src, "utf8");
const fc = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
const feats = fc.features;
console.log(`read ${feats.length} desa from ${src}`);

const LAT0 = -8.4;
const MX = 111320 * Math.cos((LAT0 * Math.PI) / 180); // metres per degree lng
const MY = 110574; // metres per degree lat
const OFFSETS = [40, 150]; // outside point must be clear at both
const MAX_PIECE = 150; // m
const MIN_COAST = 200; // m
// Approximate crater/mountain lakes (lng, lat, radius m): shores there are not sea coast.
const LAKES = [
  [115.395, -8.255, 3200], // Batur
  [115.168, -8.280, 1300], // Beratan
  [115.132, -8.250, 1700], // Buyan
  [115.093, -8.260, 1100], // Tamblingan
];

// ---- polygons + grid index ----
const polys = feats.map((f) => {
  const g = f.geometry;
  const rings = g.type === "Polygon" ? g.coordinates : g.coordinates.flat();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rings) for (const [x, y] of r) {
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { rings, bbox: [minX, minY, maxX, maxY] };
});
const CELL = 0.01;
const grid = new Map();
const key = (cx, cy) => cx * 100000 + cy;
polys.forEach((p, i) => {
  const [a, b, c, d] = p.bbox;
  for (let cx = Math.floor(a / CELL); cx <= Math.floor(c / CELL); cx++)
    for (let cy = Math.floor(b / CELL); cy <= Math.floor(d / CELL); cy++) {
      const k = key(cx, cy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }
});
function inRings(rings, x, y) {
  let inside = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
function onLand(x, y) {
  const cand = grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL)));
  if (!cand) return false;
  for (const i of cand) {
    const [a, b, c, d] = polys[i].bbox;
    if (x < a || x > c || y < b || y > d) continue;
    if (inRings(polys[i].rings, x, y)) return true;
  }
  return false;
}
function inLake(x, y) {
  for (const [lx, ly, r] of LAKES) if (Math.hypot((x - lx) * MX, (y - ly) * MY) < r) return true;
  return false;
}
function isSea(x, y, nx, ny) {
  // nx, ny: unit normal in metres space
  for (const o of OFFSETS) {
    const px = x + (nx * o) / MX, py = y + (ny * o) / MY;
    if (onLand(px, py) || inLake(px, py)) return false;
  }
  return true;
}

// ---- coast detection ----
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const TOL = 10 / MY; // ~10 m in degrees

const results = [];
polys.forEach((p, fi) => {
  const lines = [];
  let total = 0;
  for (const ring of p.rings) {
    // pieces: [ [x0,y0],[x1,y1], coast:boolean ]
    const pieces = [];
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i], [x1, y1] = ring[i + 1];
      const dxm = (x1 - x0) * MX, dym = (y1 - y0) * MY;
      const len = Math.hypot(dxm, dym);
      if (len === 0) continue;
      const nx = -dym / len, ny = dxm / len;
      const n = Math.max(1, Math.ceil(len / MAX_PIECE));
      for (let k = 0; k < n; k++) {
        const ax = x0 + ((x1 - x0) * k) / n, ay = y0 + ((y1 - y0) * k) / n;
        const bx = x0 + ((x1 - x0) * (k + 1)) / n, by = y0 + ((y1 - y0) * (k + 1)) / n;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const coast = isSea(mx, my, nx, ny) || isSea(mx, my, -nx, -ny);
        pieces.push({ a: [ax, ay], b: [bx, by], coast, len: len / n, last: k === n - 1 });
      }
    }
    if (!pieces.length) continue;
    // rotate so we start at a non-coast piece (handle wraparound)
    let start = pieces.findIndex((q) => !q.coast);
    if (start === -1) start = 0;
    const order = pieces.slice(start).concat(pieces.slice(0, start));
    let cur = null;
    for (const q of order) {
      if (q.coast) {
        total += q.len;
        if (!cur) cur = [q.a];
        cur.push(q.b);
      } else if (cur) { lines.push(cur); cur = null; }
    }
    if (cur) lines.push(cur);
  }
  // drop interior vertices created by splitting (keep only original + ends) via simplify
  if (total < MIN_COAST) return;
  const coast = [];
  for (const l of lines) {
    let c = l;
    if (c.length > 2) c = simplify({ type: "LineString", coordinates: c }, { tolerance: TOL }).coordinates;
    c = c.map(([x, y]) => [r5(x), r5(y)]).filter((pt, i, arr) => i === 0 || pt[0] !== arr[i - 1][0] || pt[1] !== arr[i - 1][1]);
    if (c.length >= 2) coast.push(c);
  }
  if (!coast.length) return;
  results.push({ fi, coast, total });
});

// ---- ids, center ----
const lineLen = (l) => { let s = 0; for (let i = 1; i < l.length; i++) s += Math.hypot((l[i][0] - l[i - 1][0]) * MX, (l[i][1] - l[i - 1][1]) * MY); return s; };
function midpoint(l) {
  const half = lineLen(l) / 2; let s = 0;
  for (let i = 1; i < l.length; i++) {
    const d = Math.hypot((l[i][0] - l[i - 1][0]) * MX, (l[i][1] - l[i - 1][1]) * MY);
    if (s + d >= half && d > 0) { const t = (half - s) / d; return [r5(l[i - 1][0] + (l[i][0] - l[i - 1][0]) * t), r5(l[i - 1][1] + (l[i][1] - l[i - 1][1]) * t)]; }
    s += d;
  }
  return l[0];
}
const baseCount = new Map();
for (const r of results) { const p = feats[r.fi].properties; const b = `${slug(p.desa)}-${slug(p.kab)}`; baseCount.set(b, (baseCount.get(b) || 0) + 1); }
const used = new Set();
const beachIdByFeat = new Map();
const beaches = results.map((r) => {
  const p = feats[r.fi].properties;
  let id = `${slug(p.desa)}-${slug(p.kab)}`;
  if (baseCount.get(id) > 1) id = `${slug(p.desa)}-${slug(p.kec)}-${slug(p.kab)}`;
  let n = 2; const base = id; while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  beachIdByFeat.set(r.fi, id);
  const longest = r.coast.reduce((a, b) => (lineLen(b) > lineLen(a) ? b : a));
  return { id, name: p.desa, kab: p.kab, center: midpoint(longest), coast: r.coast };
});
beaches.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(root, "shared/coast.json"), JSON.stringify({ beaches }));

// ---- land.json ----
const LAND_TOL = 25 / MY;
const land = {
  type: "FeatureCollection",
  features: feats.map((f, fi) => {
    let g = f.geometry;
    try { g = simplify({ type: "Feature", properties: {}, geometry: g }, { tolerance: LAND_TOL }).geometry; } catch { /* keep original */ }
    const rnd = (ring) => ring.map(([x, y]) => [r5(x), r5(y)]).filter((pt, i, arr) => i === 0 || pt[0] !== arr[i - 1][0] || pt[1] !== arr[i - 1][1]);
    const fixPoly = (poly) => poly.map(rnd).filter((r) => r.length >= 4);
    const coordinates = g.type === "Polygon" ? fixPoly(g.coordinates) : g.coordinates.map(fixPoly).filter((p) => p.length);
    return { type: "Feature", properties: { b: beachIdByFeat.get(fi) ?? null, n: f.properties.desa }, geometry: { type: g.type, coordinates } };
  }),
};
fs.mkdirSync(path.join(root, "web/public"), { recursive: true });
fs.writeFileSync(path.join(root, "web/public/land.json"), JSON.stringify(land));

const kb = (f) => (fs.statSync(path.join(root, f)).size / 1024).toFixed(0) + " KB";
console.log(`${beaches.length} beaches; coast.json ${kb("shared/coast.json")}; land.json ${kb("web/public/land.json")}`);
const want = /^(kuta|legian|seminyak|canggu|sanur.*|jimbaran|pecatu|padangbai|purwa kerthi)$/i;
const nusa = new Set(["Nusa Penida"]);
for (const b of beaches) {
  const p = feats.find((f, fi) => beachIdByFeat.get(fi) === b.id).properties;
  if (want.test(b.name) || nusa.has(p.kec)) console.log(`  ${b.id}\t${b.name} (${p.kec})`);
}
for (const n of ["Ubud", "Kintamani"]) console.log(`  ${n} is beach: ${beaches.some((b) => b.name === n)}`);
