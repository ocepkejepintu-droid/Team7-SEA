import type { Guide } from "@shared/workshop";
import type { Lang } from "./i18n";
import { zh } from "./workshop.zh";
import { id } from "./workshop.id";

/** The translatable text of a guide. English lives in shared/workshop.ts and is the source of truth. */
export type GuideText = Pick<Guide, "title" | "blurb" | "materials" | "steps" | "safety">;

export const GUIDE_TEXT: Record<Exclude<Lang, "en">, Record<string, GuideText>> = { zh, id };

/** The guide with its text in the given language; falls back to English when a translation is missing. */
export function localGuide(lang: Lang, g: Guide): Guide {
  const tr = lang === "en" ? undefined : GUIDE_TEXT[lang][g.id];
  return tr ? { ...g, ...tr } : g;
}
