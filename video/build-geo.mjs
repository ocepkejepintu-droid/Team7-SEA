// Projects the real Bali data (716 village polygons, 173 beach coastlines) into
// SVG path strings for the launch video. Output: video/src/geo.js
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const land = JSON.parse(readFileSync(join(root, "web/public/land.json"), "utf8"));
const coast = JSON.parse(readFileSync(join(root, "shared/coast.json"), "utf8"));

// Equirectangular projection around Bali. 1 unit ~ 1 px at the "island" scale.
const LAT0 = -8.45;
const COS = Math.cos((LAT0 * Math.PI) / 180);
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
const U = 1300; // units per degree
const px = ([lng, lat]) => [lng * U * COS, -lat * U];

const rings = [];
for (const f of land.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) for (const r of p) for (const c of r) {
    const [x, y] = px(c);
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
}
const ox = minX, oy = minY;
const proj = (c) => { const [x, y] = px(c); return [x - ox, y - oy]; };

function dp(points, tol) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length); keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a], [bx, by] = points[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return points.filter((_, i) => keep[i]);
}
const f1 = (n) => Math.round(n * 10) / 10;
const pathOf = (pts, close) => "M" + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L") + (close ? "Z" : "");

const villages = [];
for (const f of land.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = "", cx = 0, cy = 0, n = 0;
  for (const p of polys) {
    const raw = p[0].map(proj), h = raw.length >> 1;
    const ring = [...dp(raw.slice(0, h + 1), 0.45).slice(0, -1), ...dp(raw.slice(h), 0.45)];
    if (ring.length < 3) continue;
    d += pathOf(ring, true);
    for (const [x, y] of ring) { cx += x; cy += y; n++; }
  }
  if (d) villages.push({ d, b: f.properties.b, n: f.properties.n, c: [f1(cx / n), f1(cy / n)] });
}

const beaches = coast.beaches.map((b) => ({
  id: b.id, name: b.name,
  c: proj(b.center).map(f1),
  d: b.coast.map((line) => pathOf(dp(line.map(proj), 0.3), false)).join(""),
  pts: b.coast.flatMap((line) => dp(line.map(proj), 1.5).map((p) => p.map(f1))),
}));

const out = {
  w: f1(maxX - minX), h: f1(maxY - minY),
  villages, beaches,
};
writeFileSync(join(here, "src/geo.js"), "window.GEO=" + JSON.stringify(out) + ";\n");
console.log("island", out.w, "x", out.h, "villages", villages.length, "beaches", beaches.length,
  "bytes", JSON.stringify(out).length);
