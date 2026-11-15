import { expect, test } from "vitest";
import { GUIDES } from "@shared/workshop";
import { GUIDE_TEXT, localGuide } from "./workshopI18n";

test("every guide is fully translated with the same shape as English", () => {
  for (const [lang, dict] of Object.entries(GUIDE_TEXT)) {
    expect(Object.keys(dict).sort(), lang).toEqual(GUIDES.map((g) => g.id).sort());
    for (const g of GUIDES) {
      const tr = dict[g.id];
      expect(tr.materials.length, `${lang}.${g.id}.materials`).toBe(g.materials.length);
      expect(tr.steps.length, `${lang}.${g.id}.steps`).toBe(g.steps.length);
      for (const s of [tr.title, tr.blurb, tr.safety, ...tr.materials, ...tr.steps]) expect(s.trim(), `${lang}.${g.id}`).not.toBe("");
    }
  }
});

test("localGuide swaps the text and keeps everything else", () => {
  const g = GUIDES[0];
  expect(localGuide("en", g)).toBe(g);
  const zh = localGuide("zh", g);
  expect(zh.title).toBe(GUIDE_TEXT.zh[g.id].title);
  expect(zh).toMatchObject({ id: g.id, emoji: g.emoji, types: g.types, minutes: g.minutes, difficulty: g.difficulty });
});
