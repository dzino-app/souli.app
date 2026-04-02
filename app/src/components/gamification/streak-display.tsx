"use client";

import { getGamification } from "@/lib/gamification";

export function StreakDisplay() {
  const { streak } = getGamification();

  if (streak <= 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-sm font-medium ${
        streak >= 7 ? "text-orange-500" : "text-muted-foreground"
      }`}
      style={streak >= 7 ? { textShadow: "0 0 8px rgba(249,115,22,0.4)" } : undefined}
    >
      <span>🔥</span>
      <span>{streak}</span>
      <span className="text-xs font-normal">dní v rade</span>
    </div>
  );
}
