import { test, expect } from "vitest";
import type { Report, Size } from "./types";
import {
  MULT, WEIGHT, CLEAN_PASS, reportPoints, isHotspot, cleanPoints, beachHealth, weekStart,
  league, playerPoints, badges, challenge,
} from "./game";

const now = new Date("2026-11-10T12:00:00+08:00");
const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
let n = 0;
function r(p: Partial<Report> = {}): Report {
  return {
    id: `r${n++}`, beachId: "kuta-badung", lng: 115.17, lat: -8.72, type: "plastic", size: "S",
    photo: "x.jpg", by: "p1", createdAt: hourAgo, status: "open", points: 10, ...p,
  };
}
function cleaned(p: Partial<Report>, by = "p1", extra: Partial<NonNullable<Report["clean"]>> = {}): Report {
  return r({
    status: "cleaned", ...p,
    clean: { by, photo: "y.jpg", score: 90, reason: "", verified: true, at: hourAgo, points: 27, ...extra },
  });
}

test("constants", () => {
  expect(MULT).toEqual({ S: 1, M: 2, L: 4 });
  expect(WEIGHT).toEqual({ S: 5, M: 10, L: 20 });
  expect(CLEAN_PASS).toBe(40);
});
test("report points by size", () => { expect([reportPoints("S"), reportPoints("M"), reportPoints("L")]).toEqual([10, 20, 40]); });
test("L or older than 48 h is a hotspot", () => {
  expect(isHotspot(r({ size: "L" }), now)).toBe(true);
  expect(isHotspot(r({ size: "S", createdAt: "2026-11-08T11:00:00+08:00" }), now)).toBe(true);
  expect(isHotspot(r({ size: "S", createdAt: "2026-11-10T11:00:00+08:00" }), now)).toBe(false);
  expect(isHotspot(r({ size: "L", status: "cleaned" }), now)).toBe(false);
});
test("clean points: 30 × mult × score, ×2 on hotspot, 0 below 40", () => {
  expect(cleanPoints(r({ size: "M", createdAt: "2026-11-10T11:00:00+08:00" }), 80, now)).toBe(48);
  expect(cleanPoints(r({ size: "L" }), 100, now)).toBe(240);
  expect(cleanPoints(r({ size: "S" }), 39, now)).toBe(0);
  expect(cleanPoints(r({ size: "L", status: "cleaned" }), 100, now)).toBe(240);
});
test("health = 100 − open weights, floored at 0", () => {
  expect(beachHealth([r({ size: "S" }), r({ size: "L" }), r({ size: "M", status: "cleaned" })], "kuta-badung")).toBe(75);
  expect(beachHealth(Array(6).fill(r({ size: "L" })), "kuta-badung")).toBe(0);
  expect(beachHealth([r({ size: "L", beachId: "other" })], "kuta-badung")).toBe(100);
});
test("league ranks active beaches only, health then cleans", () => {
  const eightDays = new Date(now.getTime() - 8 * 86400_000).toISOString();
  const beaches = [
    { id: "canggu", name: "Canggu" }, { id: "kuta-badung", name: "Kuta" },
    { id: "amed", name: "Amed" }, { id: "sanur", name: "Sanur" }, { id: "jimbaran", name: "Jimbaran" },
  ];
  const reports = [
    r({ size: "S" }), // kuta 95
    r({ beachId: "canggu", size: "L" }), // canggu 80
    r({ beachId: "amed", size: "M", createdAt: eightDays }), // inactive
    cleaned({ beachId: "sanur", size: "S" }), // sanur 100, 1 clean this week
    r({ beachId: "jimbaran", size: "S", status: "cleaned" }), // jimbaran 100, 0 cleans
  ];
  const l = league(reports, now, beaches);
  expect(l.map((s) => [s.beachId, s.rank])).toEqual([
    ["sanur", 1], ["jimbaran", 2], ["kuta-badung", 3], ["canggu", 4], ["amed", null],
  ]);
  expect(l[2]).toEqual({ beachId: "kuta-badung", name: "Kuta", health: 95, open: 1, cleanedThisWeek: 0, rank: 3 });
  expect(l[3].health).toBe(80);
  expect(l[0].cleanedThisWeek).toBe(1);
  expect(l[4].health).toBe(90);
});
test("league ties break by name", () => {
  const l = league([r({ beachId: "b" }), r({ beachId: "a" })], now, [{ id: "b", name: "Bravo" }, { id: "a", name: "Alpha" }]);
  expect(l.map((s) => s.name)).toEqual(["Alpha", "Bravo"]);
});
test("week starts Monday 00:00 WITA", () => {
  expect(weekStart(now).toISOString()).toBe("2026-11-08T16:00:00.000Z");
  expect(weekStart(new Date("2026-11-09T00:30:00+08:00")).toISOString()).toBe("2026-11-08T16:00:00.000Z");
  expect(weekStart(new Date("2026-11-08T23:59:00+08:00")).toISOString()).toBe("2026-11-01T16:00:00.000Z");
});
test("player points", () => {
  const reports = [
    r({ by: "p1", points: 10 }),
    cleaned({ by: "p2", points: 40, size: "L" }, "p1", { points: 240 }),
    r({ by: "p2", points: 20 }),
  ];
  expect(playerPoints(reports, "p1")).toBe(250);
  expect(playerPoints(reports, "p2")).toBe(60);
  expect(playerPoints(reports, "nobody")).toBe(0);
});
test("badges", () => {
  expect(badges([r({ by: "p1" })], "p1")).toEqual(["first_report"]);
  expect(badges([], "p1")).toEqual([]);
  const b = badges([cleaned({ by: "p2", size: "L" }, "p1", { hotspot: true })], "p1");
  expect(b).toEqual(["first_clean", "hotspot_hunter", "big_haul"]);
  const many = [
    ...Array.from({ length: 10 }, () => cleaned({ by: "p2", size: "S" as Size }, "p1")),
    r({ by: "p1", beachId: "a" }), r({ by: "p1", beachId: "b" }), r({ by: "p1", beachId: "c" }),
  ];
  expect(badges(many, "p1")).toEqual(["first_report", "first_clean", "ten_cleans", "three_beaches"]);
});
test("challenge counts cleans since week start", () => {
  const reports = [
    cleaned({}), cleaned({}, "p2"),
    cleaned({}, "p1", { at: "2026-11-08T23:00:00+08:00" }), // last week
    r({}),
  ];
  expect(challenge(reports, now)).toEqual({ goal: 50, done: 2 });
});
