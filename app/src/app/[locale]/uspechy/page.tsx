"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getGamification,
  getXpForLevel,
  getXpForNextLevel,
  getProgressToNextLevel,
  type GamificationData,
} from "@/lib/gamification";
import { getAllAchievements, type Achievement } from "@/lib/achievements";

export default function AchievementsPage() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [allAch, setAllAch] = useState<Achievement[]>([]);

  useEffect(() => {
    setData(getGamification());
    setAllAch(getAllAchievements());
  }, []);

  if (!data) return null;

  const progress = getProgressToNextLevel(data.xp);
  const currentLevelXp = getXpForLevel(data.level);
  const nextLevelXp = getXpForNextLevel(data.level);
  const xpInLevel = data.xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const unlockedCount = data.achievements.length;
  const totalCount = allAch.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="rounded-full p-1 hover:bg-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="rounded-full bg-primary/10 p-2">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold">{"\u00da"}spechy</h1>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-primary">{data.level}</p>
            <p className="text-xs text-muted-foreground">{"\u00da"}rove{"\u0148"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold">{data.xp}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {data.streak > 0 ? data.streak : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Dn{"\u00ed"} v rade</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold">
              {unlockedCount}/{totalCount}
            </p>
            <p className="text-xs text-muted-foreground">{"\u00da"}spechy</p>
          </CardContent>
        </Card>
      </div>

      {/* XP progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{"\u00da"}r. {data.level}</span>
          <span>
            {xpInLevel}/{xpNeeded} XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Achievements grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          V{"\u0161"}etky {"\u00fa"}spechy
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {allAch.map((ach) => {
            const unlocked = data.achievements.includes(ach.id);
            return (
              <Card
                key={ach.id}
                className={unlocked ? "" : "opacity-50 grayscale"}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">
                      {unlocked ? ach.icon : "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {ach.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ach.description}
                      </p>
                    </div>
                    {unlocked && (
                      <span className="text-green-500 text-sm">{"\u2713"}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
