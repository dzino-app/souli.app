import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  getGamification,
  addXp,
  checkStreak,
  getLevel,
  getXpForLevel,
  getXpForNextLevel,
  getProgressToNextLevel,
} from "../gamification";
import {
  checkAchievements,
  getAllAchievements,
  getUnlockedAchievements,
  grantAchievement,
} from "../achievements";
import {
  getDailyChallenges,
  updateChallengeProgress,
  areChallengesComplete,
} from "../challenges";

// --- XP and Level ---

describe("gamification - XP and levels", () => {
  // addXp has a 10% random "lucky double" — pin Math.random so tests are
  // deterministic. 0.5 is well above the 0.1 lucky threshold.
  const realRandom = Math.random;
  beforeEach(() => {
    localStorage.clear();
    Math.random = () => 0.5;
  });
  afterEach(() => {
    Math.random = realRandom;
  });

  it("starts with empty gamification data", () => {
    const data = getGamification();
    expect(data.xp).toBe(0);
    expect(data.level).toBe(1);
    expect(data.streak).toBe(0);
    expect(data.achievements).toEqual([]);
  });

  // Note: addXp adds a one-time +5 "first interaction of the day" bonus, so
  // the first call yields amount+5 XP, subsequent same-day calls yield amount.
  it("adds XP correctly", () => {
    const result = addXp(5, "message");
    expect(result.newXp).toBe(10); // 5 + 5 first-interaction bonus
    expect(result.newLevel).toBe(1);
    expect(result.leveledUp).toBe(false);
  });

  it("accumulates XP across calls", () => {
    addXp(5, "message");        // 5 + 5 bonus = 10
    addXp(10, "soul_update");   // 10 → 20
    const result = addXp(5, "message"); // 5 → 25
    expect(result.newXp).toBe(25);
  });

  it("levels up when enough XP is earned", () => {
    // Level 2 requires 50 XP
    const result = addXp(50, "test");
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it("levels up multiple times", () => {
    // Level 3 requires 150 XP
    const result = addXp(150, "test");
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(3);
  });

  it("getLevel returns correct level for various XP amounts", () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(49)).toBe(1);
    expect(getLevel(50)).toBe(2);
    expect(getLevel(149)).toBe(2);
    expect(getLevel(150)).toBe(3);
    expect(getLevel(300)).toBe(4);
    expect(getLevel(500)).toBe(5);
  });

  it("getXpForLevel follows N*(N-1)*25 formula", () => {
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(2)).toBe(50);
    expect(getXpForLevel(3)).toBe(150);
    expect(getXpForLevel(4)).toBe(300);
    expect(getXpForLevel(5)).toBe(500);
    expect(getXpForLevel(10)).toBe(2250);
  });

  it("getXpForNextLevel returns XP needed for next level", () => {
    expect(getXpForNextLevel(1)).toBe(50);
    expect(getXpForNextLevel(2)).toBe(150);
    expect(getXpForNextLevel(4)).toBe(500);
    expect(getXpForNextLevel(50)).toBe(0); // max level
  });

  it("getProgressToNextLevel returns percentage", () => {
    expect(getProgressToNextLevel(0)).toBe(0);
    expect(getProgressToNextLevel(25)).toBe(50);
    expect(getProgressToNextLevel(50)).toBe(0); // at level 2, 0% toward level 3
    expect(getProgressToNextLevel(100)).toBe(50); // halfway from 50 to 150
  });

  it("caps at level 50", () => {
    expect(getLevel(999999)).toBe(50);
    expect(getProgressToNextLevel(999999)).toBe(100);
  });

  it("tracks daily XP earned", () => {
    addXp(5, "message");      // 5 + 5 bonus = 10
    addXp(10, "soul_update"); // 10 → 20
    const data = getGamification();
    expect(data.dailyXpEarned).toBe(20);
  });
});

// --- Streaks ---

describe("gamification - streaks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts a streak on first activity", () => {
    const result = checkStreak();
    expect(result.streak).toBe(1);
    expect(result.maintained).toBe(true);
    expect(result.broken).toBe(false);
  });

  it("maintains streak on same day", () => {
    checkStreak();
    const result = checkStreak();
    expect(result.streak).toBe(1);
    expect(result.maintained).toBe(true);
    expect(result.broken).toBe(false);
  });

  it("addXp also sets streak and lastActiveDate", () => {
    addXp(5, "message");
    const data = getGamification();
    expect(data.streak).toBe(1);
    expect(data.lastActiveDate).toBeTruthy();
  });

  it("tracks longest streak", () => {
    checkStreak();
    const data = getGamification();
    expect(data.longestStreak).toBe(1);
  });

  it("detects broken streak when lastActiveDate is old", () => {
    // Manually set old date to simulate gap
    const data = getGamification();
    data.streak = 5;
    data.longestStreak = 5;
    data.lastActiveDate = "2020-01-01";
    localStorage.setItem("dzino_gamification", JSON.stringify(data));

    const result = checkStreak();
    expect(result.broken).toBe(true);
    expect(result.streak).toBe(1);

    // Longest streak should be preserved
    const updated = getGamification();
    expect(updated.longestStreak).toBe(5);
  });
});

