"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import {
  generateWeeklyReport,
  type WeeklyReportData,
} from "@/lib/weekly-report";
import { generateReportImage } from "@/lib/report-share";
import { Share2, Download, Sparkles } from "lucide-react";

function moodEmoji(avg: number): string {
  if (avg >= 4.5) return "\u{1F929}";
  if (avg >= 3.5) return "\u{1F60A}";
  if (avg >= 2.5) return "\u{1F610}";
  if (avg >= 1.5) return "\u{1F614}";
  return "\u{1F622}";
}

function trendArrow(trend: "up" | "down" | "stable"): string {
  if (trend === "up") return "\u2191";
  if (trend === "down") return "\u2193";
  return "\u2192";
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface StatBoxProps {
  emoji: string;
  value: string;
  label: string;
}

function StatBox({ emoji, value, label }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10">
      <span className="text-lg">{emoji}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[11px] text-muted-foreground leading-tight text-center">
        {label}
      </span>
    </div>
  );
}

export function WeeklyReportShare() {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const data = generateWeeklyReport();
    if (data.hasActivity) {
      setReport(data);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!report) return;
    setSharing(true);

    try {
      const blob = generateReportImage(report);
      const file = new File([blob], "souli-weekly-report.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${report.avatarName}'s Weekly Report`,
          text: "Check out my Souli's weekly report! Raise your own at dzino.app",
          files: [file],
        });
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } else {
        // Fallback: download
        downloadImage(blob);
      }
    } catch (err) {
      // User cancelled share or error
      if ((err as Error)?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    } finally {
      setSharing(false);
    }
  }, [report]);

  const handleDownload = useCallback(() => {
    if (!report) return;
    setSharing(true);
    try {
      const blob = generateReportImage(report);
      downloadImage(blob);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setSharing(false);
    }
  }, [report]);

  if (!report) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      <CardContent className="py-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Weekly Souli Report</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDateShort(report.dateRange.start)} -{" "}
            {formatDateShort(report.dateRange.end)}
          </span>
        </div>

        {/* Avatar + name row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <PixelAvatar
              state="happy"
              appearance={report.avatarAppearance}
              level={report.level}
              size="sm"
            />
          </div>
          <div>
            <p className="font-bold text-sm">{report.avatarName}</p>
            <p className="text-xs text-muted-foreground">
              Level {report.level}
            </p>
          </div>
        </div>

        {/* Stats grid — 3x2 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBox
            emoji={"\u{1F4AC}"}
            value={String(report.totalMessages)}
            label="Messages"
          />
          <StatBox
            emoji={"\u{1F4D6}"}
            value={String(report.soulChanges)}
            label="Learned"
          />
          <StatBox
            emoji={moodEmoji(report.moodAverage)}
            value={
              report.moodAverage > 0
                ? `${report.moodAverage.toFixed(1)} ${trendArrow(report.moodTrend)}`
                : "--"
            }
            label="Mood"
          />
          <StatBox
            emoji={"\u{1F525}"}
            value={String(report.streakDays)}
            label="Streak"
          />
          <StatBox
            emoji={"\u{2B50}"}
            value={String(report.level)}
            label="Level"
          />
          <StatBox
            emoji={"\u{26A1}"}
            value={`+${report.xpGained}`}
            label="XP"
          />
        </div>

        {/* Top topics */}
        {report.topTopics.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Top updates:{" "}
            <span className="text-foreground font-medium">
              {report.topTopics.join(", ")}
            </span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={handleShare}
            disabled={sharing}
          >
            <Share2 className="h-3.5 w-3.5" />
            {shared ? "Shared!" : sharing ? "..." : "Share Report"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={sharing}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function downloadImage(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "souli-weekly-report.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
