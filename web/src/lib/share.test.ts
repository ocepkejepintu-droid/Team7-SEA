import { describe, expect, it } from "vitest";
import type { GameState, Report } from "@shared/types";
import { beachCard, beachMood, cleanupCard, latestCleanup, playerCard } from "./share";

const rep = (o: Partial<Report>): Report => ({
  id: "r", beachId: "kuta", lng: 0, lat: 0, type: "plastic", size: "M", photo: "a.jpg", by: "p2",
  createdAt: "2026-11-09T00:00:00Z", status: "open", points: 20, ...o,
});
const state: GameState = {
  reports: [
    rep({ id: "r1", beachId: "kuta", by: "me" }),
    rep({ id: "r2", beachId: "sanur", status: "cleaned", clean: { by: "me", photo: "b.jpg", score: 90, reason: "", verified: true, at: "2026-11-09T10:00:00Z", points: 50 } }),
    rep({ id: "r3", beachId: "sanur", status: "cleaned", clean: { by: "me", photo: "c.jpg", score: 70, reason: "", verified: false, at: "2026-11-10T10:00:00Z", points: 40 } }),
  ],
  league: [
    { beachId: "kuta", name: "Kuta", health: 40, open: 3, cleanedThisWeek: 1, rank: 2 },
    { beachId: "sanur", name: "Sanur", health: 95, open: 0, cleanedThisWeek: 2, rank: 1 },
    { beachId: "amed", name: "Amed", health: 100, open: 0, cleanedThisWeek: 0, rank: null },
  ],
  players: [{ id: "p2", nickname: "Wayan", avatar: "🐢", points: 500 }, { id: "me", nickname: "Ayu", avatar: "🦀", points: 120 }],
  challenge: { goal: 50, done: 12 },
  me: { player: { id: "me", nickname: "Ayu", avatar: "🦀", createdAt: "2026-11-01T00:00:00Z" }, points: 120, badges: ["first_clean"] },
};
const name = (id: string) => id.toUpperCase();

describe("story cards", () => {
  it("has no cleanup card for an open report", () => expect(cleanupCard(state, state.reports[0], name)).toBeNull());
  it("uses the latest cleanup by the player", () => {
    const c = latestCleanup(state, name)!;
    expect(c).toMatchObject({ before: "a.jpg", after: "c.jpg", score: 70, points: 40, cleaner: "Ayu", beach: "SANUR" });
  });
  it("ranks the player and lists earned badges first", () => {
    const p = playerCard(state)!;
    expect(p).toMatchObject({ rank: 2, players: 2, reports: 1, cleaned: 2 });
    expect(p.badges[0]).toMatchObject({ name: "First clean", earned: true });
    expect(p.badges.filter((b) => b.earned)).toHaveLength(1);
  });
  it("picks the player's home beach", () => expect(beachCard(state)!.beach).toBe("Sanur"));
  it("counts only ranked beaches", () => expect(beachCard(state, "kuta")).toMatchObject({ rank: 2, ranked: 2, open: 3 }));
  it("picks the headline by standing", () => {
    expect(beachMood(beachCard(state, "sanur")!).tone).toBe("win");
    expect(beachMood(beachCard(state, "kuta")!).tone).toBe("help");
  });
  it("falls back to the winner without a player", () => expect(beachCard({ ...state, me: undefined })!.beach).toBe("Sanur"));
});
