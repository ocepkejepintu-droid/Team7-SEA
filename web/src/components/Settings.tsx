import { Languages, Moon, Sun } from "lucide-react";
import { LANGS, useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const seg = "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-extrabold transition";
const segOn = "bg-card text-brand-ink shadow-sm dark:bg-brand-soft";
const segOff = "text-muted-foreground";

/** Language buttons, each labelled in its own language. `compact` shows short codes. */
export function LanguagePicker({ compact }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={cn("flex rounded-full bg-muted p-1", compact && "w-fit")} role="radiogroup" aria-label={t("settings.language")}>
      {LANGS.map((l) => (
        <button key={l.id} type="button" role="radio" aria-checked={lang === l.id} lang={l.locale} aria-label={l.label} title={l.label} onClick={() => setLang(l.id)}
          className={cn(seg, compact && "h-9 min-w-10 flex-none px-3", lang === l.id ? segOn : segOff)}>
          {compact ? l.short : l.label}
        </button>
      ))}
    </div>
  );
}

/** Light / dark switch. `compact` is a single icon button that flips the theme. */
export function ThemePicker({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  if (compact) {
    const next = theme === "dark" ? "light" : "dark";
    return (
      <button type="button" onClick={() => setTheme(next)} aria-label={`${t("settings.theme")}: ${t(`settings.${next}`)}`}
        className="grid size-11 place-items-center rounded-full bg-muted text-foreground transition active:scale-95">
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
    );
  }
  return (
    <div className="flex rounded-full bg-muted p-1" role="radiogroup" aria-label={t("settings.theme")}>
      {(["light", "dark"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={theme === m} onClick={() => setTheme(m)} className={cn(seg, theme === m ? segOn : segOff)}>
          {m === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />} {t(`settings.${m}`)}
        </button>
      ))}
    </div>
  );
}

/** The settings card on the Me tab. */
export function Settings() {
  const { t } = useI18n();
  return (
    <section className="mt-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border" aria-label={t("settings.title")}>
      <p className="flex items-center gap-1.5 text-sm font-extrabold text-muted-foreground"><Languages className="size-4" /> {t("settings.language")}</p>
      <div className="mt-2"><LanguagePicker /></div>
      <p className="mt-4 text-sm font-extrabold text-muted-foreground">{t("settings.theme")}</p>
      <div className="mt-2"><ThemePicker /></div>
    </section>
  );
}
