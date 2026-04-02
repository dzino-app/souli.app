"use client";

import { getDailyChallenges, type DailyChallenge } from "@/lib/challenges";

interface DailyChallengesProps {
  challenges?: DailyChallenge[];
}

/** Compact daily challenges preview for the homepage. */
export function DailyChallenges({ challenges }: DailyChallengesProps) {
  const items = challenges ?? getDailyChallenges();

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Denn{"\u00e9"} v{"\u00fd"}zvy
      </h3>
      <div className="flex flex-col gap-1.5">
        {items.map((ch) => {
          const pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));
          const done = ch.completed;
          return (
            <div key={ch.id} className="flex items-center gap-3">
              {/* Progress circle */}
              <div className="relative h-8 w-8 shrink-0">
                <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-secondary"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className={done ? "stroke-green-500" : "stroke-primary"}
                    strokeWidth="3"
                    strokeDasharray={`${pct * 0.942} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                {done && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs">
                    {"\u2713"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {ch.text}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {ch.progress}/{ch.target}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
