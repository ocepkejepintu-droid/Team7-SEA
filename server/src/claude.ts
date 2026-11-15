import type { Size, TrashType } from "../../shared/types";

const TYPES: TrashType[] = ["plastic", "bottles", "nets", "organic", "mixed", "other"];
const SIZES: Size[] = ["S", "M", "L"];

const TAG_PROMPT = 'You see a photo reported as trash on a Bali beach. Reply with JSON only: {"is_trash":bool,"type":one of plastic|bottles|nets|organic|mixed|other,"size":"S"(a handful)|"M"(a bag)|"L"(more than a bag),"summary":"under 12 words"}';
const COMPARE_PROMPT = 'Photo 1 is trash reported on a beach. Photo 2 was taken after a cleanup at the same spot. Reply with JSON only: {"clean_score":0-100,"reason":"under 15 words"}. Score 0 if photo 2 is a different place or still has the trash.';
const SINGLE_PROMPT = 'Does this photo show a clean beach spot with no trash? JSON only: {"clean_score":0-100,"reason":"under 15 words"}';

/** Languages the app is translated into. Claude writes its short notes in the player's one. */
export type Lang = "en" | "zh" | "id";
export const asLang = (v: unknown): Lang => (v === "zh" || v === "id" ? v : "en");
const WRITE_IN: Record<Lang, string> = {
  en: "",
  zh: ' Write the "summary" or "reason" text in Simplified Chinese.',
  id: ' Write the "summary" or "reason" text in Indonesian.',
};
const UNREADABLE: Record<Lang, string> = { en: "Photo could not be read", zh: "无法读取照片", id: "Foto tidak bisa dibaca" };

const image = (data: string) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });

async function ask(content: unknown[], lang: Lang): Promise<Record<string, unknown> | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const base = (process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com").replace(/\/+$/, "");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.MODEL || "claude-sonnet-5-5", max_tokens: 2000, output_config: { effort: "low" }, messages: [{ role: "user", content }] }),
    });
    // Anthropic could not read the image: that is the photo's fault, not an outage, so it must not pass as "unverified"
    if (res.status === 400) { console.error("claude 400:", (await res.text()).slice(0, 300)); return { clean_score: 0, reason: UNREADABLE[lang] }; }
    if (!res.ok) { console.error("claude", res.status, (await res.text()).slice(0, 300)); return null; }
    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (body.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n");
    const m = text.match(/\{[\s\S]*?\}/);
    if (!m) { console.error("claude: no JSON in reply, stop_reason", (body as { stop_reason?: string }).stop_reason); return null; }
    const obj = JSON.parse(m[0]);
    return obj && typeof obj === "object" ? obj : null;
  } catch (e) {
    console.error("claude call failed:", e instanceof Error ? e.message : e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function tagPhoto(b64: string, lang: Lang = "en"): Promise<{ isTrash: boolean; type: TrashType; size: Size; summary: string } | null> {
  const o = await ask([image(b64), { type: "text", text: TAG_PROMPT + WRITE_IN[lang] }], lang);
  if (!o) return null;
  const type = TYPES.includes(o.type as TrashType) ? (o.type as TrashType) : "mixed";
  const sz = typeof o.size === "string" ? o.size.trim().toUpperCase() : "";
  const size = SIZES.includes(sz as Size) ? (sz as Size) : "M";
  const isTrash = typeof o.is_trash === "boolean" ? o.is_trash : o.is_trash !== "false";
  const summary = typeof o.summary === "string" ? o.summary.slice(0, 120) : "";
  return { isTrash, type, size, summary };
}

export async function compareCleanup(beforeB64: string | null, afterB64: string, lang: Lang = "en"): Promise<{ score: number; reason: string } | null> {
  const content = beforeB64
    ? [image(beforeB64), image(afterB64), { type: "text", text: COMPARE_PROMPT + WRITE_IN[lang] }]
    : [image(afterB64), { type: "text", text: SINGLE_PROMPT + WRITE_IN[lang] }];
  const o = await ask(content, lang);
  if (!o) return null;
  const n = Number(o.clean_score ?? o.score);
  if (!Number.isFinite(n)) return null;
  const score = Math.max(0, Math.min(100, Math.round(n)));
  const reason = typeof o.reason === "string" ? o.reason.slice(0, 160) : "";
  return { score, reason };
}
