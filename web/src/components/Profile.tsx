import { ChevronRight, Lock } from "lucide-react";
import { BADGES } from "@shared/types";
import type { Game } from "@/lib/useGame";
import { badgeHow, badgeName, sizeLabel, timeAgo, trashLabel, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bone, Empty } from "./League";
import { Settings } from "./Settings";

export function Profile({ game, onOpenReport }: { game: Game; onOpenReport: (reportId: string) => void }) {
  const s = game.state;
  const { t, num } = useI18n();
  const wrap = "mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8";
  if (!s?.me) {
    return (
      <div className={wrap} aria-label={t("common.loading")}>
        <Settings /><Bone className="mt-3 h-44" /><Bone className="mt-4 h-40" /><Bone className="mt-4 h-24" />
      </div>
    );
  }
  const { player, points, badges } = s.me;
  const earned = new Set(badges);
  const names = new Map(s.league.map((b) => [b.beachId, b.name]));
  const mine = s.reports.filter((r) => r.by === player.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const cleaned = s.reports.filter((r) => r.clean?.by === player.id).length;
  const rank = [...s.players].sort((a, b) => b.points - a.points).findIndex((p) => p.id === player.id);

  return (
    <div className={wrap}>
      <section className="rounded-2xl bg-card p-5 text-center shadow-sm ring-1 ring-border">
        <div className="mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-brand-soft text-5xl" aria-hidden>{player.avatar}</div>
        <h1 className="mt-3 truncate text-2xl font-extrabold">{player.nickname}</h1>
        <p className="mt-2 text-5xl leading-none font-extrabold text-brand tabular-nums">{num(points)}</p>
        <p className="mt-1 text-sm font-bold text-muted-foreground">{t("me.points")}{rank >= 0 ? ` · ${t("me.rank", { rank: rank + 1, total: s.players.length })}` : ""}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Stat value={mine.length} label={t("me.reportsMade")} />
          <Stat value={cleaned} label={t("me.spotsCleaned")} />
        </div>
      </section>

      <Settings />

      <h2 className="mt-7 flex items-baseline justify-between text-xl font-extrabold">
        {t("me.badges")} <span className="text-sm font-bold text-muted-foreground">{earned.size} / {Object.keys(BADGES).length}</span>
      </h2>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {Object.entries(BADGES).map(([id, b]) => {
          const got = earned.has(id);
          return (
            <li key={id} className={cn("relative flex flex-col items-center rounded-2xl p-3 text-center", got ? "bg-card shadow-sm ring-2 ring-brand/40" : "bg-muted/60")}>
              {!got && <Lock className="absolute top-2 right-2 size-3.5 text-muted-foreground/70" />}
              <span className={cn("text-3xl", !got && "opacity-35 grayscale")} aria-hidden>{b.emoji}</span>
              <p className={cn("mt-1.5 text-xs leading-tight font-extrabold", !got && "text-muted-foreground")}>{badgeName(t, id)}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{got ? t("me.earned") : badgeHow(t, id)}</p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-7 text-xl font-extrabold">{t("me.myReports")}</h2>
      {mine.length === 0 ? (
        <Empty emoji="📸" title={t("me.noReports.title")} text={t("me.noReports.text")} />
      ) : (
        <ul className="mt-3 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          {mine.map((r) => {
            const done = r.status === "cleaned";
            return (
              <li key={r.id} className="border-b last:border-b-0">
                <button type="button" onClick={() => onOpenReport(r.id)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas active:bg-muted">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold">{trashLabel(t, r.type)} <span className="font-semibold text-muted-foreground">· {sizeLabel(t, r.size)}</span></p>
                    <p className="truncate text-xs font-semibold text-muted-foreground">{names.get(r.beachId) ?? t("me.baliCoast")} · {timeAgo(t, r.createdAt)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold", done ? "bg-good-soft text-good-ink" : "bg-coral-soft text-coral-ink")}>
                    {done ? t("status.cleaned") : t("status.open")}
                  </span>
                  <span className="w-12 shrink-0 text-right text-sm font-extrabold text-brand-ink tabular-nums">+{r.points}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-3">
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
