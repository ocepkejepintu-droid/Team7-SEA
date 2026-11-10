import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Clock, ShieldAlert } from "lucide-react";
import { TRASH_TYPES, type TrashType } from "@shared/types";
import { GUIDES, guideById, guidesFor, type Difficulty, type Guide } from "@shared/workshop";
import { cn } from "@/lib/utils";
import { Chip, TYPE_LABEL } from "./ReportSheet";
import { Empty } from "./League";

export interface WorkshopFocus { type: TrashType | null; n: number }

const DIFFICULTY: Record<Difficulty, { label: string; cls: string }> = {
  easy: { label: "Easy", cls: "bg-good-soft text-good-ink" },
  medium: { label: "Medium", cls: "bg-amber-soft text-amber-ink" },
  hard: { label: "Hard", cls: "bg-coral-soft text-coral-ink" },
};

function DifficultyBadge({ d }: { d: Difficulty }) {
  const x = DIFFICULTY[d];
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold", x.cls)}>{x.label}</span>;
}

function Minutes({ n }: { n: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-muted-foreground">
      <Clock className="size-3.5" aria-hidden /> {n} min
    </span>
  );
}

/** "🛍️ Plastic" -> "Plastic" (drop the leading emoji for compact text). */
const plainLabel = (t: TrashType) => TYPE_LABEL[t].replace(/^\S+\s/, "");

export function Workshop({ focus }: { focus: WorkshopFocus }) {
  const [type, setType] = useState<TrashType | null>(focus.type);
  const [openId, setOpenId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const listScroll = useRef<number | null>(null); // list scroll offset to restore on "Back"
  const lastOpened = useRef<string | null>(null); // guide whose card gets focus on "Back"

  const scroller = () => root.current?.parentElement ?? null;
  const scrollTop = () => scroller()?.scrollTo({ top: 0 });

  // Something (the report sheet) asked the tab to open on a filter: re-sync, close any guide, jump to the top.
  useEffect(() => {
    setType(focus.type);
    setOpenId(null);
    listScroll.current = null;
    lastOpened.current = null;
    scrollTop();
  }, [focus.n, focus.type]);

  // Back to the list: put the scroll position back where the reader left it.
  useLayoutEffect(() => {
    if (openId === null && listScroll.current !== null) {
      const el = scroller();
      if (el) el.scrollTop = listScroll.current;
      listScroll.current = null;
    }
  }, [openId]);

  // Move focus with the view: to the guide title on open, to the guide's card on back.
  useEffect(() => {
    if (openId) {
      heading.current?.focus({ preventScroll: true });
    } else if (lastOpened.current) {
      const id = lastOpened.current;
      lastOpened.current = null;
      root.current?.querySelector<HTMLElement>(`[data-guide-id="${id}"]`)?.focus({ preventScroll: true });
    }
  }, [openId]);

  const chipTypes = useMemo(() => {
    const withGuides = TRASH_TYPES.filter((t) => GUIDES.some((g) => g.types.includes(t)));
    return type && !withGuides.includes(type) ? [...withGuides, type] : withGuides;
  }, [type]);

  const guides = guidesFor(type);
  const guide = openId ? guideById(openId) : undefined;

  const open = (g: Guide) => {
    listScroll.current = scroller()?.scrollTop ?? 0;
    lastOpened.current = g.id;
    setOpenId(g.id);
    scrollTop();
  };
  const close = () => setOpenId(null);

  return (
    <div ref={root} className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      {guide ? (
        <Detail guide={guide} onBack={close} headingRef={heading} />
      ) : (
        <>
          <h1 className="text-3xl font-extrabold tracking-tight">Workshop</h1>
          <p className="text-sm font-semibold text-muted-foreground">Turn beach trash into something useful.</p>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by trash type">
            <Chip on={type === null} onClick={() => setType(null)}>All</Chip>
            {chipTypes.map((t) => (
              <Chip key={t} on={type === t} onClick={() => setType(t)}>{TYPE_LABEL[t]}</Chip>
            ))}
          </div>

          {guides.length === 0 ? (
            <div>
              <Empty emoji="🧰" title="No guides for this yet" text="We're still collecting ideas for this kind of trash. Try another type." />
              <button type="button" onClick={() => setType(null)} className="mt-3 h-12 w-full rounded-2xl bg-brand-soft font-bold text-brand-ink active:scale-[0.98]">
                Show all guides
              </button>
            </div>
          ) : (
            <ul className="mt-4 space-y-3" aria-label="Reuse guides">
              {guides.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => open(g)}
                    data-guide-id={g.id}
                    className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-border transition active:scale-[0.99] active:bg-canvas"
                  >
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-3xl" aria-hidden>{g.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-extrabold leading-tight">{g.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{g.blurb}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <DifficultyBadge d={g.difficulty} />
                        <Minutes n={g.minutes} />
                        {g.types.map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{plainLabel(t)}</span>
                        ))}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Detail({ guide, onBack, headingRef }: { guide: Guide; onBack: () => void; headingRef: React.Ref<HTMLHeadingElement> }) {
  return (
    <article>
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 flex min-h-11 items-center gap-1.5 rounded-full pr-3 text-sm font-extrabold text-brand-ink active:opacity-70"
      >
        <span className="grid size-11 place-items-center rounded-full bg-muted text-foreground"><ArrowLeft className="size-5" aria-hidden /></span>
        Back
      </button>

      <header className="mt-2 flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-brand-soft text-4xl" aria-hidden>{guide.emoji}</span>
        <div className="min-w-0">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl leading-tight font-extrabold tracking-tight outline-none">{guide.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <DifficultyBadge d={guide.difficulty} />
            <Minutes n={guide.minutes} />
          </div>
        </div>
      </header>

      <p className="mt-3 text-base font-semibold text-muted-foreground">{guide.blurb}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {guide.types.map((t) => (
          <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{TYPE_LABEL[t]}</span>
        ))}
      </div>

      <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-border" aria-labelledby="ws-need">
        <h2 id="ws-need" className="text-xs font-extrabold uppercase tracking-wider text-brand-ink">You'll need</h2>
        <ul className="mt-2 space-y-1.5">
          {guide.materials.map((m, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] font-semibold">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
              <span className="min-w-0">{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4" aria-labelledby="ws-steps">
        <h2 id="ws-steps" className="text-xl font-extrabold">Steps</h2>
        <ol className="mt-3 space-y-3">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-border">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white tabular-nums" aria-hidden>{i + 1}</span>
              <p className="min-w-0 flex-1 pt-0.5 text-[15px] leading-snug">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="mt-5 rounded-2xl bg-amber-soft p-4 ring-2 ring-amber/50" aria-labelledby="ws-safe">
        <h2 id="ws-safe" className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-amber-ink">
          <ShieldAlert className="size-5" aria-hidden /> Safety first
        </h2>
        <p className="mt-1.5 text-[15px] font-semibold text-amber-ink">{guide.safety}</p>
      </aside>

      <button type="button" onClick={onBack} className="mt-5 h-12 w-full rounded-2xl bg-brand-soft font-bold text-brand-ink active:scale-[0.98]">
        More guides
      </button>
    </article>
  );
}
