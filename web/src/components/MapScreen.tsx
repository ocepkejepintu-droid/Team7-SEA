import type { Game } from "@/lib/useGame";

export interface MapFocus { beachId?: string; reportId?: string; n: number }
/** The Map tab: map, report button, report sheet and report detail. (Stub, replaced by the map builder.) */
export function MapScreen(_: { game: Game; focus?: MapFocus }) {
  return <div className="grid h-full place-items-center text-muted-foreground">Map loading…</div>;
}
