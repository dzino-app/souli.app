export interface MoodEntry {
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

const STORAGE_KEY = "dzino_mood_history";

function getStorage(): MoodEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveStorage(entries: MoodEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function logMood(mood: 1 | 2 | 3 | 4 | 5, note?: string): void {
  const entries = getStorage();
  const today = new Date().toISOString().split("T")[0];

  // Replace today's entry if it already exists
  const existingIndex = entries.findIndex((e) => e.date === today);
  const entry: MoodEntry = { date: today, mood, note };

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  saveStorage(entries);

  // Async sync mood entry to Supabase
  import("./supabase/sync")
    .then(({ syncMoodToSupabase }) => syncMoodToSupabase([entry]))
    .catch(() => {});
}

export function getMoodHistory(days?: number): MoodEntry[] {
  const entries = getStorage();
  if (!days) return entries;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return entries.filter((e) => e.date >= cutoffStr);
}

export function getMoodTrend(): "improving" | "declining" | "stable" | "unknown" {
  const recent = getMoodHistory(14);
  if (recent.length < 3) return "unknown";

  // Split into two halves and compare averages
  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);

  const avgFirst =
    firstHalf.reduce((sum, e) => sum + e.mood, 0) / firstHalf.length;
  const avgSecond =
    secondHalf.reduce((sum, e) => sum + e.mood, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

export function getAverageMood(days?: number): number {
  const entries = days ? getMoodHistory(days) : getStorage();
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
}

export function getTodayMood(): MoodEntry | null {
  const today = new Date().toISOString().split("T")[0];
  const entries = getStorage();
  return entries.find((e) => e.date === today) ?? null;
}
