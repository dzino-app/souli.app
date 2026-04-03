"use client";

import { getGamification } from "@/lib/gamification";

export function StreakDisplay() {
  const { streak } = getGamification();

  if (streak <= 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${
        streak >= 7
          ? "bg-fire/10 text-fire"
          : "bg-muted text-muted-foreground"
      }`}
      style={streak >= 7 ? { animation: "xp-pop 0.5s ease-out, twinkle 2s ease-in-out infinite" } : undefined}
    >
      <span>🔥</span>
      <span>{streak}</span>
      <span className="text-xs font-normal">dní v rade</span>
    </div>
  );
}
