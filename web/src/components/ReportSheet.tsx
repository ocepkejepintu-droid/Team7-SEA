import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ImageIcon, Loader2, MapPin, Sparkles, X, ArrowLeft } from "lucide-react";
import { SIZES, TRASH_TYPES, type Size, type Tag, type TrashType } from "@shared/types";
import { reportPoints } from "@shared/game";
import { api, ApiError, type ReportResult } from "@/lib/api";
import { resizePhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";
import "./map.css";

export const TYPE_LABEL: Record<TrashType, string> = { plastic: "🛍️ Plastic", bottles: "🍾 Bottles", nets: "🎣 Nets", organic: "🍂 Organic", mixed: "🗑️ Mixed", other: "❓ Other" };
export const SIZE_LABEL: Record<Size, string> = { S: "A handful", M: "A bag", L: "More than a bag" };

export const errText = (e: unknown) =>
  e instanceof ApiError
    ? e.status === 413 ? "That photo is too big. Try another one." : e.status === 429 ? "Slow down a little, then try again." : e.message
    : "Can't reach the server. Check your connection.";

/** A bottom sheet that leaves the map usable above it (no modal overlay). */
export function BottomSheet({ children, onClose, label, className }: { children: ReactNode; onClose?: () => void; label: string; className?: string }) {
  useEffect(() => {
    if (!onClose) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center">
      <section role="dialog" aria-label={label}
        className={cn("sheet-in pointer-events-auto relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[28px] bg-white shadow-[0_-8px_40px_rgba(18,52,59,0.18)]", className)}>
        <div className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-border" aria-hidden />
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="size-5" />
          </button>
        )}
        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">{children}</div>
      </section>
    </div>
  );
}

export function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={cn("min-h-11 rounded-full border-2 px-3.5 text-sm font-bold transition active:scale-95",
        on ? "border-brand bg-brand-soft text-brand-ink" : "border-border bg-white text-muted-foreground", className)}>
      {children}
    </button>
  );
}

export function PhotoButtons({ onFile, takeLabel = "Take a photo" }: { onFile: (f: File) => void; takeLabel?: string }) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); };
  return (
    <div className="flex flex-col gap-2">
      <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} data-testid="photo-camera" />
      <input ref={gal} type="file" accept="image/*" className="hidden" onChange={pick} data-testid="photo-gallery" />
      <button type="button" onClick={() => cam.current?.click()}
        className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-extrabold text-white shadow-md shadow-brand/30 active:scale-[0.98]">
        <Camera className="size-6" /> {takeLabel}
      </button>
      <button type="button" onClick={() => gal.current?.click()}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-soft font-bold text-brand-ink active:scale-[0.98]">
        <ImageIcon className="size-5" /> Choose from gallery
      </button>
    </div>
  );
}

type Step = "photo" | "tags" | "pin";
export interface Picked { lng: number; lat: number; beachId: string; beachName: string }

