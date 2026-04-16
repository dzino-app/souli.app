"use client";

import { useState } from "react";
import { Sparkles, X, Star, BookOpen, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addXp } from "@/lib/gamification";
import type { Adventure } from "@/lib/adventures";

interface AdventureCardProps {
  adventure: Adventure;
  onDismiss: () => void;
}

export function AdventureCard({ adventure, onDismiss }: AdventureCardProps) {
  const [dismissing, setDismissing] = useState(false);

  function handleDismiss() {
    // Grant XP reward if applicable
    if (adventure.reward.type === "xp") {
      addXp(adventure.reward.value as number, "adventure");
    }

    setDismissing(true);
    // Wait for exit animation
    setTimeout(() => {
      onDismiss();
    }, 300);
  }

  const rewardIcon =
    adventure.reward.type === "xp" ? (
      <Star className="h-4 w-4 text-yellow-500" />
    ) : adventure.reward.type === "fact" ? (
      <BookOpen className="h-4 w-4 text-blue-500" />
    ) : (
      <Award className="h-4 w-4 text-purple-500" />
    );

  const rewardLabel =
    adventure.reward.type === "xp"
      ? `+${adventure.reward.value} XP`
      : adventure.reward.type === "fact"
        ? `${adventure.reward.value}`
        : `Novy titul: ${adventure.reward.value}`;

  return (
    <>
      <div
        className={`transition-all duration-500 ${
          dismissing
            ? "opacity-0 translate-y-4 scale-95"
            : "opacity-100 translate-y-0 scale-100"
        }`}
        style={{
          animation: dismissing ? undefined : "adventureSlideIn 0.6s ease-out",
        }}
      >
        <Card className="relative overflow-hidden border-2 border-amber-400/40 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-yellow-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30">
          {/* Sparkle decorations */}
          <div className="absolute top-2 right-8 text-amber-400/60 animate-pulse">
            <Sparkles className="h-4 w-4" />
          </div>
          <div
            className="absolute bottom-3 left-4 text-amber-300/40 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          >
            <Sparkles className="h-3 w-3" />
          </div>

          <CardContent className="py-4 px-4">
            <div className="flex items-start gap-3">
              {/* Adventure icon */}
              <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                  Dobrodruzstvo pocas tvojej neprítomnosti
                </p>

                {/* Story */}
                <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                  {adventure.story}
                </p>

                {/* Reward badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-amber-200/60 dark:border-amber-700/30 text-xs font-medium">
                  {rewardIcon}
                  <span>{rewardLabel}</span>
                </div>
              </div>

              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -mt-0.5 text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
                aria-label="Zavriet dobrodruzstvo"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes adventureSlideIn {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `,
        }}
      />
    </>
  );
}
