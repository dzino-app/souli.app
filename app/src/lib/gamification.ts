export interface GamificationData {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  achievements: string[];
  dailyXpEarned: number;
}

export interface AddXpResult {
  newXp: number;
  leveledUp: boolean;
  newLevel: number;
  xpGained?: number;
  wasLucky?: boolean;
  multiplier?: number;
}

export interface StreakResult {
  streak: number;
  maintained: boolean;
  broken: boolean;
}

const STORAGE_KEY = "dzino_gamification";

const DEFAULT_DATA: GamificationData = {
  xp: 0,
  level: 1,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: "",
  achievements: [],
  dailyXpEarned: 0,
};

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getGamification(): GamificationData {
  if (typeof window === "undefined") return { ...DEFAULT_DATA };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_DATA };
  return JSON.parse(raw);
}

export function saveGamification(data: GamificationData): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

/**
 * Level N requires N*(N-1)*25 XP.
 * Level 1 = 0, Level 2 = 50, Level 3 = 150, Level 4 = 300, Level 5 = 500, etc.
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return level * (level - 1) * 25;
}

/**
 * Given total XP, return the current level (1-50).
 */
export function getLevel(xp: number): number {
  let level = 1;
  while (level < 50 && getXpForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

/**
 * XP needed to reach the next level from the current level.
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 50) return 0;
  return getXpForLevel(currentLevel + 1);
}

/**
 * Progress to next level as 0-100%.
 */
export function getProgressToNextLevel(xp: number): number {
  const level = getLevel(xp);
  if (level >= 50) return 100;
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 100;
  return Math.min(100, Math.round(((xp - currentLevelXp) / range) * 100));
}

/**
 * Add XP and return result including whether a level-up occurred.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addXp(amount: number, _source?: string): AddXpResult {
  const data = getGamification();
  const today = getToday();

  // Reset daily XP if it is a new day
  const isNewDay = data.lastActiveDate !== today;
  if (isNewDay) {
    data.dailyXpEarned = 0;
  }

  // Apply streak multiplier
  let multiplier = 1.0;
  if (data.streak >= 14) multiplier = 2.0;
  else if (data.streak >= 7) multiplier = 1.5;

  // First message of the day bonus
  let bonusXp = 0;
  if (isNewDay && data.dailyXpEarned === 0) {
    bonusXp = 5; // first interaction bonus
  }

  // Random double XP (10% chance) — variable reward for dopamine
  const isLucky = Math.random() < 0.1;
  const finalAmount = Math.round((amount + bonusXp) * multiplier * (isLucky ? 2 : 1));

  const oldLevel = data.level;
  data.xp += finalAmount;
  data.dailyXpEarned += finalAmount;
  data.level = getLevel(data.xp);

  // Maintain streak (must run before updating lastActiveDate)
  const streakResult = checkStreakInternal(data, today);
  data.streak = streakResult.streak;
  data.lastActiveDate = today;
  if (data.streak > data.longestStreak) {
    data.longestStreak = data.streak;
  }

  saveGamification(data);

  return {
    newXp: data.xp,
    leveledUp: data.level > oldLevel,
    newLevel: data.level,
    xpGained: finalAmount,
    wasLucky: isLucky,
    multiplier,
  };
}

// Endowed progress: give 10 XP on first ever session
export function applyEndowedProgress(): boolean {
  const data = getGamification();
  if (data.xp === 0 && data.level === 1) {
    data.xp = 10; // start at ~20% to level 2
    saveGamification(data);
    return true;
  }
  return false;
}

/**
 * Internal streak check that operates on data + a given today string.
 */
function checkStreakInternal(
  data: GamificationData,
  today: string
): { streak: number; maintained: boolean; broken: boolean } {
  const lastActive = data.lastActiveDate;

  // First ever activity
  if (!lastActive) {
    return { streak: 1, maintained: true, broken: false };
  }

  // Already active today
  if (lastActive === today) {
    return { streak: data.streak, maintained: true, broken: false };
  }

  // Active yesterday: streak continues
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (lastActive === yesterdayStr) {
    return { streak: data.streak + 1, maintained: true, broken: false };
  }

  // More than 1 day gap: streak broken
  return { streak: 1, maintained: false, broken: true };
}

/**
 * Check streak status. Updates storage.
 */
export function checkStreak(): StreakResult {
  const data = getGamification();
  const today = getToday();
  const result = checkStreakInternal(data, today);

  data.streak = result.streak;
  data.lastActiveDate = today;
  if (data.streak > data.longestStreak) {
    data.longestStreak = data.streak;
  }

  saveGamification(data);
  return result;
}
