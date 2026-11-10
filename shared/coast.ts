import type { Beach } from "./types";
import data from "./coast.json";

export const beaches: Beach[] = (data as { beaches: Beach[] }).beaches;

const byId = new Map(beaches.map((b) => [b.id, b]));
export function beachById(id: string): Beach | undefined {
  return byId.get(id);
}

const LAT0 = -8.4;
const MX = 111320 * Math.cos((LAT0 * Math.PI) / 180); // metres per degree lng
const MY = 110574; // metres per degree lat

const bboxes = beaches.map((b) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const l of b.coast) for (const [x, y] of l) {
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY] as const;
});

/** Nearest point on any beach coast polyline (local equirectangular metres). */
export function snapToCoast(lng: number, lat: number): { beachId: string; lng: number; lat: number; distanceM: number } {
  const px = lng * MX, py = lat * MY;
  // order beaches by bbox distance so we can stop early
  const order = bboxes
    .map((bb, i) => {
      const dx = Math.max(bb[0] - lng, 0, lng - bb[2]) * MX;
      const dy = Math.max(bb[1] - lat, 0, lat - bb[3]) * MY;
      return { i, d: Math.hypot(dx, dy) };
    })
    .sort((a, b) => a.d - b.d);
  let best = { beachId: "", lng, lat, distanceM: Infinity };
  for (const { i, d } of order) {
    if (d >= best.distanceM) break;
    const b = beaches[i];
    for (const line of b.coast) {
      for (let k = 1; k < line.length; k++) {
        const ax = line[k - 1][0] * MX, ay = line[k - 1][1] * MY;
        const bx = line[k][0] * MX, by = line[k][1] * MY;
        const vx = bx - ax, vy = by - ay;
        const l2 = vx * vx + vy * vy;
        let t = l2 > 0 ? ((px - ax) * vx + (py - ay) * vy) / l2 : 0;
        t = Math.max(0, Math.min(1, t));
        const qx = ax + vx * t, qy = ay + vy * t;
        const dist = Math.hypot(px - qx, py - qy);
        if (dist < best.distanceM) best = { beachId: b.id, lng: qx / MX, lat: qy / MY, distanceM: dist };
      }
    }
  }
  return best;
}
