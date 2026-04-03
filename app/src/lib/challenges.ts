export type ProofType = "text" | "photo" | "either";

export interface DailyChallenge {
  id: string;
  text: string;
  type: "outdoor" | "social" | "mindful" | "creative" | "chat";
  target: number;
  progress: number;
  completed: boolean;
  emoji: string;
  proofType: ProofType;
  proofHint: string;
  proof?: string;
}

const STORAGE_KEY_PREFIX = "dzino_challenges_";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStorageKey(date?: string): string {
  return STORAGE_KEY_PREFIX + (date || getToday());
}

export function getDailyChallenges(): DailyChallenge[] {
  if (typeof window === "undefined") return [];
  const today = getToday();
  const key = getStorageKey(today);
  const raw = localStorage.getItem(key);

  if (raw) {
    return JSON.parse(raw);
  }

  // Generate using the dynamic generator
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { generateDailyChallenges } = require("./challenge-generator") as typeof import("./challenge-generator");
  const challenges = generateDailyChallenges(today);
  localStorage.setItem(key, JSON.stringify(challenges));
  return challenges;
}

export function updateChallengeProgress(type: string): void {
  if (typeof window === "undefined") return;
  const today = getToday();
  const key = getStorageKey(today);
  const challenges = getDailyChallenges();

  for (const challenge of challenges) {
    if (challenge.type === type && !challenge.completed) {
      challenge.progress = Math.min(challenge.progress + 1, challenge.target);
      if (challenge.progress >= challenge.target) {
        challenge.completed = true;
      }
    }
  }

  localStorage.setItem(key, JSON.stringify(challenges));
}

export function completeChallengeById(id: string, proof?: string): void {
  if (typeof window === "undefined") return;
  const today = getToday();
  const key = getStorageKey(today);
  const challenges = getDailyChallenges();

  for (const challenge of challenges) {
    if (challenge.id === id && !challenge.completed) {
      challenge.progress = challenge.target;
      challenge.completed = true;
      if (proof) challenge.proof = proof;
    }
  }

  localStorage.setItem(key, JSON.stringify(challenges));
}

export function areChallengesComplete(): boolean {
  const challenges = getDailyChallenges();
  return challenges.length > 0 && challenges.every((c) => c.completed);
}

// Regenerate challenges (e.g. when mood changes)
export function regenerateChallenges(): DailyChallenge[] {
  if (typeof window === "undefined") return [];
  const today = getToday();
  const key = getStorageKey(today);

  // Only regenerate if none are completed yet
  const existing = getDailyChallenges();
  if (existing.some((c) => c.completed)) return existing;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { generateDailyChallenges } = require("./challenge-generator") as typeof import("./challenge-generator");
  const challenges = generateDailyChallenges(today + "_v2"); // different seed
  localStorage.setItem(key, JSON.stringify(challenges));
  return challenges;
}
