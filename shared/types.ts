export type Size = "S" | "M" | "L";
export type TrashType = "plastic" | "bottles" | "nets" | "organic" | "mixed" | "other";
export const SIZES: Size[] = ["S", "M", "L"];
export const TRASH_TYPES: TrashType[] = ["plastic", "bottles", "nets", "organic", "mixed", "other"];

export interface Player { id: string; nickname: string; avatar: string; createdAt: string; seeded?: boolean }
export interface Clean { by: string; photo: string; score: number; reason: string; verified: boolean; at: string; points: number; hotspot?: boolean }
export interface Report {
  id: string; beachId: string; lng: number; lat: number; type: TrashType; size: Size; note?: string;
  /** photo id: served at api/photos/<photo> (includes the extension) */
  photo: string; by: string; createdAt: string; status: "open" | "cleaned"; points: number; clean?: Clean; seeded?: boolean;
}
export interface Beach {
  id: string; name: string; kab: string; center: [number, number];
  /** coast polylines, [lng, lat] */
  coast: [number, number][][];
}
export interface BeachStanding { beachId: string; name: string; health: number; open: number; cleanedThisWeek: number; rank: number | null }
export interface Tag { isTrash: boolean; type: TrashType; size: Size; summary: string; ai: boolean }
export interface PlayerScore { id: string; nickname: string; avatar: string; points: number }
export interface Challenge { goal: number; done: number }
export interface GameState {
  reports: Report[]; league: BeachStanding[]; players: PlayerScore[]; challenge: Challenge;
  me?: { player: Player; points: number; badges: string[] };
}
export const BADGES: Record<string, { name: string; emoji: string; how: string }> = {
  first_report: { name: "First report", emoji: "📍", how: "Report your first trash spot" },
  first_clean: { name: "First clean", emoji: "🧹", how: "Clean your first spot" },
  ten_cleans: { name: "Ten cleans", emoji: "🔟", how: "Clean 10 spots" },
  hotspot_hunter: { name: "Hotspot hunter", emoji: "🔥", how: "Clean a hotspot" },
  big_haul: { name: "Big haul", emoji: "💪", how: "Clean a large pile" },
  three_beaches: { name: "Three beaches", emoji: "🏝️", how: "Report on 3 different beaches" },
};
