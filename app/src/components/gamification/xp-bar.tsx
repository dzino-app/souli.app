"use client";

import {
  getGamification,
  getXpForLevel,
  getXpForNextLevel,
  getProgressToNextLevel,
} from "@/lib/gamification";
import { getAvatarResolution } from "@/lib/avatar-resolution";

interface XpBarProps {
  xp?: number;
  level?: number;
  streak?: number;
}

export function XpBar({ xp, level, streak }: XpBarProps) {
  const data = getGamification();
  const currentXp = xp ?? data.xp;
  const currentLevel = level ?? data.level;
  const currentStreak = streak ?? data.streak;

  const progress = getProgressToNextLevel(currentXp);
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForNextLevel(currentLevel);
  const xpInLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  const resolution = getAvatarResolution(currentLevel);

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-primary">
            Úr. {currentLevel}
          </span>
          <span className="text-muted-foreground font-mono text-[10px] bg-muted px-1 py-0.5 rounded">
            {resolution.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {currentStreak > 0 && (
            <span className="flex items-center gap-0.5 text-orange-500">
              <span className="text-sm leading-none">🔥</span>
              <span className="font-medium">{currentStreak}</span>
            </span>
          )}
          <span className="text-muted-foreground">
            {xpInLevel}/{xpNeeded} XP
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
