import { Hammer, Map, Trophy, UserRound } from "lucide-react";
import { useI18n, type Key } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Tab = "map" | "league" | "workshop" | "me";
const TABS: { id: Tab; label: Key; Icon: typeof Map }[] = [
  { id: "map", label: "tab.map", Icon: Map },
  { id: "league", label: "tab.league", Icon: Trophy },
  { id: "workshop", label: "tab.workshop", Icon: Hammer },
  { id: "me", label: "tab.me", Icon: UserRound },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { t } = useI18n();
  return (
    <nav className="relative z-20 shrink-0 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label={t("tab.aria")}>
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors",
                active ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-brand-soft")}>
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              {t(label)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
