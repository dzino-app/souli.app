import { getAvatarData, saveAvatarData, type AvatarState } from "./avatar";
import { getSoulFiles } from "./soul";

// Calculate mood decay based on time since last interaction
export function calculateMood(): number {
  const data = getAvatarData();
  const lastInteraction = new Date(data.lastInteraction);
  const now = new Date();
  const daysSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

  let mood = data.mood;

  // Decay: -5 per day without interaction
  if (daysSince > 0) {
    mood -= Math.floor(daysSince) * 5;
  }

  // Penalty for empty soul files
  const soulFiles = getSoulFiles();
  const emptyCount = soulFiles.filter((f) => f.content.includes("_Zatiaľ") || f.content.length < 50).length;
  if (emptyCount > soulFiles.length / 2) {
    mood -= 10;
  }

  return Math.max(0, Math.min(100, mood));
}

// Get the appropriate avatar state based on mood and context
export function getIdleState(): AvatarState {
  const mood = calculateMood();
  const data = getAvatarData();

  // Update stored mood
  data.mood = mood;
  saveAvatarData(data);

  const hour = new Date().getHours();

  // Night time (23:00-06:00) → sleeping
  if (hour >= 23 || hour < 6) return "sleeping";

  // Very sad → sad
  if (mood < 30) return "sad";

  // Check days since interaction
  const daysSince =
    (Date.now() - new Date(data.lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 3) return "sad";

  return "idle";
}

export function getMoodLabel(mood: number): string {
  if (mood >= 80) return "Šťastný";
  if (mood >= 60) return "Spokojný";
  if (mood >= 40) return "Neutrálny";
  if (mood >= 20) return "Smutný";
  return "Osamelý";
}

export function getMoodEmoji(mood: number): string {
  if (mood >= 80) return "😊";
  if (mood >= 60) return "🙂";
  if (mood >= 40) return "😐";
  if (mood >= 20) return "😢";
  return "😔";
}
