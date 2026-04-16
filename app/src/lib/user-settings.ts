export interface UserSettings {
  dailyGreeting: boolean;
  moodTracking: boolean;
  weeklyReview: boolean;
  healthNudges: boolean;
  interestingFacts: boolean;
  challengeNotifications: boolean;
  soundEnabled: boolean;
  webGrounding: boolean;
}

export type LlmProvider = "gemini" | "openai" | "anthropic";

export interface CustomLlmSettings {
  customLlmProvider?: LlmProvider;
  customLlmApiKey?: string;
  customLlmModel?: string;
}

const STORAGE_KEY = "dzino_settings";
const LLM_STORAGE_KEY = "dzino_llm_settings";

const DEFAULT_SETTINGS: UserSettings = {
  dailyGreeting: true,
  moodTracking: true,
  weeklyReview: true,
  healthNudges: true,
  interestingFacts: true,
  challengeNotifications: true,
  soundEnabled: true,
  webGrounding: true,
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

// ---- Custom LLM settings (stored separately — never sent to server for storage) ----

export function getLlmSettings(): CustomLlmSettings {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LLM_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveLlmSettings(settings: CustomLlmSettings): void {
  if (typeof window === "undefined") return;
  // Only persist if there's actually a key; otherwise clear
  if (settings.customLlmApiKey) {
    localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(settings));
  } else {
    localStorage.removeItem(LLM_STORAGE_KEY);
  }
}
