import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Sparkles, Sparkle } from "lucide-react";
import type { Report } from "@shared/types";
import { beachById } from "@shared/coast";
import { isHotspot, CLEAN_PASS } from "@shared/game";
import { api, ApiError, type CleanResult } from "@/lib/api";
import { resizePhoto } from "@/lib/photo";
import type { Game } from "@/lib/useGame";
import { sizeLabel, timeAgo, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BottomSheet, PhotoButtons, errText, typeLabel } from "./ReportSheet";
import { showPoints } from "./PointsToast";
import { ShareButton } from "./ShareButton";
import type { ShareTarget } from "@/App";

/** Renders a translated sentence whose "\u0000" marker stands for a name, with the name in bold (word order differs per language). */
function parts(sentence: string, name: string, bold?: string) {
  const [a, b = ""] = sentence.split("\u0000");
  return <>{a}<b className={bold}>{name}</b>{b}</>;
}

const Pill = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-xs font-extrabold", className)}>{children}</span>
);

export function ReportDetail({ report, game, onClose, onShare }: { report: Report; game: Game; onClose: () => void; onShare: (t: ShareTarget) => void }) {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState<"view" | "photo" | "checking" | "result">("view");
  const [after, setAfter] = useState<string | null>(null);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(report.id);

  useEffect(() => {
    if (lastId.current === report.id) return;
    lastId.current = report.id;
    setPhase("view"); setResult(null); setAfter(null); setError(null);
  }, [report.id]);
  useEffect(() => () => { if (after) URL.revokeObjectURL(after); }, [after]);

  const name = (id: string) => game.state?.players.find((p) => p.id === id)?.nickname ?? (game.state?.me?.player.id === id ? game.state.me.player.nickname : t("detail.aPlayer"));
  const beach = beachById(report.beachId)?.name ?? game.state?.league.find((l) => l.beachId === report.beachId)?.name ?? t("detail.theCoast");
  const hot = report.status === "open" && isHotspot(report, new Date());

  const onFile = async (f: File) => {
    setError(null);
    setAfter(URL.createObjectURL(f));
    setPhase("checking");
    try {
      const b64 = await resizePhoto(f);
      const res = await api.clean(report.id, b64, lang);
      setResult(res); setPhase("result");
      if (res.report.status === "cleaned") showPoints({ points: res.points, title: t("toast.cleaned"), badges: res.newBadges });
      await game.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { setError(t("err.alreadyCleaned")); await game.refresh(); setPhase("view"); return; }
      setError(errText(t, e)); setPhase("photo");
    }
  };

  const passed = result && result.report.status === "cleaned";
  const shown = result?.report.status === "cleaned" ? result.report : report;

  return (
    <BottomSheet label={t("detail.title")} onClose={phase === "checking" ? undefined : onClose}>
      <div className="flex flex-wrap items-center gap-1.5 pr-10">
        <Pill className={shown.status === "cleaned" ? "bg-good-soft text-good-ink" : "bg-coral-soft text-coral-ink"}>{shown.status === "cleaned" ? t("detail.cleaned") : t("status.open")}</Pill>
        {hot && <Pill className="bg-coral text-white">{t("detail.hotspot")}</Pill>}
        {report.seeded && <Pill className="bg-muted text-muted-foreground">{t("detail.demo")}</Pill>}
      </div>
      <h2 className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold leading-tight text-foreground"><MapPin className="size-5 shrink-0 text-brand" />{beach}</h2>
      <p className="text-sm text-muted-foreground">{parts(t("detail.reportedBy", { when: timeAgo(t, report.createdAt), name: "\u0000" }), name(report.by), "text-foreground")}</p>

      {shown.status === "cleaned" && shown.clean ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <figure><img src={api.photoUrl(report.photo)} alt={t("detail.before")} className="aspect-square w-full rounded-2xl bg-muted object-cover" /><figcaption className="mt-1 text-center text-xs font-bold text-muted-foreground">{t("detail.before")}</figcaption></figure>
          <figure><img src={api.photoUrl(shown.clean.photo)} alt={t("detail.after")} className="aspect-square w-full rounded-2xl bg-muted object-cover" /><figcaption className="mt-1 text-center text-xs font-bold text-muted-foreground">{t("detail.after")}</figcaption></figure>
        </div>
      ) : (
        <img src={phase === "checking" || (phase === "result" && after) ? after ?? api.photoUrl(report.photo) : api.photoUrl(report.photo)} alt={t("detail.theTrash")}
          className="mt-3 max-h-60 w-full rounded-2xl bg-muted object-cover" />
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill className="bg-brand-soft text-brand-ink">{typeLabel(t, report.type)}</Pill>
        <Pill className="bg-brand-soft text-brand-ink">{report.size} · {sizeLabel(t, report.size)}</Pill>
      </div>

      {shown.status === "cleaned" && shown.clean && phase !== "result" && (
        <div className="mt-3 rounded-2xl bg-good-soft p-3.5 text-sm text-good-ink">
          <div className="flex items-baseline justify-between"><b className="text-base">{t("detail.cleanScore")}</b><span className="text-2xl font-black">{shown.clean.score}<span className="text-sm">/100</span></span></div>
          <p className="mt-1">{parts(t(shown.clean.verified ? "detail.cleanedBy" : "detail.cleanedByUnverified", { when: timeAgo(t, shown.clean.at), name: "\u0000" }), name(shown.clean.by))}</p>
          {shown.clean.verified && shown.clean.reason && <p className="mt-1 opacity-80">“{shown.clean.reason}”</p>}
        </div>
      )}

      {phase === "checking" && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand-soft p-4 font-extrabold text-brand-ink">
          <Loader2 className="size-5 animate-spin" /> {t("detail.checking")}
        </div>
      )}

      {phase === "result" && result && (
        passed ? (
          <div className="mt-4 rounded-2xl bg-good-soft p-4 text-good-ink">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-lg font-extrabold"><Sparkles className="size-5" /> {t("detail.nice")}</span>
              <span className="text-3xl font-black">{result.score}<span className="text-base">/100</span></span>
            </div>
            {result.verified && result.reason && <p className="mt-1 text-sm">{result.reason}</p>}
            <p className="mt-2 text-base font-extrabold">{t("detail.won", { points: result.points })}</p>
            {!result.verified && <p className="mt-1 text-xs opacity-80">{t("detail.unverified")}</p>}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-amber-soft p-4 text-amber-ink">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold">{t("detail.stillTrash")}</span>
              <span className="text-2xl font-black">{result.score}<span className="text-sm">/100</span></span>
            </div>
            {result.reason && <p className="mt-1 text-sm">{result.reason}</p>}
            <p className="mt-1 text-xs opacity-80">{t("detail.passNote", { pass: CLEAN_PASS })}</p>
          </div>
        )
      )}

      {shown.status === "cleaned" && shown.clean && (
        <ShareButton className="mt-3" label="Share before / after" onClick={() => onShare({ kind: "cleanup", reportId: report.id })} />
      )}

      {error && <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm font-semibold text-coral-ink">{error}</p>}

      {report.status === "open" && !passed && phase !== "checking" && (
        <div className="mt-4">
          {phase === "view" ? (
            <button type="button" onClick={() => { setPhase("photo"); setError(null); }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-extrabold text-white shadow-md shadow-brand/30 active:scale-[0.98]">
              <Sparkle className="size-6" /> {t("detail.iCleaned")}
            </button>
          ) : (
            <>
              <p className="mb-2 text-sm font-bold text-foreground">{t("detail.afterHint")}</p>
              <PhotoButtons onFile={onFile} takeLabel={phase === "result" ? t("detail.tryAnother") : t("detail.takeAfter")} />
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
