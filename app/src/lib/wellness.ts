import { getMoodHistory, getAverageMood, type MoodEntry } from "./mood-tracking";
import { getGamification } from "./gamification";
import { getConversations } from "./conversations";

export interface MoodDataPoint {
  date: string;
  mood: number; // 0 = no data, 1-5 = mood
  dayLabel: string;
}

const DAY_LABELS = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Build mood data points for the last N days.
 * Returns an array sorted chronologically (oldest first).
 */
function getMoodDataPoints(days: number): MoodDataPoint[] {
  const entries = getMoodHistory(days);
  const entryMap = new Map<string, MoodEntry>();
  for (const e of entries) {
    entryMap.set(e.date, e);
  }

  const points: MoodDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    const entry = entryMap.get(dateStr);
    points.push({
      date: dateStr,
      mood: entry?.mood ?? 0,
      dayLabel: DAY_LABELS[d.getDay()],
    });
  }

  return points;
}

/**
 * Returns last 7 days of mood data.
 */
export function getWeeklyMoodData(): MoodDataPoint[] {
  return getMoodDataPoints(7);
}

/**
 * Returns last 30 days of mood data.
 */
export function getMonthlyMoodData(): MoodDataPoint[] {
  return getMoodDataPoints(30);
}

/**
 * Determines mood trend based on linear regression of available entries in the last 7 days.
 */
export function getMoodTrend(): "improving" | "declining" | "stable" | "unknown" {
  const data = getWeeklyMoodData().filter((d) => d.mood > 0);
  if (data.length < 3) return "unknown";

  // Simple linear regression: y = a + bx
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i].mood;
    sumXY += i * data[i].mood;
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope > 0.15) return "improving";
  if (slope < -0.15) return "declining";
  return "stable";
}

/**
 * Composite wellness score 0-100.
 * - Mood average: 40% (maps 1-5 to 0-100)
 * - Streak days: 30% (capped at 14 days = 100%)
 * - Activity frequency: 30% (conversations in last 7 days, capped at 14 = 100%)
 */
export function getWellnessScore(): number {
  // Mood component (40%)
  const avgMood = getAverageMood(7);
  const moodScore = avgMood > 0 ? ((avgMood - 1) / 4) * 100 : 0;

  // Streak component (30%)
  const gam = getGamification();
  const streakScore = Math.min(100, (gam.streak / 14) * 100);

  // Activity component (30%) — count conversations with messages in last 7 days
  const weeklyConvCount = getWeeklyConversationCount();
  const activityScore = Math.min(100, (weeklyConvCount / 14) * 100);

  return Math.round(moodScore * 0.4 + streakScore * 0.3 + activityScore * 0.3);
}

/**
 * Count conversations that had activity in the last 7 days.
 */
export function getWeeklyConversationCount(): number {
  const conversations = getConversations();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = toDateStr(cutoff);

  return conversations.filter((c) => {
    // Check if updatedAt falls within the last 7 days
    const updated = c.updatedAt.split("T")[0];
    return updated >= cutoffStr;
  }).length;
}
