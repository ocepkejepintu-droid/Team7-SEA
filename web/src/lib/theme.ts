import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const STORE = "pantai.theme";
/** Browser chrome colour per theme (matches --canvas in styles.css). */
const CHROME: Record<Theme, string> = { light: "#0e9f9a", dark: "#0a1c21" };

function initial(): Theme {
  try { const v = localStorage.getItem(STORE); if (v === "light" || v === "dark") return v; } catch { /* private mode */ }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function apply(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME[t]);
}

let current: Theme = initial();
apply(current);
const subs = new Set<() => void>();

export const getTheme = (): Theme => current;
export function setTheme(t: Theme) {
  if (t === current) return;
  current = t;
  try { localStorage.setItem(STORE, t); } catch { /* private mode */ }
  apply(t);
  for (const f of subs) f();
}
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

/** The current theme. Re-renders when it changes. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);
  return { theme, setTheme };
}
