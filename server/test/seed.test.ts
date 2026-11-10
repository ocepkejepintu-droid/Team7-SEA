import { expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { beachById, beaches } from "../../shared/coast";
import { league } from "../../shared/game";
import { createStore } from "../src/store";
import { seed } from "../src/seed";
import { tmpDir } from "./helpers";

test("seed makes a lively, valid demo league", () => {
  const dir = tmpDir();
  const store = createStore(dir);
  seed(store, { reset: true });
  const { players, reports } = store.db;
  expect(players).toHaveLength(10);
  expect(reports.length).toBeGreaterThanOrEqual(55);
  expect(reports.length).toBeLessThanOrEqual(65);
  expect(reports.every((r) => r.seeded === true)).toBe(true);
  expect(players.every((p) => p.seeded === true)).toBe(true);
  expect(new Set(reports.map((r) => r.beachId)).size).toBeGreaterThanOrEqual(9);
  const cleaned = reports.filter((r) => r.status === "cleaned");
  expect(cleaned.length).toBeGreaterThanOrEqual(15);
  expect(cleaned.length).toBeLessThanOrEqual(25);
  expect(reports.every((r) => beachById(r.beachId))).toBe(true);
  for (const r of cleaned) expect(new Date(r.clean!.at).getTime()).toBeGreaterThan(new Date(r.createdAt).getTime());
  const table = league(reports, new Date(), beaches);
  expect(table.filter((s) => s.rank !== null).length).toBeGreaterThanOrEqual(9);
  const ranked = table.filter((s) => s.rank !== null);
  expect(ranked[0].health).toBeGreaterThanOrEqual(90);
  expect(ranked.at(-1)!.health).toBeLessThanOrEqual(30);
  for (const r of reports) expect(fs.existsSync(path.join(dir, "photos", r.photo))).toBe(true);
  expect(fs.existsSync(path.join(dir, "db.json"))).toBe(true);
});

test("seed is deterministic and re-seeding replaces demo data", () => {
  const a = createStore(tmpDir()); seed(a, { reset: true, now: new Date("2026-11-10T12:00:00+08:00") });
  const b = createStore(tmpDir()); seed(b, { reset: true, now: new Date("2026-11-10T12:00:00+08:00") });
  const strip = (s: typeof a) => s.db.reports.map(({ id, beachId, size, status, lng, lat }) => ({ id, beachId, size, status, lng, lat }));
  expect(strip(a)).toEqual(strip(b));
  seed(a);
  expect(a.db.reports).toHaveLength(b.db.reports.length);
});
