// Builds video/src/geo.js: Bali village polygons and the beach coastlines as SVG paths.
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("../../", import.meta.url);
const land = JSON.parse(readFileSync(new URL("web/public/land.json", root)));
const coast = JSON.parse(readFileSync(new URL("shared/coast.json", root)));

const LNG0 = 114.40, LAT0 = -8.03, K = Math.cos((8.45 * Math.PI) / 180);
const S = 1600 / ((115.74 - LNG0) * K); // px per degree latitude
const W = 1600, H = Math.round((LAT0 - -8.88) * S);
const proj = ([lng, lat]) => [(lng - LNG0) * K * S, (LAT0 - lat) * S];

function ring(pts, tol, close) {
  const out = [];
  for (const q of pts.map(proj)) {
    const l = out[out.length - 1];
    if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) >= tol) out.push(q);
  }
  if (out.length < (close ? 3 : 2)) return "";
  return "M" + out.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + (close ? "Z" : "");
}
function polys(tol, box) {
  let d = "";
  for (const f of land.features) {
    const g = f.geometry;
    if (box && !g.coordinates.flat(3).some((v, i, a) => i % 2 === 0 && v > box[0] && v < box[2] && a[i + 1] > box[1] && a[i + 1] < box[3])) continue;
    for (const p of g.type === "Polygon" ? [g.coordinates] : g.coordinates) for (const r of p) d += ring(r, tol, true);
  }
  return d;
}
const named = {};
for (const b of coast.beaches) named[b.id] = { name: b.name, c: proj(b.center).map((v) => +v.toFixed(1)) };
const coastPaths = {};
for (const b of coast.beaches) { const d = b.coast.map((l) => ring(l, 0.25, false)).join(""); if (d) coastPaths[b.id] = d; }
// Every coast point around Kuta, for pins on the phone map.
const localPts = [];
for (const b of coast.beaches) for (const l of b.coast) for (const p of l)
  if (p[0] > 115.1 && p[0] < 115.2 && p[1] > -8.8 && p[1] < -8.64) localPts.push([...proj(p).map((v) => +v.toFixed(2)), b.id]);
// Points along the coast, used to scatter trash pins.
const coastPts = [];
coast.beaches.forEach((b) => b.coast.forEach((l) => l.forEach((p, i) => { if (i % 6 === 0) coastPts.push(proj(p).map((v) => +v.toFixed(1))); })));

const geo = { W, H, island: polys(1.1), islandFine: polys(0.15, [115.0, -8.9, 115.4, -8.55]), coast: coastPaths, beaches: named, coastPts, localPts, nBeaches: coast.beaches.length };
writeFileSync(new URL("../src/geo.js", import.meta.url), "window.GEO=" + JSON.stringify(geo) + ";\n");
console.log("geo.js", W, H, Math.round(JSON.stringify(geo).length / 1024) + "KB", "coastPts", coastPts.length);
