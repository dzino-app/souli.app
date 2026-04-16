"use client";

import { useEffect, useState } from "react";
import { Heart, TrendingUp, TrendingDown, Minus, MessageCircle, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getWeeklyMoodData,
  getMonthlyMoodData,
  getMoodTrend,
  getWellnessScore,
  getWeeklyConversationCount,
  type MoodDataPoint,
} from "@/lib/wellness";
import { getGamification, type GamificationData } from "@/lib/gamification";
import { getAverageMood } from "@/lib/mood-tracking";

type Period = "7d" | "30d";

const MOOD_COLORS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-red-400",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-lime-400",
  5: "bg-green-400",
};

const MOOD_LABELS: Record<number, string> = {
  0: "Bez dát",
  1: "Veľmi zle",
  2: "Slabšie",
  3: "Neutrálne",
  4: "Dobre",
  5: "Výborne",
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

function scoreStroke(score: number): string {
  if (score >= 70) return "stroke-green-500";
  if (score >= 40) return "stroke-yellow-500";
  return "stroke-red-500";
}

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case "improving":
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    case "declining":
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    case "stable":
      return <Minus className="h-5 w-5 text-yellow-500" />;
    default:
      return <Minus className="h-5 w-5 text-muted-foreground" />;
  }
}

function trendLabel(trend: string): string {
  switch (trend) {
    case "improving":
      return "Zlepšuje sa";
    case "declining":
      return "Zhoršuje sa";
    case "stable":
      return "Stabilná";
    default:
      return "Málo dát";
  }
}

function WellnessRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        {/* Progress ring */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${scoreStroke(score)} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">skóre</span>
      </div>
    </div>
  );
}

function MoodChart({ data, period }: { data: MoodDataPoint[]; period: Period }) {
  // For 30d, show every 5th label or first of each week
  const showLabel = (i: number) => {
    if (period === "7d") return true;
    // Show label every 5 days for 30d view
    return i % 5 === 0 || i === data.length - 1;
  };

  return (
    <div className="flex items-end gap-[2px] h-32">
      {data.map((point, i) => {
        const heightPercent = point.mood > 0 ? (point.mood / 5) * 100 : 8;
        return (
          <div
            key={point.date}
            className="flex flex-col items-center flex-1 min-w-0 gap-1"
          >
            {/* Mood label on hover via title */}
            <div
              className="w-full flex items-end justify-center"
              style={{ height: "100px" }}
            >
              <div
                className={`w-full max-w-[32px] rounded-t-sm transition-all duration-300 ${MOOD_COLORS[point.mood]} ${point.mood === 0 ? "opacity-30" : ""}`}
                style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                title={`${point.date}: ${MOOD_LABELS[point.mood]}`}
              />
            </div>
            {/* Day label */}
            {showLabel(i) && (
              <span className="text-[9px] text-muted-foreground leading-none truncate w-full text-center">
                {period === "7d" ? point.dayLabel : `${point.date.slice(8)}.`}
              </span>
            )}
            {!showLabel(i) && (
              <span className="text-[9px] leading-none invisible">.</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WellnessPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([]);
  const [trend, setTrend] = useState<string>("unknown");
  const [score, setScore] = useState(0);
  const [avgMood, setAvgMood] = useState(0);
  const [gamData, setGamData] = useState<GamificationData | null>(null);
  const [convCount, setConvCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMoodData(period === "7d" ? getWeeklyMoodData() : getMonthlyMoodData());
    setTrend(getMoodTrend());
    setScore(getWellnessScore());
    setAvgMood(getAverageMood(period === "7d" ? 7 : 30));
    setGamData(getGamification());
    setConvCount(getWeeklyConversationCount());
    setReady(true);
  }, [period]);

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Zdravie</h1>
          <p className="text-sm text-muted-foreground">
            Tvoj wellness prehľad
          </p>
        </div>
      </div>

      {/* Wellness score */}
      <Card>
        <CardContent className="py-6 px-4 flex flex-col items-center gap-3">
          <WellnessRing score={score} />
          <p className="text-sm text-muted-foreground text-center">
            Nálada (40%) + Séria dní (30%) + Aktivita (30%)
          </p>
        </CardContent>
      </Card>

      {/* Period toggle + trend */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setPeriod("7d")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              period === "7d"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            7 dní
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              period === "30d"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            30 dní
          </button>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon trend={trend} />
          <span className="text-sm font-medium">{trendLabel(trend)}</span>
        </div>
      </div>

      {/* Mood chart */}
      <Card>
        <CardContent className="py-4 px-4">
          <h2 className="text-sm font-semibold mb-4">
            {period === "7d" ? "Nálada za posledných 7 dní" : "Nálada za posledných 30 dní"}
          </h2>
          <MoodChart data={moodData} period={period} />
          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {[1, 2, 3, 4, 5].map((m) => (
              <div key={m} className="flex items-center gap-1">
                <div className={`h-2.5 w-2.5 rounded-sm ${MOOD_COLORS[m]}`} />
                <span className="text-[10px] text-muted-foreground">{MOOD_LABELS[m]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 px-3 text-center">
            <p className="text-2xl font-bold text-primary">
              {avgMood > 0 ? avgMood.toFixed(1) : "-"}
            </p>
            <p className="text-[10px] text-muted-foreground">Priemer nálady</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <p className="text-2xl font-bold text-orange-500">
                {gamData?.streak ?? 0}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Dní v rade</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{convCount}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Konverzácie</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
