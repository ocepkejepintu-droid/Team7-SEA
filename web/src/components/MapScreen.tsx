import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { Report } from "@shared/types";
import { beachById, snapToCoast } from "@shared/coast";
import type { ReportResult } from "@/lib/api";
import type { Game } from "@/lib/useGame";
import { useI18n } from "@/lib/i18n";
import { GameMap, type GameMapHandle } from "./GameMap";
import { ChallengeBanner } from "./ChallengeBanner";
import { ReportSheet, type Picked } from "./ReportSheet";
import { ReportDetail } from "./ReportDetail";
import { PointsToast, showPoints } from "./PointsToast";

export interface MapFocus { beachId?: string; reportId?: string; n: number }

const snap = (lng: number, lat: number): Picked => {
  const s = snapToCoast(lng, lat);
  return { lng: s.lng, lat: s.lat, beachId: s.beachId, beachName: beachById(s.beachId)?.name ?? null };
};

/** The Map tab: map, report button, report sheet and report detail. */
export function MapScreen({ game, focus }: { game: Game; focus?: MapFocus }) {
  const map = useRef<GameMapHandle>(null);
  const { t } = useI18n();
  const reports = useMemo(() => game.state?.reports ?? [], [game.state]);
  const league = useMemo(() => game.state?.league ?? [], [game.state]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kept, setKept] = useState<Report | null>(null);
  const [reporting, setReporting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState<Picked | null>(null);

  const selected = useMemo(() => (selectedId ? reports.find((r) => r.id === selectedId) ?? (kept?.id === selectedId ? kept : null) : null), [reports, selectedId, kept]);

  const lastFocus = useRef<number | null>(null);
  useEffect(() => {
    if (!focus || focus.n === lastFocus.current) return;
    lastFocus.current = focus.n;
    // Let the tab become visible first so the map has a size.
    requestAnimationFrame(() => {
      if (focus.beachId) { setSelectedId(null); map.current?.fitBeach(focus.beachId); map.current?.showBeach(focus.beachId); }
      if (focus.reportId) {
        const r = reports.find((x) => x.id === focus.reportId);
        if (r) { setKept(r); setSelectedId(r.id); }
      }
    });
  }, [focus, reports]);

  const startPick = useCallback(() => {
    setPicking(true);
    const fallback = () => { const c = map.current?.center(); if (c) setPick(snap(c[0], c[1])); };
    if (window.isSecureContext && "geolocation" in navigator) {
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; fallback(); } }, 4000);
      navigator.geolocation.getCurrentPosition(
        (p) => { if (done) return; done = true; clearTimeout(t); const s = snap(p.coords.longitude, p.coords.latitude); setPick(s); map.current?.flyTo(s.lng, s.lat, 14); },
        () => { if (done) return; done = true; clearTimeout(t); fallback(); },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 });
    } else fallback();
  }, []);
  const endPick = useCallback(() => { setPicking(false); setPick(null); }, []);
  const closeReport = useCallback(() => { setReporting(false); endPick(); }, [endPick]);

  const onSubmitted = async (res: ReportResult) => {
    closeReport();
    showPoints({ points: res.points, title: t("toast.reported"), badges: res.newBadges });
    setKept(res.report);
    map.current?.flyTo(res.report.lng, res.report.lat, 15);
    await game.refresh();
  };

  return (
    <div className="relative size-full overflow-hidden bg-sea">
      <GameMap ref={map} reports={reports} league={league} selectedId={selectedId}
        onSelectReport={(id) => { if (!reporting) setSelectedId(id); }}
        pick={picking ? pick : null} onPick={(lng, lat) => setPick(snap(lng, lat))} pickLabel={pick ? pick.beachName ?? t("map.theCoast") : undefined}
        />

      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <div className="pointer-events-auto"><ChallengeBanner challenge={game.state?.challenge} /></div>
      </div>

      {!reporting && !selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex justify-center">
          <button type="button" onClick={() => { setSelectedId(null); setReporting(true); }}
            className="pointer-events-auto flex h-16 items-center gap-2.5 rounded-full bg-coral pl-6 pr-7 text-lg font-extrabold text-white shadow-xl shadow-coral/40 ring-4 ring-white/70 transition active:scale-95">
            <Camera className="size-6" /> {t("map.reportTrash")}
          </button>
        </div>
      )}

      {reporting && (
        <ReportSheet onClose={closeReport} pick={pick} onPickStart={startPick} onPickEnd={endPick} onSubmitted={onSubmitted} />
      )}
      {selected && !reporting && <ReportDetail key={selected.id} report={selected} game={game} onClose={() => setSelectedId(null)} />}
      <PointsToast />
    </div>
  );
}
