"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { getDailyChallenges, type DailyChallenge } from "@/lib/challenges";
import { ShareCompletion } from "./share-completion";
import { Button } from "@/components/ui/button";

export function DailyChallenges() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<DailyChallenge[] | null>(null);

  function handleExpand() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    // Generate challenges on click (lazy) so they reflect latest mood/context
    setItems(getDailyChallenges());
    setExpanded(true);
  }

  function handleTapChallenge(ch: DailyChallenge) {
    if (ch.completed) return;
    router.push(`/chat?challenge=${encodeURIComponent(ch.id)}&text=${encodeURIComponent(ch.text)}`);
  }

  const completedCount = items?.filter((c) => c.completed).length ?? 0;
  const totalCount = items?.length ?? 3;

  return (
    <div className="flex flex-col gap-2">
      {/* Button to expand/collapse */}
      <Button
        variant="outline"
        className="w-full justify-between h-12 px-4"
        onClick={handleExpand}
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-medium">Denné výzvy</span>
          {items && completedCount > 0 && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Challenge list — only when expanded */}
      {expanded && items && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {items.map((ch) => {
            const done = ch.completed;
            return (
              <div
                key={ch.id}
                className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                  done
                    ? "bg-success/5 border-accent"
                    : "bg-card border-border hover:border-primary/40 cursor-pointer"
                }`}
                onClick={() => handleTapChallenge(ch)}
                role={done ? undefined : "button"}
                tabIndex={done ? undefined : 0}
                onKeyDown={(e) => {
                  if (!done && (e.key === "Enter" || e.key === " ")) handleTapChallenge(ch);
                }}
              >
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
                <div className="flex items-center gap-2 shrink-0">
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
      )}
    </div>
  );
}
