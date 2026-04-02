"use client";

import { getGamification } from "@/lib/gamification";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  streak?: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  const data = getGamification();
  const current = streak ?? data.streak;

  if (current <= 0) return null;

  const glowing = current >= 7;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        glowing
          ? "bg-orange-500/15 text-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]"
          : "bg-orange-500/10 text-orange-500"
      )}
    >
      <span className="text-base leading-none">{"\ud83d\udd25"}</span>
      <span className="font-bold">{current}</span>
      <span className="text-xs opacity-80">dn{"\u00ed"} v rade</span>
    </div>
  );
}
