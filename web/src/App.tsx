import { useCallback, useState } from "react";
import { WifiOff } from "lucide-react";
import { useGame } from "@/lib/useGame";
import { MapScreen, type MapFocus } from "@/components/MapScreen";
import { Onboarding } from "@/components/Onboarding";
import { League } from "@/components/League";
import { Profile } from "@/components/Profile";
import { Workshop, type WorkshopFocus } from "@/components/Workshop";
import type { TrashType } from "@shared/types";
import { TabBar, type Tab } from "@/components/TabBar";
import { ShareSheet } from "@/components/ShareSheet";
import type { CardKind } from "@/lib/share";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function App() {
  const game = useGame();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("map");
  const [focus, setFocus] = useState<MapFocus>({ n: 0 });
  const [workshop, setWorkshop] = useState<WorkshopFocus>({ type: null, n: 0 });
  const [share, setShare] = useState<ShareTarget | null>(null);

  const openBeach = useCallback((beachId: string) => { setFocus((f) => ({ beachId, n: f.n + 1 })); setTab("map"); }, []);
  const openReport = useCallback((reportId: string) => { setFocus((f) => ({ reportId, n: f.n + 1 })); setTab("map"); }, []);

  const openWorkshop = useCallback((type: TrashType) => { setWorkshop((w) => ({ type, n: w.n + 1 })); setTab("workshop"); }, []);

  if (!game.joined) return <Onboarding game={game} />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      {game.error && (
        <div role="status" className="relative z-30 flex shrink-0 items-center justify-center gap-2 bg-coral px-4 pt-[max(0.375rem,env(safe-area-inset-top))] pb-1.5 text-center text-sm font-bold text-white">
          <WifiOff className="size-4 shrink-0" /> {t("app.offline")}
        </div>
      )}
      <main className="relative min-h-0 flex-1">
        {/* The map stays mounted so it is not re-created when switching tabs. */}
        <section className={cn("absolute inset-0", tab !== "map" && "invisible pointer-events-none")} aria-hidden={tab !== "map"}>
          <MapScreen game={game} focus={focus} onShare={setShare} onReuse={openWorkshop} />
        </section>
        {tab === "league" && (
          <section className="absolute inset-0 overflow-y-auto overscroll-contain">
            <League game={game} onOpenBeach={openBeach} onShare={setShare} />
          </section>
        )}
        {tab === "workshop" && (
          <section className="absolute inset-0 overflow-y-auto overscroll-contain">
            <Workshop focus={workshop} />
          </section>
        )}
        {tab === "me" && (
          <section className="absolute inset-0 overflow-y-auto overscroll-contain">
            <Profile game={game} onOpenReport={openReport} onShare={setShare} />
          </section>
        )}
        {share && (
          <div className="absolute inset-0 z-50" style={{ background: "rgba(18,52,59,0.45)" }} onClick={(e) => e.target === e.currentTarget && setShare(null)}>
            <ShareSheet game={game} {...share} onClose={() => setShare(null)} />
          </div>
        )}
      </main>
      <TabBar tab={tab} onChange={(next) => {
        // Opening the Workshop from the tab bar means "show everything": drop any filter left by "I want to reuse".
        if (next === "workshop" && tab !== "workshop") setWorkshop((w) => ({ type: null, n: w.n + 1 }));
        setTab(next);
      }} />
    </div>
  );
}

export interface ShareTarget { kind: CardKind; reportId?: string; beachId?: string }
