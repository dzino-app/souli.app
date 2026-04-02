"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { useAvatarState } from "@/components/avatar/use-avatar-state";
import { getMoodLabel, getMoodEmoji } from "@/lib/avatar-mood";
import { migrateMemoriesToSoul } from "@/lib/migrate-memories-to-soul";
import {
  getConversationsGroupedByDate,
  deleteConversation,
  type Conversation,
} from "@/lib/conversations";
import { XpBar } from "@/components/gamification/xp-bar";
import { StreakDisplay } from "@/components/gamification/streak-display";
import { DailyChallenges } from "@/components/gamification/daily-challenges";
import { LevelUpCelebration } from "@/components/gamification/level-up-celebration";
import { useLevelUp } from "@/components/gamification/use-level-up";
import { WeeklyReviewCard } from "@/components/review/weekly-review-card";
import { DailyGreeting } from "@/components/greeting/daily-greeting";
import { MoodPicker } from "@/components/mood/mood-picker";
import { TellMeSomething } from "@/components/quick-action/tell-me-something";

export default function Home() {
  const { mounted, state, mood, name, appearance } = useAvatarState();
  const [groups, setGroups] = useState<Record<string, Conversation[]>>({});
  const levelUp = useLevelUp();

  useEffect(() => {
    migrateMemoriesToSoul();
    setGroups(getConversationsGroupedByDate());
  }, []);

  function handleDelete(id: string) {
    deleteConversation(id);
    setGroups(getConversationsGroupedByDate());
  }

  const dateKeys = Object.keys(groups);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Daily greeting — shows once per day */}
      <DailyGreeting />

      {/* Avatar — compact, centered */}
      <div className="flex flex-col items-center gap-2 py-4">
        <PixelAvatar state={state} appearance={appearance} size="lg" />
        <h1 className="text-lg font-bold">{name}</h1>
        <p className="text-xs text-muted-foreground">
          {getMoodEmoji(mood)} {getMoodLabel(mood)}
        </p>
      </div>

      {/* Mood picker */}
      <MoodPicker />

      {/* Tell me something */}
      <TellMeSomething />

      {/* Gamification section */}
      <div className="flex flex-col items-center gap-3 px-2">
        <XpBar />
        <StreakDisplay />
      </div>

      {/* Weekly review */}
      <WeeklyReviewCard />

      {/* Daily challenges */}
      <DailyChallenges />

      {/* New chat button */}
      <Link href="/chat">
        <Button size="lg" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Nov{"\u00e1"} konverz{"\u00e1"}cia
        </Button>
      </Link>

      {/* Chat sessions */}
      {dateKeys.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Predch{"\u00e1"}dzaj{"\u00fa"}ce konverz{"\u00e1"}cie
          </h2>
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <p className="text-xs text-muted-foreground mb-2">{dateKey}</p>
              <div className="flex flex-col gap-2">
                {groups[dateKey].map((conv) => (
                  <Card key={conv.id} className="hover:bg-secondary transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <Link href="/chat" className="flex items-center gap-3 flex-1 min-w-0">
                          <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {conv.messages.length} {conv.messages.length === 1 ? "spr\u00e1va" : "spr\u00e1v"}
                            </p>
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleDelete(conv.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {dateKeys.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Za{"\u010d"}nite konverz{"\u00e1"}ciu {"\u2014"} Dzino sa te{"\u0161"}{"\u00ed"}!
        </p>
      )}

      {/* Level-up celebration overlay */}
      {levelUp.justLeveledUp && (
        <LevelUpCelebration
          previousLevel={levelUp.previousLevel}
          newLevel={levelUp.newLevel}
          onDismiss={levelUp.dismiss}
        />
      )}
    </div>
  );
}
