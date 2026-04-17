"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageCircle, Plus, Sticker, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { SpeechBubble } from "@/components/avatar/speech-bubble";
import { useAvatarState } from "@/components/avatar/use-avatar-state";
import { useRandomIdleBehavior } from "@/components/avatar/use-random-idle";
import { getMoodLabel, getMoodEmoji } from "@/lib/avatar-mood";
import { migrateMemoriesToSoul } from "@/lib/migrate-memories-to-soul";
import {
  getConversations,
  getConversationsGroupedByDate,
  deleteConversation,
  type Conversation,
} from "@/lib/conversations";
import { SearchBar } from "@/components/search/search-bar";
import type { SearchableItem } from "@/lib/client-search";
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
import { AdventureCard } from "@/components/adventure/adventure-card";
import { checkForAdventure, type Adventure } from "@/lib/adventures";

export default function Home() {
  const t = useTranslations("stickers");
  const router = useRouter();
  const { mounted, state, mood, name, appearance, playState } = useAvatarState();
  useRandomIdleBehavior(playState);
  const [groups, setGroups] = useState<Record<string, Conversation[]>>({});
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const levelUp = useLevelUp();
  const [adventure, setAdventure] = useState<Adventure | null>(null);

  // Build searchable items from conversations (title + all message content)
  const searchableItems: SearchableItem[] = useMemo(
    () =>
      allConversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        content: conv.messages.map((m) => m.content).join("\n"),
      })),
    [allConversations],
  );

  useEffect(() => {
    migrateMemoriesToSoul();
    setGroups(getConversationsGroupedByDate());
    setAllConversations(getConversations());
    setAdventure(checkForAdventure());

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
    setAllConversations(getConversations());
  }

  const dateKeys = Object.keys(groups);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Daily greeting — shows once per day */}
      <DailyGreeting />

      {/* Adventure card — shows when Souli explored while user was away */}
      {adventure && (
        <AdventureCard
          adventure={adventure}
          onDismiss={() => setAdventure(null)}
        />
      )}

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
        <Link href="/chat" className="relative cursor-pointer group" style={{ animation: "float 3s ease-in-out infinite" }}>
          <PixelAvatar state={state} appearance={appearance} size="lg" />
          <div className="absolute inset-0 rounded-2xl bg-primary/0 group-hover:bg-primary/10 transition-colors" />
        </Link>
        <div className="relative ml-6">
          <SpeechBubble />
        </div>
        <Link href="/chat" className="text-lg font-bold relative hover:text-primary transition-colors">
          {name}
        </Link>
        <p className="text-xs text-muted-foreground relative">
          {getMoodEmoji(mood)} {getMoodLabel(mood)}
        </p>
      </div>

      {/* Quick action pills */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Link
          href="/nalepky"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sticker className="h-3.5 w-3.5" />
          {t("pageTitle")}
        </Link>
        <Link
          href="/ar"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Camera className="h-3.5 w-3.5" />
          AR režim
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

      {/* Search conversations */}
      {allConversations.length > 0 && (
        <SearchBar
          items={searchableItems}
          onSelect={(id) => router.push(`/chat?id=${id}`)}
        />
      )}

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
