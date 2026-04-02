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
      <div className="flex flex-col gap-2">
        {items.map((ch) => {
          const done = ch.completed;

          return (
            <div key={ch.id} className="flex flex-col">
              <div
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  done
                    ? "bg-success/5 border-success/30"
                    : "bg-card hover:bg-secondary cursor-pointer"
                }`}
                onClick={() => handleTapChallenge(ch)}
                role={done ? undefined : "button"}
                tabIndex={done ? undefined : 0}
                onKeyDown={(e) => { if (!done && (e.key === "Enter" || e.key === " ")) handleTapChallenge(ch); }}
              >
                <span className="text-xl shrink-0">{ch.emoji}</span>
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
                <div className="flex items-center gap-2 shrink-0">
                  {done ? (
                    <>
                      <ShareCompletion challengeText={ch.text} />
                      <span className="text-success text-sm">✓</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Splniť</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
