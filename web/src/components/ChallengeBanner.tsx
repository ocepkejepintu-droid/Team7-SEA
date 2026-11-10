import type { Challenge } from "@shared/types";

/** Compact weekly challenge pill. */
export function ChallengeBanner({ challenge }: { challenge?: Challenge }) {
  if (!challenge) return null;
  const pct = Math.min(100, Math.round((challenge.done / Math.max(1, challenge.goal)) * 100));
  return (
    <div className="w-fit max-w-[calc(100vw-5.5rem)] rounded-2xl bg-white/95 px-3.5 py-2 shadow-md shadow-black/15 backdrop-blur"
      role="status" aria-label={`Weekly challenge: ${challenge.done} of ${challenge.goal} spots cleaned this week`}>
      <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-extrabold text-foreground">
        <span aria-hidden>🧹</span>
        <span className="text-brand-ink">{challenge.done}</span>
        <span className="text-muted-foreground">/ {challenge.goal}</span>
        <span className="font-bold text-muted-foreground">cleaned this week</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-brand-soft">
        <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
