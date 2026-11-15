import { test, expect } from "vitest";
import { TRASH_TYPES } from "./types";
import { GUIDES, guidesFor, guideById } from "./workshop";

test("ids are unique and kebab-case", () => {
  const ids = GUIDES.map((g) => g.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});
test("every trash type has at least one guide", () => {
  for (const t of TRASH_TYPES) expect(guidesFor(t).length, t).toBeGreaterThanOrEqual(1);
});
test("plastic, bottles, nets and organic have at least two guides", () => {
  for (const t of ["plastic", "bottles", "nets", "organic"] as const) {
    expect(guidesFor(t).length, t).toBeGreaterThanOrEqual(2);
  }
});
test("every guide is complete", () => {
  for (const g of GUIDES) {
    expect(g.types.length, g.id).toBeGreaterThanOrEqual(1);
    for (const t of g.types) expect(TRASH_TYPES).toContain(t);
    expect(g.steps.length, g.id).toBeGreaterThanOrEqual(3);
    expect(g.steps.length, g.id).toBeLessThanOrEqual(7);
    expect(g.materials.length, g.id).toBeGreaterThanOrEqual(1);
    expect(g.title.trim(), g.id).not.toBe("");
    expect(g.blurb.trim(), g.id).not.toBe("");
    expect(g.safety.trim(), g.id).not.toBe("");
    expect(g.emoji.trim(), g.id).not.toBe("");
    expect(g.minutes, g.id).toBeGreaterThan(0);
    expect(["easy", "medium", "hard"]).toContain(g.difficulty);
  }
});
test("guidesFor(null) returns all guides", () => {
  expect(guidesFor(null)).toEqual(GUIDES);
});
test("guidesFor(type) returns only matching guides", () => {
  for (const t of TRASH_TYPES) {
    const list = guidesFor(t);
    expect(list.length).toBeGreaterThan(0);
    for (const g of list) expect(g.types).toContain(t);
    expect(list.length).toBe(GUIDES.filter((g) => g.types.includes(t)).length);
  }
});
test("guideById finds a guide and returns undefined for unknown ids", () => {
  for (const g of GUIDES) expect(guideById(g.id)).toBe(g);
  expect(guideById("nope")).toBeUndefined();
});
