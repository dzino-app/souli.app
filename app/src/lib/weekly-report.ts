/**
 * Weekly Souli Report — data collector.
 *
 * Gathers stats from the past 7 days across localStorage stores:
 * conversations, mood history, soul changelog, gamification, and avatar.
 */

import { getConversations } from "./conversations";
import { getMoodHistory } from "./mood-tracking";
import { getChangelog } from "./soul-changelog";
import { getGamification, getXpForLevel } from "./gamification";
import { getAvatarData } from "./avatar";
import type { AvatarAppearance } from "./avatar";

export interface WeeklyReportData {
  totalMessages: number;
  soulChanges: number;
  moodAverage: number;
  moodTrend: "up" | "down" | "stable";
  streakDays: number;
  xpGained: number;
  topTopics: string[];
  level: number;
  avatarName: string;
  avatarAppearance: AvatarAppearance;
  dateRange: { start: string; end: string };
  /** True if there's been at least 1 user message this week */
  hasActivity: boolean;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function generateWeeklyReport(): WeeklyReportData {
  const now = new Date();
  const weekStart = daysAgo(6); // last 7 days including today
  const weekStartStr = dateStr(weekStart);
  const prevWeekStart = daysAgo(13);
  const prevWeekStartStr = dateStr(prevWeekStart);

  // --- Messages ---
  const conversations = getConversations();
  let totalMessages = 0;
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      if (msg.role === "user" && msg.timestamp.slice(0, 10) >= weekStartStr) {
        totalMessages++;
      }
    }
  }

  // --- Soul changelog ---
  const changelog = getChangelog();
  const weekChanges = changelog.filter(
    (e) => e.timestamp.slice(0, 10) >= weekStartStr
  );
  const soulChanges = weekChanges.length;

  // Top topics: most frequently updated soul file slugs
  const slugCounts: Record<string, number> = {};
  for (const entry of weekChanges) {
    slugCounts[entry.slug] = (slugCounts[entry.slug] || 0) + 1;
  }
  const topTopics = Object.entries(slugCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => slug);

  // --- Mood ---
  const thisWeekMoods = getMoodHistory(7);
  const prevWeekMoods = getMoodHistory(14).filter(
    (e) =>
      e.date >= prevWeekStartStr && e.date < weekStartStr
  );

  const moodAverage =
    thisWeekMoods.length > 0
      ? thisWeekMoods.reduce((s, e) => s + e.mood, 0) / thisWeekMoods.length
      : 0;

  let moodTrend: "up" | "down" | "stable" = "stable";
  if (thisWeekMoods.length > 0 && prevWeekMoods.length > 0) {
    const prevAvg =
      prevWeekMoods.reduce((s, e) => s + e.mood, 0) / prevWeekMoods.length;
    const diff = moodAverage - prevAvg;
    if (diff > 0.3) moodTrend = "up";
    else if (diff < -0.3) moodTrend = "down";
  }

  // --- Gamification ---
  const gam = getGamification();
  const streakDays = gam.streak;
  const level = gam.level;

  // Approximate XP gained this week: total XP minus what level start would be
  // This is a rough estimate; we use dailyXpEarned as a floor
  const levelStartXp = getXpForLevel(level);
  const xpSinceLevel = gam.xp - levelStartXp;
  const xpGained = Math.max(gam.dailyXpEarned, Math.min(xpSinceLevel, gam.xp));

  // --- Avatar ---
  const avatar = getAvatarData();

  // Date range for display
  const dateRange = {
    start: weekStartStr,
    end: dateStr(now),
  };

  return {
    totalMessages,
    soulChanges,
    moodAverage: Math.round(moodAverage * 10) / 10,
    moodTrend,
    streakDays,
    xpGained,
    topTopics,
    level,
    avatarName: avatar.name,
    avatarAppearance: avatar.appearance,
    dateRange,
    hasActivity: totalMessages > 0,
  };
}
