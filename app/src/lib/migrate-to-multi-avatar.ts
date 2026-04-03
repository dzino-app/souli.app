/**
 * One-time migration: moves existing single-avatar localStorage data
 * into the new multi-avatar system (Supabase `avatars` table).
 *
 * Called from the API route POST /api/avatars/migrate.
 * The client detects the need via `needsMigration()` from avatars.ts.
 */

import type { AvatarAppearance } from "./avatar";
import type { GamificationData } from "./gamification";

export interface MigrationPayload {
  avatar: {
    name: string;
    appearance: AvatarAppearance;
    mood: number;
    lastInteraction: string;
  };
  gamification: GamificationData;
}

/**
 * Reads existing localStorage data and builds a migration payload
 * for the API. Returns null if no migration is needed.
 */
export function buildMigrationPayload(): MigrationPayload | null {
  if (typeof window === "undefined") return null;

  const avatarRaw = localStorage.getItem("dzino_avatar");
  if (!avatarRaw) return null;

  let avatar;
  try {
    avatar = JSON.parse(avatarRaw);
  } catch {
    return null;
  }

  if (!avatar?.appearance?.species) return null;

  let gamification: GamificationData;
  try {
    const gamRaw = localStorage.getItem("dzino_gamification");
    gamification = gamRaw
      ? JSON.parse(gamRaw)
      : { xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: "", achievements: [], dailyXpEarned: 0 };
  } catch {
    gamification = { xp: 0, level: 1, streak: 0, longestStreak: 0, lastActiveDate: "", achievements: [], dailyXpEarned: 0 };
  }

  return {
    avatar: {
      name: avatar.name || "Dzino",
      appearance: avatar.appearance,
      mood: avatar.mood ?? 70,
      lastInteraction: avatar.lastInteraction || new Date().toISOString(),
    },
    gamification,
  };
}
