import { BADGES, type GameState, type Report } from "@shared/types";

/** The three story card concepts. */
export type CardKind = "cleanup" | "player" | "beach";

export interface CleanupCard {
  kind: "cleanup";
  beach: string; before: string; after: string;
  score: number; points: number; cleaner: string; avatar: string; at: string; verified: boolean;
}
export interface PlayerCard {
  kind: "player";
  nickname: string; avatar: string; points: number; rank: number | null; players: number;
  reports: number; cleaned: number;
  /** every badge, earned first */
  badges: { emoji: string; name: string; earned: boolean }[];
  since: string;
}
export interface BeachCard {
  kind: "beach";
  beach: string; health: number; rank: number | null; ranked: number; open: number; cleanedThisWeek: number;
  challenge: { goal: number; done: number };
}
export type CardData = CleanupCard | PlayerCard | BeachCard;

/** Cleanup card for a cleaned report, or null when the report is still open. */
export function cleanupCard(s: GameState, r: Report, beachName: (id: string) => string): CleanupCard | null {
  if (r.status !== "cleaned" || !r.clean) return null;
  const who = s.players.find((p) => p.id === r.clean!.by) ?? (s.me?.player.id === r.clean.by ? s.me.player : undefined);
  return {
    kind: "cleanup", beach: beachName(r.beachId), before: r.photo, after: r.clean.photo,
    score: r.clean.score, points: r.clean.points, cleaner: who?.nickname ?? "A player", avatar: who?.avatar ?? "🧹",
    at: r.clean.at, verified: r.clean.verified,
  };
}

/** The player's most recent cleanup. */
export function latestCleanup(s: GameState, beachName: (id: string) => string): CleanupCard | null {
  const me = s.me?.player.id;
  if (!me) return null;
  const mine = s.reports.filter((r) => r.clean?.by === me).sort((a, b) => b.clean!.at.localeCompare(a.clean!.at));
  return mine.length ? cleanupCard(s, mine[0], beachName) : null;
}

export function playerCard(s: GameState): PlayerCard | null {
  if (!s.me) return null;
  const { player, points, badges } = s.me;
  const earned = new Set(badges);
  const sorted = [...s.players].sort((a, b) => b.points - a.points);
  const i = sorted.findIndex((p) => p.id === player.id);
  const all = Object.entries(BADGES).map(([id, b]) => ({ emoji: b.emoji, name: b.name, earned: earned.has(id) }));
  return {
    kind: "player", nickname: player.nickname, avatar: player.avatar, points,
    rank: i >= 0 && points > 0 ? i + 1 : null, players: s.players.length,
    reports: s.reports.filter((r) => r.by === player.id).length,
    cleaned: s.reports.filter((r) => r.clean?.by === player.id).length,
    badges: [...all.filter((b) => b.earned), ...all.filter((b) => !b.earned)],
    since: player.createdAt,
  };
}

/**
 * Beach card. With no beachId: the player's home beach (where they reported or cleaned most),
 * else this week's winner.
 */
export function beachCard(s: GameState, beachId?: string): BeachCard | null {
  const ranked = s.league.filter((b) => b.rank !== null);
  let id = beachId;
  if (!id && s.me) {
    const me = s.me.player.id;
    const n = new Map<string, number>();
    for (const r of s.reports) if (r.by === me || r.clean?.by === me) n.set(r.beachId, (n.get(r.beachId) ?? 0) + 1);
    id = [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }
  if (!id) id = [...ranked].sort((a, b) => a.rank! - b.rank!)[0]?.beachId;
  const b = s.league.find((x) => x.beachId === id);
  if (!b) return null;
  return {
    kind: "beach", beach: b.name, health: b.health, rank: b.rank, ranked: ranked.length,
    open: b.open, cleanedThisWeek: b.cleanedThisWeek, challenge: s.challenge,
  };
}

/** Headline for the beach card, by standing. */
export function beachMood(c: BeachCard): { tone: "win" | "good" | "help"; kicker: string; cta: string } {
  if (c.rank === 1) return { tone: "win", kicker: "Cleanest beach in Bali this week", cta: "Help us keep the crown" };
  if (c.health < 50) return { tone: "help", kicker: "This beach needs help", cta: `${c.open} ${c.open === 1 ? "spot" : "spots"} waiting. Come clean with us` };
  return { tone: "good", kicker: "Climbing the beach league", cta: "Help it reach #1 this week" };
}

export const CARD_FILE: Record<CardKind, string> = { cleanup: "pantai-cleanup.png", player: "pantai-player.png", beach: "pantai-beach.png" };
