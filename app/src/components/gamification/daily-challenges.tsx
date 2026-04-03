"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDailyChallenges, type DailyChallenge } from "@/lib/challenges";
import { ShareCompletion } from "./share-completion";

export function DailyChallenges() {
  const router = useRouter();
  const [items] = useState<DailyChallenge[]>(() => getDailyChallenges());

  function handleTapChallenge(ch: DailyChallenge) {
    if (ch.completed) return;
    router.push(`/chat?challenge=${encodeURIComponent(ch.id)}&text=${encodeURIComponent(ch.text)}`);
  }

  // Re-read challenges on mount (in case they were completed from chat)
  // We use a simple approach: state is initialized from localStorage

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Denné výzvy
      </h3>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
        {items.map((ch) => {
          const done = ch.completed;

          return (
            <div
              key={ch.id}
              className={`flex-shrink-0 snap-start flex flex-col gap-2 rounded-lg border-2 p-3 transition-colors min-w-[200px] max-w-[240px] ${
                done
                  ? "bg-success/5 border-accent"
                  : "bg-card border-border hover:border-primary/40 cursor-pointer"
              }`}
              onClick={() => handleTapChallenge(ch)}
              role={done ? undefined : "button"}
              tabIndex={done ? undefined : 0}
              onKeyDown={(e) => { if (!done && (e.key === "Enter" || e.key === " ")) handleTapChallenge(ch); }}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl shrink-0">{ch.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${done ? "line-through text-muted-foreground" : "font-medium"}`}>
                    {ch.text}
                  </p>
                  {done && ch.proof && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {ch.proof}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 shrink-0">
                {done ? (
                  <>
                    <ShareCompletion challengeText={ch.text} />
                    <span className="text-accent text-lg font-bold">✓</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Splniť</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
