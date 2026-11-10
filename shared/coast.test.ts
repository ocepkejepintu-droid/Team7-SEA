import { expect, test } from "vitest";
import { beaches, beachById, snapToCoast } from "./coast";

// Spellings checked in villages.js: "Sanur Kaja", "Purwa Kerthi" (Amed), "Padangbai".
test("famous beaches are coastal", () => {
  for (const n of ["Canggu", "Kuta", "Sanur Kaja", "Jimbaran", "Pecatu"]) expect(beaches.some((b) => b.name === n), n).toBe(true);
});
test("inland villages are not beaches", () => {
  for (const n of ["Ubud", "Kintamani"]) expect(beaches.some((b) => b.name === n), n).toBe(false);
});
test("a pin at sea off Kuta snaps to Kuta's coast", () => {
  const s = snapToCoast(115.16, -8.72);
  expect(beachById(s.beachId)!.name).toBe("Kuta");
  expect(s.beachId).toBe("kuta-badung");
  expect(s.distanceM).toBeGreaterThan(0);
});
test("a pin far inland snaps to some coast within 40 km", () => {
  expect(snapToCoast(115.26, -8.45).distanceM).toBeLessThan(40_000);
});
test("there are between 100 and 400 beaches", () => {
  expect(beaches.length).toBeGreaterThan(100);
  expect(beaches.length).toBeLessThan(400);
});
test("ids are unique and shapes match Beach", () => {
  expect(new Set(beaches.map((b) => b.id)).size).toBe(beaches.length);
  for (const b of beaches) {
    expect(b.center).toHaveLength(2);
    expect(b.coast.length).toBeGreaterThan(0);
  }
});
