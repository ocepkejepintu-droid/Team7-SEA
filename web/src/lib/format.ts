/** "just now", "5 min ago", "3 h ago", "2 days ago" */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export type HealthTone = "good" | "amber" | "coral";
export const healthTone = (h: number): HealthTone => (h >= 80 ? "good" : h >= 50 ? "amber" : "coral");
/** Tailwind background class for a health bar fill. */
export const healthBg = (h: number) => ({ good: "bg-good", amber: "bg-amber", coral: "bg-coral" })[healthTone(h)];
/** Tailwind text class for a health number. */
export const healthText = (h: number) => ({ good: "text-good-ink", amber: "text-amber-ink", coral: "text-coral-ink" })[healthTone(h)];

export const TRASH_LABEL: Record<string, string> = {
  plastic: "Plastic", bottles: "Bottles", nets: "Fishing nets", organic: "Organic", mixed: "Mixed trash", other: "Other",
};
export const SIZE_LABEL: Record<string, string> = { S: "Small", M: "Medium", L: "Large" };
