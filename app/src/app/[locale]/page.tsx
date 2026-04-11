"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MessageCircle, Plus, Sticker, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { SpeechBubble } from "@/components/avatar/speech-bubble";
import { useAvatarState } from "@/components/avatar/use-avatar-state";
import { useRandomIdleBehavior } from "@/components/avatar/use-random-idle";
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
import { AvatarSwitcher } from "@/components/avatar/avatar-switcher";
import { needsMigration } from "@/lib/avatars";
import { buildMigrationPayload } from "@/lib/migrate-to-multi-avatar";
import { setActiveAvatarId } from "@/lib/avatars";
import { DailyLesson } from "@/components/learn/daily-lesson";
import { WeeklyReportShare } from "@/components/report/weekly-report-share";

export default function Home() {
  const t = useTranslations("stickers");
  const { mounted, state, mood, name, appearance, playState } = useAvatarState();
  useRandomIdleBehavior(playState);
  const [groups, setGroups] = useState<Record<string, Conversation[]>>({});
  const levelUp = useLevelUp();

  useEffect(() => {
    migrateMemoriesToSoul();
    setGroups(getConversationsGroupedByDate());

    // One-time migration to multi-avatar system
    if (needsMigration()) {
      const payload = buildMigrationPayload();
      if (payload) {
        fetch("/api/avatars/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.avatarId) {
              setActiveAvatarId(data.avatarId);
            }
          })
          .catch(() => {});
      }
    }
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

      {/* Avatar switcher */}
      <div className="flex justify-center">
        <AvatarSwitcher onSwitch={() => window.location.reload()} />
      </div>

      {/* Avatar — compact, centered, with warm gradient behind */}
      <div className="relative flex flex-col items-center gap-2 py-4">
        {/* Warm gradient glow behind avatar in dark mode */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl" />
        </div>
        <div className="relative" style={{ animation: "float 3s ease-in-out infinite" }}>
          <PixelAvatar state={state} appearance={appearance} size="lg" />
        </div>
        <div className="relative ml-6">
          <SpeechBubble />
        </div>
        <h1 className="text-lg font-bold relative">{name}</h1>
        <p className="text-xs text-muted-foreground relative">
          {getMoodEmoji(mood)} {getMoodLabel(mood)}
        </p>
      </div>

      {/* Sticker pack link */}
      <div className="flex justify-center">
        <Link
          href="/nalepky"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sticker className="h-3.5 w-3.5" />
          {t("pageTitle")}
        </Link>
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

      {/* Weekly shareable report */}
      <WeeklyReportShare />

      {/* Daily challenges */}
      <DailyChallenges />

      {/* Daily micro-lesson */}
      <DailyLesson />

      {/* New chat button */}
      <Link href="/chat">
        <Button size="lg" className="w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />
          Nová konverzácia
        </Button>
      </Link>

      {/* Chat sessions */}
      {dateKeys.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Predchádzajúce konverzácie
          </h2>
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <p className="text-xs text-muted-foreground mb-2">{dateKey}</p>
              <div className="flex flex-col gap-2">
                {groups[dateKey].map((conv) => (
                  <Card key={conv.id} className="hover:bg-secondary transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <Link href={`/chat?id=${conv.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {conv.messages.length} {conv.messages.length === 1 ? "správa" : "správ"}
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
          Začnite konverzáciu — Dzino sa teší!
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
