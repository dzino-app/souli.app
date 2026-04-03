/**
 * Client-side avatar management with localStorage caching.
 * Wraps Supabase calls from avatars-db.ts for the browser.
 */

import type { AvatarRow } from "./supabase/avatars-db";

const ACTIVE_AVATAR_KEY = "dzino_active_avatar_id";
const AVATARS_CACHE_KEY = "dzino_avatars_cache";

// ---------- Active avatar ID ----------

export function getActiveAvatarId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_AVATAR_KEY);
}

export function setActiveAvatarId(id: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVE_AVATAR_KEY, id);
  }
}

export function clearActiveAvatarId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACTIVE_AVATAR_KEY);
  }
}

// ---------- Avatars cache ----------

export function getCachedAvatars(): AvatarRow[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AVATARS_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setCachedAvatars(avatars: AvatarRow[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AVATARS_CACHE_KEY, JSON.stringify(avatars));
  }
}

export function getCachedActiveAvatar(): AvatarRow | null {
  const id = getActiveAvatarId();
  if (!id) return null;
  const avatars = getCachedAvatars();
  return avatars.find((a) => a.id === id) ?? null;
}

// ---------- Migration detection ----------

export function needsMigration(): boolean {
  if (typeof window === "undefined") return false;
  // If there's no active avatar id but there IS existing avatar data in localStorage,
  // we need to migrate
  const hasActiveId = !!localStorage.getItem(ACTIVE_AVATAR_KEY);
  const hasOldAvatar = !!localStorage.getItem("dzino_avatar");
  return !hasActiveId && hasOldAvatar;
}
