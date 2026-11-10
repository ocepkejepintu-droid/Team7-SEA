import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { BeachStanding, Challenge, PlayerScore } from "@shared/types";
import type { Game } from "@/lib/useGame";
import { healthBg, healthText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type View = "beaches" | "players";

export function League({ game, onOpenBeach }: { game: Game; onOpenBeach: (beachId: string) => void }) {
  const [view, setView] = useState<View>("beaches");
  const s = game.state;
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{t("league.title")}</h1>
      <p className="text-sm font-semibold text-muted-foreground">{t("league.subtitle")}</p>

      {s ? <ChallengeCard c={s.challenge} /> : <Bone className="mt-4 h-24" />}

      <div className="mt-5 grid grid-cols-2 rounded-full bg-muted p-1" role="tablist">
        {(["beaches", "players"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            type="button"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn("h-11 rounded-full text-sm font-extrabold transition", view === v ? "bg-card text-brand-ink shadow-sm dark:bg-brand-soft" : "text-muted-foreground")}
          >
            {t(`league.${v}`)}
          </button>
        ))}
      </div>

      {!s ? <ListSkeleton /> : view === "beaches" ? <Beaches league={s.league} onOpen={onOpenBeach} /> : <Players players={s.players} meId={s.me?.player.id} />}
    </div>
  );
}

function ChallengeCard({ c }: { c: Challenge }) {
  const pct = c.goal > 0 ? Math.min(100, Math.round((c.done / c.goal) * 100)) : 0;
  const met = c.done >= c.goal;
  const { t } = useI18n();
  return (
    <section className="mt-4 rounded-2xl bg-brand p-4 text-white shadow-md shadow-brand/20">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-white/75">{t("league.weekly")}</p>
        <p className="text-sm font-extrabold tabular-nums">{c.done} / {c.goal}</p>
      </div>
      <p className="mt-1 text-lg font-extrabold">{met ? t("league.goalMet") : t("league.cleanGoal", { goal: c.goal })}</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={c.done} aria-valuemin={0} aria-valuemax={c.goal}>
        <div className="h-full rounded-full bg-white transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </section>
  );
}

function HealthBar({ health, className }: { health: number; className?: string }) {
  return (
    <div className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", healthBg(health))} style={{ width: `${Math.max(3, health)}%` }} />
    </div>
  );
}

function Beaches({ league, onOpen }: { league: BeachStanding[]; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const ranked = league.filter((b) => b.rank !== null).sort((a, b) => a.rank! - b.rank!);
  const unranked = league.length - ranked.length;
  if (ranked.length === 0) {
    return <Empty emoji="🏖️" title={t("league.noBeaches.title")} text={t("league.noBeaches.text")} />;
  }
  const [winner, ...rest] = ranked;
  const needsHelp = new Set(ranked.length >= 4 ? ranked.slice(-2).map((b) => b.beachId) : ranked.length >= 2 ? ranked.slice(-1).map((b) => b.beachId) : []);
  return (
    <div className="mt-4">
      <button type="button" onClick={() => onOpen(winner.beachId)} className="block w-full rounded-2xl bg-card p-5 text-left shadow-sm ring-2 ring-amber/50 transition active:scale-[0.99]">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-soft text-3xl" aria-hidden>🏆</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-ink">{t("league.winner")}</p>
            <p className="truncate text-2xl font-extrabold">{winner.name}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-4xl leading-none font-extrabold tabular-nums", healthText(winner.health))}>{winner.health}</p>
            <p className="text-xs font-bold text-muted-foreground">{t("league.health")}</p>
          </div>
        </div>
        <HealthBar health={winner.health} className="mt-4 h-3" />
        <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("league.winnerLine", { open: winner.open, cleaned: winner.cleanedThisWeek })}</p>
      </button>

      {rest.length > 0 && (
        <ol className="mt-3 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          {rest.map((b) => (
            <li key={b.beachId} className="border-b last:border-b-0">
              <button type="button" onClick={() => onOpen(b.beachId)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas active:bg-muted">
                <span className="w-6 shrink-0 text-center text-lg font-extrabold text-muted-foreground tabular-nums">{b.rank}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-extrabold">{b.name}</p>
                    {needsHelp.has(b.beachId) && <span className="shrink-0 rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-extrabold text-coral-ink">{t("league.needsHelp")}</span>}
                  </div>
                  <HealthBar health={b.health} className="mt-1.5" />
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{t("league.row", { open: b.open, cleaned: b.cleanedThisWeek })}</p>
                </div>
                <span className={cn("w-9 shrink-0 text-right text-lg font-extrabold tabular-nums", healthText(b.health))}>{b.health}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {unranked > 0 && (
        <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">
          {t("league.unranked", { count: unranked })}
        </p>
      )}
    </div>
  );
}

function Players({ players, meId }: { players: PlayerScore[]; meId?: string }) {
  const { t, num } = useI18n();
  const top = [...players].sort((a, b) => b.points - a.points).slice(0, 20);
  if (top.length === 0) return <Empty emoji="🏄" title={t("league.noPlayers.title")} text={t("league.noPlayers.text")} />;
  return (
    <ol className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
      {top.map((p, i) => {
        const me = p.id === meId;
        return (
          <li key={p.id} className={cn("flex min-h-14 items-center gap-3 border-b px-4 py-2.5 last:border-b-0", me && "bg-brand-soft")}>
            <span className={cn("w-6 shrink-0 text-center font-extrabold tabular-nums", i < 3 ? "text-amber-ink" : "text-muted-foreground")}>{i + 1}</span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas text-2xl" aria-hidden>{p.avatar}</span>
            <p className="min-w-0 flex-1 truncate font-extrabold">
              {p.nickname}
              {me && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 align-middle text-[11px] font-extrabold text-white">{t("league.you")}</span>}
            </p>
            <span className="shrink-0 font-extrabold tabular-nums text-brand-ink">{num(p.points)} <span className="text-xs font-bold text-muted-foreground">{t("league.pts")}</span></span>
          </li>
        );
      })}
    </ol>
  );
}

export function Empty({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="mt-4 rounded-2xl bg-card px-6 py-10 text-center shadow-sm ring-1 ring-border">
      <p className="text-4xl" aria-hidden>{emoji}</p>
      <p className="mt-3 text-lg font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}

function ListSkeleton() {
  const { t } = useI18n();
  return (
    <div className="mt-4 space-y-3" aria-label={t("common.loading")}>
      <Bone className="h-32" />
      {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-16" />)}
    </div>
  );
}
