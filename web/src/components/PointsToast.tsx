import { useEffect, useState } from "react";
import { BADGES } from "@shared/types";
import "./map.css";

export interface PointsEvent { points: number; title: string; badges?: string[] }
type Item = PointsEvent & { key: number };

const listeners = new Set<(e: PointsEvent) => void>();
/** Pop a "+N points" toast from anywhere. Needs one <PointsToast/> mounted. */
export function showPoints(e: PointsEvent) { for (const l of listeners) l(e); }

export function PointsToast() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: PointsEvent) => {
      const key = ++n + Date.now();
      setItems((xs) => [...xs, { ...e, key }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.key !== key)), e.badges?.length ? 4200 : 2700);
    };
    listeners.add(on);
    return () => { listeners.delete(on); };
  }, []);
  if (!items.length) return null;
  const it = items[items.length - 1];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[28%] z-[60] flex justify-center px-6" aria-live="polite">
      <div key={it.key} className="points-pop flex max-w-xs flex-col items-center rounded-3xl bg-white/95 px-7 py-5 text-center shadow-2xl shadow-brand/30"
        style={it.badges?.length ? { animationDuration: "4200ms" } : undefined}>
        <div className="text-6xl font-black leading-none tracking-tight text-brand">{it.points > 0 ? `+${it.points}` : "0"}</div>
        <div className="mt-1 text-sm font-extrabold uppercase tracking-wide text-brand-ink">points</div>
        <div className="mt-2 text-base font-bold text-foreground">{it.title}</div>
        {!!it.badges?.length && (
          <div className="mt-3 flex flex-col gap-1.5">
            {it.badges.map((b) => (
              <div key={b} className="flex items-center gap-2 rounded-full bg-amber-soft px-3 py-1.5 text-sm font-bold text-amber-ink">
                <span className="text-lg">{BADGES[b]?.emoji ?? "🏅"}</span> New badge: {BADGES[b]?.name ?? b}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
