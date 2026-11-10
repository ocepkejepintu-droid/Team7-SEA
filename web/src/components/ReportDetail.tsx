import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Sparkles, Sparkle } from "lucide-react";
import type { Report } from "@shared/types";
import { beachById } from "@shared/coast";
import { isHotspot, CLEAN_PASS } from "@shared/game";
import { api, ApiError, type CleanResult } from "@/lib/api";
import { resizePhoto } from "@/lib/photo";
import type { Game } from "@/lib/useGame";
import { cn } from "@/lib/utils";
import { BottomSheet, PhotoButtons, SIZE_LABEL, TYPE_LABEL, errText } from "./ReportSheet";
import { showPoints } from "./PointsToast";

export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

const Pill = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-xs font-extrabold", className)}>{children}</span>
);

export function ReportDetail({ report, game, onClose }: { report: Report; game: Game; onClose: () => void }) {
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

  const name = (id: string) => game.state?.players.find((p) => p.id === id)?.nickname ?? (game.state?.me?.player.id === id ? game.state.me.player.nickname : "a player");
  const beach = beachById(report.beachId)?.name ?? game.state?.league.find((l) => l.beachId === report.beachId)?.name ?? "the coast";
  const hot = report.status === "open" && isHotspot(report, new Date());

  const onFile = async (f: File) => {
    setError(null);
    setAfter(URL.createObjectURL(f));
    setPhase("checking");
    try {
      const b64 = await resizePhoto(f);
      const res = await api.clean(report.id, b64);
      setResult(res); setPhase("result");
      if (res.report.status === "cleaned") showPoints({ points: res.points, title: "Thanks for cleaning!", badges: res.newBadges });
      await game.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { setError("Someone already cleaned this one."); await game.refresh(); setPhase("view"); return; }
      setError(errText(e)); setPhase("photo");
    }
  };

  const passed = result && result.report.status === "cleaned";
  const shown = result?.report.status === "cleaned" ? result.report : report;

  return (
    <BottomSheet label="Trash report" onClose={phase === "checking" ? undefined : onClose}>
      <div className="flex flex-wrap items-center gap-1.5 pr-10">
        <Pill className={shown.status === "cleaned" ? "bg-good-soft text-good-ink" : "bg-coral-soft text-coral-ink"}>{shown.status === "cleaned" ? "✓ Cleaned" : "Open"}</Pill>
        {hot && <Pill className="bg-coral text-white">🔥 Hotspot ×2</Pill>}
        {report.seeded && <Pill className="bg-muted text-muted-foreground">demo</Pill>}
      </div>
      <h2 className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold leading-tight text-foreground"><MapPin className="size-5 shrink-0 text-brand" />{beach}</h2>
      <p className="text-sm text-muted-foreground">Reported {ago(report.createdAt)} by <b className="text-foreground">{name(report.by)}</b></p>

      {shown.status === "cleaned" && shown.clean ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <figure><img src={api.photoUrl(report.photo)} alt="Before" className="aspect-square w-full rounded-2xl bg-muted object-cover" /><figcaption className="mt-1 text-center text-xs font-bold text-muted-foreground">Before</figcaption></figure>
          <figure><img src={api.photoUrl(shown.clean.photo)} alt="After" className="aspect-square w-full rounded-2xl bg-muted object-cover" /><figcaption className="mt-1 text-center text-xs font-bold text-muted-foreground">After</figcaption></figure>
        </div>
      ) : (
        <img src={phase === "checking" || (phase === "result" && after) ? after ?? api.photoUrl(report.photo) : api.photoUrl(report.photo)} alt="The trash"
          className="mt-3 max-h-60 w-full rounded-2xl bg-muted object-cover" />
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill className="bg-brand-soft text-brand-ink">{TYPE_LABEL[report.type]}</Pill>
        <Pill className="bg-brand-soft text-brand-ink">{report.size} · {SIZE_LABEL[report.size]}</Pill>
      </div>

      {shown.status === "cleaned" && shown.clean && phase !== "result" && (
        <div className="mt-3 rounded-2xl bg-good-soft p-3.5 text-sm text-good-ink">
          <div className="flex items-baseline justify-between"><b className="text-base">Clean score</b><span className="text-2xl font-black">{shown.clean.score}<span className="text-sm">/100</span></span></div>
          <p className="mt-1">Cleaned by <b>{name(shown.clean.by)}</b> {ago(shown.clean.at)}{shown.clean.verified ? "" : " (unverified)"}.</p>
          {shown.clean.reason && <p className="mt-1 opacity-80">“{shown.clean.reason}”</p>}
        </div>
      )}

      {phase === "checking" && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand-soft p-4 font-extrabold text-brand-ink">
          <Loader2 className="size-5 animate-spin" /> Claude is checking your cleanup…
        </div>
      )}

      {phase === "result" && result && (
        passed ? (
          <div className="mt-4 rounded-2xl bg-good-soft p-4 text-good-ink">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-lg font-extrabold"><Sparkles className="size-5" /> Nice work!</span>
              <span className="text-3xl font-black">{result.score}<span className="text-base">/100</span></span>
            </div>
            {result.reason && <p className="mt-1 text-sm">{result.reason}</p>}
            <p className="mt-2 text-base font-extrabold">You won +{result.points} points</p>
            {!result.verified && <p className="mt-1 text-xs opacity-80">Claude couldn't check this one, so it counts as unverified.</p>}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-amber-soft p-4 text-amber-ink">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold">Claude still sees trash. Try another photo.</span>
              <span className="text-2xl font-black">{result.score}<span className="text-sm">/100</span></span>
            </div>
            {result.reason && <p className="mt-1 text-sm">{result.reason}</p>}
            <p className="mt-1 text-xs opacity-80">A score of {CLEAN_PASS} or more counts as clean.</p>
          </div>
        )
      )}

      {error && <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm font-semibold text-coral-ink">{error}</p>}

      {report.status === "open" && !passed && phase !== "checking" && (
        <div className="mt-4">
          {phase === "view" ? (
            <button type="button" onClick={() => { setPhase("photo"); setError(null); }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-extrabold text-white shadow-md shadow-brand/30 active:scale-[0.98]">
              <Sparkle className="size-6" /> I cleaned this
            </button>
          ) : (
            <>
              <p className="mb-2 text-sm font-bold text-foreground">Take an "after" photo of the same spot, so Claude can see it's clean.</p>
              <PhotoButtons onFile={onFile} takeLabel={phase === "result" ? "Try another photo" : "Take the after photo"} />
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
