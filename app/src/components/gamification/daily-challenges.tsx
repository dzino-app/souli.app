"use client";

import { useState } from "react";
import { getDailyChallenges, completeChallengeById, type DailyChallenge } from "@/lib/challenges";
import { addXp } from "@/lib/gamification";

/** Compact daily challenges preview for the homepage. */
export function DailyChallenges() {
  const [items, setItems] = useState<DailyChallenge[]>(() => getDailyChallenges());

  function handleComplete(id: string) {
    completeChallengeById(id);
    addXp(20, "challenge");
    setItems(getDailyChallenges());
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Denné výzvy
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((ch) => {
          const done = ch.completed;
          return (
            <button
              key={ch.id}
              onClick={() => !done && handleComplete(ch.id)}
              disabled={done}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                done
                  ? "bg-success/5 border-success/30 opacity-70"
                  : "bg-card hover:bg-secondary cursor-pointer"
              }`}
            >
              <span className="text-xl shrink-0">{ch.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? "line-through text-muted-foreground" : "font-medium"}`}>
                  {ch.text}
                </p>
              </div>
              {done ? (
                <span className="text-success text-sm">✓</span>
              ) : (
                <span className="text-xs text-muted-foreground">Splniť</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