export function ReportSheet({ onClose, pick, onPickStart, onPickEnd, onSubmitted }: {
  onClose: () => void;
  pick: Picked | null;
  onPickStart: () => void;
  onPickEnd: () => void;
  onSubmitted: (r: ReportResult) => Promise<void> | void;
}) {
  const [step, setStep] = useState<Step>("photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [tag, setTag] = useState<Tag | null>(null);
  const [type, setType] = useState<TrashType>("plastic");
  const [size, setSize] = useState<Size>("M");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = async (f: File) => {
    setError(null);
    setPreview(URL.createObjectURL(f));
    try {
      setBusy("Getting your photo ready…");
      const b64 = await resizePhoto(f);
      setPhoto(b64);
      setBusy("Claude is looking at your photo…");
      try {
        const t = await api.tag(b64);
        setTag(t); setType(t.type); setSize(t.size);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 413 || e.status === 429)) { setError(errText(e)); setBusy(null); return; }
        setTag({ isTrash: true, type: "plastic", size: "M", summary: "", ai: false });
      }
      setStep("tags");
    } catch {
      setError("We couldn't read that photo. Try another one.");
    } finally { setBusy(null); }
  };

  const toPin = () => { setStep("pin"); setError(null); onPickStart(); };
  const back = () => { setStep("tags"); onPickEnd(); };

  const submit = async () => {
    if (!pick || !photo) return;
    setError(null); setBusy("Sending your report…");
    try {
      const res = await api.report({ lng: pick.lng, lat: pick.lat, photo, type, size });
      await onSubmitted(res);
    } catch (e) { setError(errText(e)); }
    finally { setBusy(null); }
  };

  if (step === "pin") {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <section role="dialog" aria-label="Place the pin" className="sheet-in pointer-events-auto w-full max-w-md rounded-3xl bg-white p-3 shadow-[0_-4px_30px_rgba(18,52,59,0.2)]">
          <div className="flex items-center gap-2">
            <button type="button" onClick={back} aria-label="Back" className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-foreground"><ArrowLeft className="size-5" /></button>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold leading-tight text-foreground">Tap the map where the trash is</div>
              <div className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0 text-brand" />
                {pick ? <span className="truncate font-bold text-brand-ink">{pick.beachName}</span> : <span>Finding the coast…</span>}
              </div>
            </div>
            <button type="button" onClick={submit} disabled={!pick || !!busy}
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-coral px-5 font-extrabold text-white shadow-md shadow-coral/30 disabled:opacity-50">
              {busy ? <Loader2 className="size-5 animate-spin" /> : null} Confirm
            </button>
          </div>
          {error && <p className="mt-2 rounded-xl bg-coral-soft px-3 py-2 text-sm font-semibold text-coral-ink">{error}</p>}
        </section>
      </div>
    );
  }

  return (
    <BottomSheet label="Report trash" onClose={busy ? undefined : onClose}>
      <h2 className="pr-10 text-2xl font-extrabold text-foreground">Report trash</h2>
      {step === "photo" && (
        <div className="mt-3 flex flex-col gap-4">
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img src={preview} alt="Your photo" className="max-h-64 w-full object-cover" />
              {busy && (
                <div className="absolute inset-0 grid place-items-center bg-brand-ink/55 text-white">
                  <div className="flex flex-col items-center gap-2 px-6 text-center font-extrabold"><Sparkles className="size-8 animate-pulse" />{busy}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid place-items-center gap-1 rounded-2xl bg-sea/60 px-6 py-8 text-center">
              <div className="text-5xl" aria-hidden>📸</div>
              <p className="font-bold text-foreground">Snap the trash you see on the beach.</p>
              <p className="text-sm text-muted-foreground">Claude will help you tag it.</p>
            </div>
          )}
          {!busy && <PhotoButtons onFile={onFile} takeLabel={preview ? "Take another photo" : "Take a photo"} />}
        </div>
      )}
      {step === "tags" && tag && (
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex gap-3">
            {preview && <img src={preview} alt="Your photo" className="size-20 shrink-0 rounded-2xl object-cover" />}
            <div className="min-w-0 self-center">
              {tag.ai ? (
                <p className="text-sm text-foreground"><span className="font-extrabold text-brand-ink">Claude sees:</span> {tag.summary || "some trash"}</p>
              ) : <p className="font-extrabold text-foreground">Pick what you see</p>}
            </div>
          </div>
          {!tag.isTrash && (
            <p className="rounded-2xl bg-amber-soft px-3.5 py-2.5 text-sm font-semibold text-amber-ink">Claude isn't sure this is trash. You can still report it.</p>
          )}
          <div>
            <div className="mb-2 text-sm font-extrabold text-muted-foreground">What kind?</div>
            <div className="flex flex-wrap gap-2">
              {TRASH_TYPES.map((t) => <Chip key={t} on={type === t} onClick={() => setType(t)}>{TYPE_LABEL[t]}</Chip>)}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-extrabold text-muted-foreground">How much?</div>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((s) => (
                <Chip key={s} on={size === s} onClick={() => setSize(s)} className="flex flex-col items-center justify-center rounded-2xl px-2 py-1.5 leading-tight">
                  <span className="text-base font-black">{s}</span><span className="text-xs">{SIZE_LABEL[s]}</span>
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3">
            <span className="font-bold text-brand-ink">You'll earn</span>
            <span className="text-2xl font-black text-brand">+{reportPoints(size)}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("photo")} className="h-13 rounded-2xl bg-muted px-4 font-bold text-foreground">New photo</button>
            <button type="button" onClick={toPin} className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-extrabold text-white shadow-md shadow-brand/30">
              <MapPin className="size-5" /> Place it on the map
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-sm font-semibold text-coral-ink">{error}</p>}
    </BottomSheet>
  );
}
