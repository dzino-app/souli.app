export interface UserSettings {
  dailyGreeting: boolean;
  moodTracking: boolean;
  weeklyReview: boolean;
  healthNudges: boolean;
  interestingFacts: boolean;
  challengeNotifications: boolean;
}

const STORAGE_KEY = "dzino_settings";

const DEFAULT_SETTINGS: UserSettings = {
  dailyGreeting: true,
  moodTracking: true,
  weeklyReview: true,
  healthNudges: true,
  interestingFacts: true,
  challengeNotifications: true,
};

export function getUserSettings(): UserSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function updateSetting(
  key: keyof UserSettings,
  value: boolean
): UserSettings {
  const current = getUserSettings();
  const updated = { ...current, [key]: value };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
