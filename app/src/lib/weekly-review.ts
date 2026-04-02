import { getGamification } from "./gamification";
import { getConversations } from "./conversations";
import { getDailyChallenges } from "./challenges";
import { getSoulFiles } from "./soul";

const LAST_REVIEW_KEY = "dzino_last_weekly_review";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // Monday as week start
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekDateRange(): { start: string; end: string } {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    start: weekStart.toISOString().slice(0, 10),
    end: weekEnd.toISOString().slice(0, 10),
  };
}

function countActiveDays(): number {
  const { start } = getWeekDateRange();
  const conversations = getConversations();
  const activeDays = new Set<string>();

  for (const conv of conversations) {
    for (const msg of conv.messages) {
      const msgDate = msg.timestamp.slice(0, 10);
      if (msgDate >= start) {
        activeDays.add(msgDate);
      }
    }
  }
  return activeDays.size;
}

function countWeekMessages(): number {
  const { start } = getWeekDateRange();
  const conversations = getConversations();
  let count = 0;

  for (const conv of conversations) {
    for (const msg of conv.messages) {
      if (msg.role === "user" && msg.timestamp.slice(0, 10) >= start) {
        count++;
      }
    }
  }
  return count;
}

function countCompletedChallenges(): number {
  const challenges = getDailyChallenges();
  return challenges.filter((c) => c.completed).length;
}

function countSoulUpdates(): number {
  const { start } = getWeekDateRange();
  const files = getSoulFiles();
  let count = 0;

  for (const file of files) {
    if (file.updatedAt.slice(0, 10) >= start) {
      count++;
    }
  }
  return count;
}

function getEncouragingNote(activeDays: number, messages: number): string {
  if (activeDays >= 6) {
    return "Neuveritelny tyzden! Si tu skoro kazdy den -- Dzino je na teba hrdy.";
  }
  if (activeDays >= 4) {
    return "Skvely tyzden! Drzis si pekne tempo, tak pokracuj dalej.";
  }
  if (activeDays >= 2) {
    return "Dobry zaciatok! Skus si buduci tyzden najst cas castejsie.";
  }
  if (messages > 0) {
    return "Dakujem, ze si sa ozval! Kazdy rozhovor sa pocita.";
  }
  return "Tento tyzden bolo ticho, ale nic sa nedeje. Dzino tu na teba caka!";
}

export function generateWeeklyReview(): string {
  const gamification = getGamification();
  const activeDays = countActiveDays();
  const messages = countWeekMessages();
  const challenges = countCompletedChallenges();
  const soulUpdates = countSoulUpdates();
  const streak = gamification.streak;
  const level = gamification.level;
  const xpGained = gamification.dailyXpEarned; // approximate for this session

  const { start, end } = getWeekDateRange();
  const note = getEncouragingNote(activeDays, messages);

  const lines = [
    `## Tyzdenny prehlad (${start} - ${end})`,
    "",
    `- **Aktivne dni:** ${activeDays}/7`,
    `- **Odoslane spravy:** ${messages}`,
    `- **Splnene vyzvy:** ${challenges}`,
    `- **Aktualizacie duse:** ${soulUpdates}`,
    `- **Seria:** ${streak} dni v rade`,
    `- **Uroven:** ${level} (${xpGained} XP dnes)`,
    "",
    `> ${note}`,
  ];

  return lines.join("\n");
}

export function shouldShowWeeklyReview(): boolean {
  if (typeof window === "undefined") return false;

  const lastReview = localStorage.getItem(LAST_REVIEW_KEY);
  const now = new Date();
  const isSunday = now.getDay() === 0;

  if (!lastReview) {
    return isSunday;
  }

  const lastDate = new Date(lastReview);
  const daysSinceReview = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isSunday && lastReview.slice(0, 10) !== now.toISOString().slice(0, 10)) {
    return true;
  }

  return daysSinceReview >= 7;
}

export function saveWeeklyReview(review: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_REVIEW_KEY, new Date().toISOString());

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const soul = require("./soul") as typeof import("./soul");
  const { getSoulFile, updateSoulFileInCache } = soul;
  const dennik = getSoulFile("dennik");
  if (dennik) {
    const newContent = dennik.content.trimEnd() + "\n\n" + review;
    updateSoulFileInCache("dennik", newContent, "dzino");
  }
}

export function dismissWeeklyReview(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_REVIEW_KEY, new Date().toISOString());
  }
}
