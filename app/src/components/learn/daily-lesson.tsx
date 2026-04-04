"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonCard } from "./lesson-card";
import { getUserLanguage } from "@/lib/languages";

const CACHE_KEY = "dzino_daily_lesson";
const COMPLETED_KEY = "dzino_lessons_done";

interface CachedLesson {
  format: string;
  content: Record<string, unknown>;
  date: string;
}

function getCached(): CachedLesson | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw) as CachedLesson;
  if (data.date !== new Date().toISOString().slice(0, 10)) return null;
  return data;
}

function setCompleted() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(COMPLETED_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  if (!list.includes(today)) {
    list.push(today);
    if (list.length > 90) list.splice(0, list.length - 90);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(list));
  }
}

function isCompletedToday(): boolean {
  if (typeof window === "undefined") return false;
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(COMPLETED_KEY);
  const list: string[] = raw ? JSON.parse(raw) : [];
  return list.includes(today);
}

export function DailyLesson() {
  const [lesson, setLesson] = useState<CachedLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [completed, setCompletedState] = useState(false);

  async function fetchLesson(topic?: string) {
    setLoading(true);
    setError(false);
    try {
      const lang = getUserLanguage() || "sk";
      const res = await fetch("/api/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, topic }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const cached: CachedLesson = {
        format: data.format,
        content: data.content,
        date: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      setLesson(cached);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCompletedState(isCompletedToday());
    const cached = getCached();
    if (cached) {
      setLesson(cached);
      return;
    }
    fetchLesson();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Pripravujem lekciu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-4">
        <Button variant="ghost" size="sm" onClick={() => fetchLesson()} className="text-xs gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Skúsiť znova
        </Button>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="space-y-2">
      <LessonCard
        format={lesson.format}
        content={lesson.content}
        completed={completed}
        onComplete={() => { setCompleted(); setCompletedState(true); }}
      />
      {completed && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs gap-1"
          onClick={() => {
            localStorage.removeItem(CACHE_KEY);
            setCompletedState(false);
            fetchLesson();
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Ďalšia lekcia
        </Button>
      )}
    </div>
  );
}
