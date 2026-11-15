import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { beachById } from "@shared/coast";
import type { Game } from "@/lib/useGame";
import { CARD_FILE, beachCard, cleanupCard, latestCleanup, playerCard, type CardData, type CardKind } from "@/lib/share";
import { renderCard, savePng, sharePng } from "@/lib/shareCard";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./ReportSheet";

const TABS: { kind: CardKind; label: string; locked: string }[] = [
  { kind: "cleanup", label: "Before / After", locked: "Clean a spot to unlock this card." },
  { kind: "player", label: "Player card", locked: "Join the league to get a player card." },
  { kind: "beach", label: "Beach health", locked: "No beach is in the league yet." },
];

const TEXT: Record<CardKind, string> = {
  cleanup: "I cleaned up a beach in Bali with Hai Pantai 🌊",
  player: "My Hai Pantai card. Think you can beat me? 🌊",
  beach: "How clean is our beach this week? Hai Pantai 🌊",
};

/** Instagram story cards. Opens on `kind`; reportId / beachId pick what the card is about. */
export function ShareSheet({ game, kind: start, reportId, beachId, onClose }: { game: Game; kind: CardKind; reportId?: string; beachId?: string; onClose: () => void }) {
  const [kind, setKind] = useState<CardKind>(start);
  const [png, setPng] = useState<{ blob: Blob; url: string; kind: CardKind } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const s = game.state;

  const cards = useMemo(() => {
    const out: Partial<Record<CardKind, CardData>> = {};
    if (!s) return out;
    const name = (id: string) => s.league.find((b) => b.beachId === id)?.name ?? beachById(id)?.name ?? "Bali coast";
    const r = reportId ? s.reports.find((x) => x.id === reportId) : undefined;
    const c = (r && cleanupCard(s, r, name)) ?? latestCleanup(s, name);
    if (c) out.cleanup = c;
    const p = playerCard(s);
    if (p) out.player = p;
    const b = beachCard(s, beachId ?? r?.beachId);
    if (b) out.beach = b;
    return out;
    // the cards are drawn once per opening; the 5 s poll must not redraw them
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!s, reportId, beachId]);

  const data = cards[kind];
  useEffect(() => {
    if (!data) return;
    let live = true;
    setPng(null); setNote(null);
    renderCard(data).then((blob) => {
      if (!live) return;
      setPng((old) => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob), kind }; });
    }).catch((e) => live && setNote((e as Error).message));
    return () => { live = false; };
  }, [data, kind]);
  useEffect(() => () => { if (png) URL.revokeObjectURL(png.url); }, [png]);

  const ready = png && png.kind === kind;
  const share = async () => {
    if (!ready) return;
    setBusy(true);
    const how = await sharePng(png.blob, CARD_FILE[kind], TEXT[kind]);
    setBusy(false);
    if (how === "saved") setNote("Saved. Open Instagram, add a story and pick this image.");
  };

  return (
    <BottomSheet label="Share to your story" onClose={busy ? undefined : onClose} className="max-h-[calc(100dvh-1rem)]">
      <h2 className="pr-10 text-2xl font-extrabold">Share to your story</h2>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-muted p-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.kind} role="tab" type="button" aria-selected={kind === t.kind} onClick={() => setKind(t.kind)}
            className={cn("h-10 rounded-full px-1 text-xs font-extrabold transition", kind === t.kind ? "bg-white text-brand-ink shadow-sm" : "text-muted-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-4 aspect-[9/16] max-h-[52dvh] overflow-hidden rounded-2xl bg-muted shadow-md ring-1 ring-border">
        {!data ? (
          <div className="grid h-full place-items-center px-6 text-center text-sm font-bold text-muted-foreground">
            {TABS.find((t) => t.kind === kind)!.locked}
          </div>
        ) : ready ? (
          <img src={png.url} alt={`${TABS.find((t) => t.kind === kind)!.label} story card`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center"><Loader2 className="size-7 animate-spin text-brand" /></div>
        )}
      </div>

      {note && <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-center text-sm font-semibold text-brand-ink">{note}</p>}

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button type="button" disabled={!ready || busy} onClick={share}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral via-[#e1306c] to-[#833ab4] text-lg font-extrabold text-white shadow-md disabled:opacity-50 active:scale-[0.98]">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Share2 className="size-5" />} Share to story
        </button>
        <button type="button" disabled={!ready} onClick={() => ready && savePng(png.blob, CARD_FILE[kind])} aria-label="Save PNG"
          className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink disabled:opacity-50 active:scale-95">
          <Download className="size-6" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-muted-foreground">1080 × 1920 PNG, sized for Instagram Stories</p>
    </BottomSheet>
  );
}
