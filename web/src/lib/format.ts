export type HealthTone = "good" | "amber" | "coral";
export const healthTone = (h: number): HealthTone => (h >= 80 ? "good" : h >= 50 ? "amber" : "coral");
/** Tailwind background class for a health bar fill. */
export const healthBg = (h: number) => ({ good: "bg-good", amber: "bg-amber", coral: "bg-coral" })[healthTone(h)];
/** Tailwind text class for a health number. */
export const healthText = (h: number) => ({ good: "text-good-ink", amber: "text-amber-ink", coral: "text-coral-ink" })[healthTone(h)];