// --- Achievements ---

describe("achievements", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getAllAchievements returns all defined achievements", () => {
    const all = getAllAchievements();
    expect(all.length).toBeGreaterThanOrEqual(13);
    expect(all.find((a) => a.id === "first_chat")).toBeTruthy();
    expect(all.find((a) => a.id === "streak_7")).toBeTruthy();
  });

  it("checkAchievements unlocks first_chat when xp > 0", () => {
    const data = getGamification();
    data.xp = 5;
    const unlocked = checkAchievements(data);
    expect(unlocked.find((a) => a.id === "first_chat")).toBeTruthy();
    expect(data.achievements).toContain("first_chat");
  });

  it("checkAchievements unlocks xp_100 at 100 XP", () => {
    const data = getGamification();
    data.xp = 100;
    const unlocked = checkAchievements(data);
    expect(unlocked.find((a) => a.id === "xp_100")).toBeTruthy();
  });

  it("checkAchievements unlocks streak_3 at 3-day streak", () => {
    const data = getGamification();
    data.streak = 3;
    const unlocked = checkAchievements(data);
    expect(unlocked.find((a) => a.id === "streak_3")).toBeTruthy();
  });

  it("checkAchievements unlocks level_5 at level 5", () => {
    const data = getGamification();
    data.level = 5;
    data.xp = 500;
    const unlocked = checkAchievements(data);
    expect(unlocked.find((a) => a.id === "level_5")).toBeTruthy();
  });

  it("does not unlock already-unlocked achievements", () => {
    const data = getGamification();
    data.xp = 5;
    checkAchievements(data);
    const secondCheck = checkAchievements(data);
    expect(secondCheck.find((a) => a.id === "first_chat")).toBeFalsy();
  });

  it("getUnlockedAchievements returns only unlocked", () => {
    const data = getGamification();
    data.xp = 150;
    data.achievements = ["first_chat", "xp_100"];
    const unlocked = getUnlockedAchievements(data);
    expect(unlocked).toHaveLength(2);
  });

  it("grantAchievement grants externally-checked achievements", () => {
    const data = getGamification();
    const result = grantAchievement(data, "night_owl");
    expect(result).toBeTruthy();
    expect(result!.id).toBe("night_owl");
    expect(data.achievements).toContain("night_owl");
  });

  it("grantAchievement returns null for already-granted", () => {
    const data = getGamification();
    data.achievements = ["night_owl"];
    const result = grantAchievement(data, "night_owl");
    expect(result).toBeNull();
  });
});

// --- Daily Challenges ---

describe("daily challenges", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates 3 challenges", () => {
    const challenges = getDailyChallenges();
    expect(challenges).toHaveLength(3);
  });

  it("all challenges start at 0 progress", () => {
    const challenges = getDailyChallenges();
    for (const c of challenges) {
      expect(c.progress).toBe(0);
      expect(c.completed).toBe(false);
    }
  });

  it("returns the same challenges on repeated calls (same day)", () => {
    const first = getDailyChallenges();
    const second = getDailyChallenges();
    expect(first.map((c) => c.id)).toEqual(second.map((c) => c.id));
  });

  it("challenges have unique IDs within a day", () => {
    const challenges = getDailyChallenges();
    const ids = challenges.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("updateChallengeProgress increments matching type", () => {
    const challenges = getDailyChallenges();
    const chatChallenge = challenges.find((c) => c.type === "chat");
    if (!chatChallenge) return; // skip if no chat challenge today

    updateChallengeProgress("chat");
    const updated = getDailyChallenges();
    const updatedChat = updated.find((c) => c.id === chatChallenge.id)!;
    expect(updatedChat.progress).toBe(1);
  });

  it("marks challenge as completed when target reached", () => {
    const challenges = getDailyChallenges();
    const chatChallenge = challenges.find((c) => c.type === "chat");
    if (!chatChallenge) return;

    for (let i = 0; i < chatChallenge.target; i++) {
      updateChallengeProgress("chat");
    }
    const updated = getDailyChallenges();
    const updatedChat = updated.find((c) => c.id === chatChallenge.id)!;
    expect(updatedChat.completed).toBe(true);
  });

  it("does not exceed target", () => {
    const challenges = getDailyChallenges();
    const chatChallenge = challenges.find((c) => c.type === "chat");
    if (!chatChallenge) return;

    for (let i = 0; i < chatChallenge.target + 5; i++) {
      updateChallengeProgress("chat");
    }
    const updated = getDailyChallenges();
    const updatedChat = updated.find((c) => c.id === chatChallenge.id)!;
    expect(updatedChat.progress).toBe(chatChallenge.target);
  });

  it("areChallengesComplete returns false initially", () => {
    getDailyChallenges(); // ensure generated
    expect(areChallengesComplete()).toBe(false);
  });
});
