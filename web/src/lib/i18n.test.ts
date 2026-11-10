import { expect, test } from "vitest";
import { DICTS, LANGS, detectLang, translate } from "./i18n";

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("every language has every key, non-empty, with the same placeholders", () => {
  const keys = Object.keys(DICTS.en).sort();
  for (const { id } of LANGS) {
    expect(Object.keys(DICTS[id]).sort()).toEqual(keys);
    for (const k of keys as (keyof typeof DICTS.en)[]) {
      expect(DICTS[id][k].trim(), `${id}.${k}`).not.toBe("");
      expect(holes(DICTS[id][k]), `${id}.${k}`).toEqual(holes(DICTS.en[k]));
    }
  }
});

test("translate fills placeholders and picks the singular form", () => {
  expect(translate("en", "time.days", { count: 3 })).toBe("3 days ago");
  expect(translate("en", "time.days", { count: 1 })).toBe("1 day ago");
  expect(translate("id", "time.days", { count: 1 })).toBe("1 hari lalu");
  expect(translate("zh", "league.cleanGoal", { goal: 20 })).toBe("本周清理 20 处垃圾");
});

test("detectLang maps browser languages and falls back to English", () => {
  expect(detectLang(["zh-TW", "en"])).toBe("zh");
  expect(detectLang(["id-ID"])).toBe("id");
  expect(detectLang(["ms-MY", "in"])).toBe("id");
  expect(detectLang(["fr-FR", "en-GB"])).toBe("en");
  expect(detectLang(["fr"])).toBe("en");
  expect(detectLang([])).toBe("en");
});
