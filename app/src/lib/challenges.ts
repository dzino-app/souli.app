export interface DailyChallenge {
  id: string;
  text: string;
  type: "chat" | "soul" | "event" | "share";
  target: number;
  progress: number;
  completed: boolean;
}

const STORAGE_KEY_PREFIX = "dzino_challenges_";

const CHALLENGE_POOL: Omit<DailyChallenge, "progress" | "completed">[] = [
  { id: "send_3_messages", text: "Pošli 3 správy Dzinovi", type: "chat", target: 3 },
  { id: "tell_about_day", text: "Povedz Dzinovi o svojom dni", type: "chat", target: 1 },
  { id: "add_event", text: "Pridaj udalosť do kalendára", type: "event", target: 1 },
  { id: "edit_soul", text: "Uprav niečo v duši", type: "soul", target: 1 },
  { id: "answer_question", text: "Odpovedz na Dzinovu otázku", type: "chat", target: 1 },
];

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Simple seeded pseudo-random number generator.
 * Uses the date string as a seed so challenges are deterministic per day.
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return () => {
    hash = (hash * 1103515245 + 12345) | 0;
    return ((hash >>> 16) & 0x7fff) / 0x7fff;
  };
}

/**
 * Pick 3 random challenges from the pool, seeded by date.
 */
function generateChallenges(date: string): DailyChallenge[] {
  const rng = seededRandom(date);
  const indices = Array.from({ length: CHALLENGE_POOL.length }, (_, i) => i);

  // Fisher-Yates shuffle with seeded RNG
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, 3).map((idx) => ({
    ...CHALLENGE_POOL[idx],
    progress: 0,
    completed: false,
  }));
}

function getStorageKey(date?: string): string {
  return STORAGE_KEY_PREFIX + (date || getToday());
}

/**
 * Get today's daily challenges. Generates them if not yet created.
 */
export function getDailyChallenges(): DailyChallenge[] {
  if (typeof window === "undefined") return [];
  const today = getToday();
  const key = getStorageKey(today);
  const raw = localStorage.getItem(key);

  if (raw) {
    return JSON.parse(raw);
  }

  const challenges = generateChallenges(today);
  localStorage.setItem(key, JSON.stringify(challenges));
  return challenges;
}

/**
 * Update progress for all challenges matching the given type.
 */
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

/**
 * Check if all daily challenges are complete.
 */
export function areChallengesComplete(): boolean {
  const challenges = getDailyChallenges();
  return challenges.length > 0 && challenges.every((c) => c.completed);
}
