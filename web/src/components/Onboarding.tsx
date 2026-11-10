import { useState, type FormEvent } from "react";
import { Camera, Loader2, Sparkles, TrendingUp } from "lucide-react";
import type { Game } from "@/lib/useGame";
import { useI18n, type Key } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { errText } from "./ReportSheet";
import { LanguagePicker, ThemePicker } from "./Settings";

const AVATARS = ["🐢", "🐬", "🦀", "🐙", "🐠", "🦈", "🐳", "🌊", "🏄", "🌴", "🐚", "🦭"];
const STEPS: { Icon: typeof Camera; title: Key; text: Key }[] = [
  { Icon: Camera, title: "onb.step1.title", text: "onb.step1.text" },
  { Icon: Sparkles, title: "onb.step2.title", text: "onb.step2.text" },
  { Icon: TrendingUp, title: "onb.step3.title", text: "onb.step3.text" },
];

export function Onboarding({ game }: { game: Game }) {
  const { t } = useI18n();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = nickname.trim();
  const valid = name.length >= 2 && name.length <= 20;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError(null);
    try { await game.join(name, avatar); }
    catch (err) { setError(errText(t, err)); setBusy(false); }
  }

  return (
    <div className="min-h-dvh overflow-y-auto bg-canvas">
      <form onSubmit={submit} className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <LanguagePicker compact />
          <ThemePicker compact />
        </div>
        <header className="text-center">
          <img src="./logo.png" alt="" aria-hidden width={96} height={96} className="pl-float mx-auto size-24 drop-shadow-lg" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-brand-ink">Hai Pantai</h1>
          <p className="mt-2 text-lg font-semibold text-foreground/80">{t("app.tagline")}</p>
        </header>

        <ol className="mt-7 grid grid-cols-3 gap-2">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="rounded-2xl bg-card p-3 text-center shadow-sm ring-1 ring-border">
              <span className="mx-auto grid size-9 place-items-center rounded-full bg-brand-soft text-brand-ink"><Icon className="size-[18px]" strokeWidth={2.5} /></span>
              <p className="mt-2 text-sm font-extrabold"><span className="text-muted-foreground">{i + 1}.</span> {t(title)}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(text)}</p>
            </li>
          ))}
        </ol>

        <section className="mt-6 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <label htmlFor="nick" className="text-base font-extrabold">{t("onb.nickname")}</label>
          <input
            id="nick"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            maxLength={20}
            autoComplete="nickname"
            placeholder={t("onb.placeholder")}
            className="mt-2 h-12 w-full rounded-xl border-2 bg-canvas px-4 text-base font-semibold outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t("onb.hint")}</p>

          <p className="mt-5 text-base font-extrabold">{t("onb.buddy")}</p>
          <div className="mt-2 grid grid-cols-4 gap-2" role="radiogroup" aria-label={t("onb.avatar")}>
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={a === avatar}
                onClick={() => setAvatar(a)}
                className={cn(
                  "grid aspect-square min-h-12 place-items-center rounded-2xl text-3xl transition-all",
                  a === avatar ? "scale-105 bg-brand-soft ring-[3px] ring-brand" : "bg-canvas hover:bg-muted active:scale-95",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        {error && <p role="alert" className="mt-4 rounded-xl bg-coral-soft px-4 py-3 text-sm font-bold text-coral-ink">{error}</p>}

        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={!valid || busy}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-lg font-extrabold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:bg-brand/40 disabled:shadow-none"
          >
            {busy ? <><Loader2 className="size-5 animate-spin" /> {t("onb.joining")}</> : t("onb.start")}
          </button>
        </div>
      </form>
    </div>
  );
}
