import type { Report, Size, BeachStanding, Challenge } from "./types";

export const MULT: Record<Size, number> = { S: 1, M: 2, L: 4 };
export const WEIGHT: Record<Size, number> = { S: 5, M: 10, L: 20 };
export const CLEAN_PASS = 40;

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const WITA = 8 * HOUR;

export function reportPoints(size: Size): number {
  return 10 * MULT[size];
}

function hot(r: Report, now: Date): boolean {
  return r.size === "L" || now.getTime() - new Date(r.createdAt).getTime() > 48 * HOUR;
}

export function isHotspot(r: Report, now: Date): boolean {
  return r.status === "open" && hot(r, now);
}

export function cleanPoints(r: Report, score: number, now: Date): number {
  if (score < CLEAN_PASS) return 0;
  const base = Math.round((30 * MULT[r.size] * score) / 100);
  return hot(r, now) ? base * 2 : base;
}

export function beachHealth(reports: Report[], beachId: string): number {
  let sum = 0;
  for (const r of reports) if (r.beachId === beachId && r.status === "open") sum += WEIGHT[r.size];
  return Math.max(0, 100 - sum);
}

export function weekStart(now: Date): Date {
  const local = new Date(now.getTime() + WITA); // UTC fields now read as WITA wall time
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnight - daysSinceMonday * DAY - WITA);
}

function isCleanSince(r: Report, since: number): boolean {
  return r.status === "cleaned" && !!r.clean && new Date(r.clean.at).getTime() >= since;
}

export function league(reports: Report[], now: Date, beaches: { id: string; name: string }[]): BeachStanding[] {
  const ws = weekStart(now).getTime();
  const activeSince = now.getTime() - 7 * DAY;
  const ranked: BeachStanding[] = [];
  const unranked: BeachStanding[] = [];
  for (const b of beaches) {
    const mine = reports.filter((r) => r.beachId === b.id);
    const s: BeachStanding = {
      beachId: b.id,
      name: b.name,
      health: beachHealth(mine, b.id),
      open: mine.filter((r) => r.status === "open").length,
      cleanedThisWeek: mine.filter((r) => isCleanSince(r, ws)).length,
      rank: null,
    };
    const active = mine.some((r) => new Date(r.createdAt).getTime() >= activeSince);
    (active ? ranked : unranked).push(s);
  }
  const byName = (a: BeachStanding, b: BeachStanding) => a.name.localeCompare(b.name);
  ranked.sort((a, b) => b.health - a.health || b.cleanedThisWeek - a.cleanedThisWeek || byName(a, b));
  ranked.forEach((s, i) => (s.rank = i + 1));
  unranked.sort(byName);
  return [...ranked, ...unranked];
}

function cleansBy(reports: Report[], playerId: string): Report[] {
  return reports.filter((r) => r.status === "cleaned" && r.clean?.by === playerId);
}

export function playerPoints(reports: Report[], playerId: string): number {
  let total = 0;
  for (const r of reports) {
    if (r.by === playerId) total += r.points || 0;
    if (r.clean && r.clean.by === playerId) total += r.clean.points || 0;
  }
  return total;
}

export function badges(reports: Report[], playerId: string): string[] {
  const mine = reports.filter((r) => r.by === playerId);
  const cleans = cleansBy(reports, playerId);
  const out: string[] = [];
  if (mine.length >= 1) out.push("first_report");
  if (cleans.length >= 1) out.push("first_clean");
  if (cleans.length >= 10) out.push("ten_cleans");
  if (cleans.some((r) => r.clean?.hotspot === true)) out.push("hotspot_hunter");
  if (cleans.some((r) => r.size === "L")) out.push("big_haul");
  if (new Set(mine.map((r) => r.beachId)).size >= 3) out.push("three_beaches");
  return out;
}

export function challenge(reports: Report[], now: Date): Challenge {
  const ws = weekStart(now).getTime();
  return { goal: 50, done: reports.filter((r) => isCleanSince(r, ws)).length };
}
