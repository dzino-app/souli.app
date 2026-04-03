import type { GamificationData } from "./gamification";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (data: GamificationData) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_chat",
    name: "Prvý rozhovor",
    description: "Pošli prvú správu",
    icon: "🗣️",
    condition: (data) => data.xp > 0,
  },
  {
    id: "streak_3",
    name: "3 dni v rade",
    description: "Dosiahni 3-dňový streak",
    icon: "🔥",
    condition: (data) => data.streak >= 3 || data.longestStreak >= 3,
  },
  {
    id: "streak_7",
    name: "Týždenný parťák",
    description: "Dosiahni 7-dňový streak",
    icon: "⭐",
    condition: (data) => data.streak >= 7 || data.longestStreak >= 7,
  },
  {
    id: "streak_30",
    name: "Mesačný parťák",
    description: "Dosiahni 30-dňový streak",
    icon: "🏆",
    condition: (data) => data.streak >= 30 || data.longestStreak >= 30,
  },
  {
    id: "level_5",
    name: "Úroveň 5",
    description: "Dosiahni úroveň 5",
    icon: "📈",
    condition: (data) => data.level >= 5,
  },
  {
    id: "level_10",
    name: "Úroveň 10",
    description: "Dosiahni úroveň 10",
    icon: "🚀",
    condition: (data) => data.level >= 10,
  },
  {
    id: "soul_filled",
    name: "Plná duša",
    description: "Všetky predvolené súbory duše majú viac ako 5 záznamov",
    icon: "💫",
    // This is checked externally — soul data isn't in GamificationData.
    // The achievement is granted by calling code when it detects the condition.
    condition: () => false,
  },
  {
    id: "xp_100",
    name: "Prvá stovka",
    description: "Získaj 100 XP",
    icon: "💯",
    condition: (data) => data.xp >= 100,
  },
  {
    id: "xp_1000",
    name: "Tisícka",
    description: "Získaj 1000 XP",
    icon: "🎯",
    condition: (data) => data.xp >= 1000,
  },
  {
    id: "custom_file",
    name: "Vlastný súbor",
    description: "Vytvor vlastný súbor duše",
    icon: "📝",
    // Checked externally — granted when user creates a custom soul file.
    condition: () => false,
  },
  {
    id: "challenge_done",
    name: "Prvá výzva",
    description: "Dokonči dennú výzvu",
    icon: "✅",
    // Checked externally — granted when a challenge is completed.
    condition: () => false,
  },
  {
    id: "night_owl",
    name: "Nočná sova",
    description: "Chatuj po polnoci",
    icon: "🦉",
    // Checked externally based on current hour.
    condition: () => false,
  },
  {
    id: "early_bird",
    name: "Ranné vtáča",
    description: "Chatuj pred 7:00",
    icon: "🐦",
    // Checked externally based on current hour.
    condition: () => false,
  },
];

/**
 * Returns all defined achievements.
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

/**
 * Returns achievements that the user has already unlocked.
 */
export function getUnlockedAchievements(data: GamificationData): Achievement[] {
  return ACHIEVEMENTS.filter((a) => data.achievements.includes(a.id));
}

/**
 * Check all achievements against current data and return newly unlocked ones.
 * Also updates the achievements array in the provided data (caller should save).
 */
export function checkAchievements(data: GamificationData): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (data.achievements.includes(achievement.id)) continue;
    if (achievement.condition(data)) {
      data.achievements.push(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

/**
 * Manually grant an achievement by ID (for externally-checked achievements).
 * Returns the achievement if newly granted, null if already had it or not found.
 */
export function grantAchievement(
  data: GamificationData,
  achievementId: string
): Achievement | null {
  if (data.achievements.includes(achievementId)) return null;
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return null;
  data.achievements.push(achievementId);
  return achievement;
}
