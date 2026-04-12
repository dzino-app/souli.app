"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDailyNotes, type DailyNote } from "@/lib/daily-notes";

const MOOD_EMOJI: Record<number, string> = {
  1: "\u{1F614}", // pensive
  2: "\u{1F615}", // confused
  3: "\u{1F610}", // neutral
  4: "\u{1F642}", // slightly smiling
  5: "\u{1F60A}", // blissful
};

const MOOD_LABEL: Record<number, string> = {
  1: "Veľmi zle",
  2: "Slabšie",
  3: "Neutrálne",
  4: "Dobre",
  5: "Výborne",
};

const DAY_NAMES = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

const MONTH_NAMES = [
  "Január",
  "Február",
  "Marec",
  "Apríl",
  "Máj",
  "Jún",
  "Júl",
  "August",
  "September",
  "Október",
  "November",
  "December",
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthDays(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6 (ISO week)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: (number | null)[] = [];

  // Leading blanks
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }

  // Actual days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }

  return days;
}

export default function DennikPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "sk";

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [notesMap, setNotesMap] = useState<Record<string, DailyNote>>({});

  // Load notes for the visible month
  useEffect(() => {
    const startDate = toDateStr(new Date(viewYear, viewMonth, 1));
    const endDate = toDateStr(new Date(viewYear, viewMonth + 1, 0));
    const notes = getDailyNotes(startDate, endDate);
    const map: Record<string, DailyNote> = {};
    for (const n of notes) {
      map[n.date] = n;
    }
    setNotesMap(map);
  }, [viewYear, viewMonth]);

  const monthDays = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedNote = notesMap[selectedDate] ?? null;
  const todayStr = toDateStr(today);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    const dateStr = toDateStr(new Date(viewYear, viewMonth, day));
    setSelectedDate(dateStr);
  }

  function hasData(day: number): boolean {
    const dateStr = toDateStr(new Date(viewYear, viewMonth, day));
    const note = notesMap[dateStr];
    if (!note) return false;
    return note.conversations.length > 0 || note.mood !== null;
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Dennik</h1>
          <p className="text-sm text-muted-foreground">
            Tvoj denný prehľad
          </p>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="py-4 px-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, i) => {
              if (day === null) {
                return <div key={`blank-${i}`} />;
              }

              const dateStr = toDateStr(new Date(viewYear, viewMonth, day));
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasDayData = hasData(day);

              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`relative flex items-center justify-center h-9 w-full rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                  }`}
                >
                  {day}
                  {hasDayData && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day note */}
      <Card>
        <CardContent className="py-4 px-4">
          {/* Date heading */}
          <h2 className="text-sm font-semibold mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("sk-SK", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h2>

          {/* Mood */}
          {selectedNote?.mood !== null && selectedNote?.mood !== undefined && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{MOOD_EMOJI[selectedNote.mood]}</span>
              <div>
                <p className="text-sm font-medium">
                  {MOOD_LABEL[selectedNote.mood]}
                </p>
                {selectedNote.moodNote && (
                  <p className="text-xs text-muted-foreground">
                    {selectedNote.moodNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Conversations */}
          {selectedNote && selectedNote.conversations.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Konverzácie
              </p>
              {selectedNote.conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/${locale}/chat?id=${conv.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.messageCount}{" "}
                      {conv.messageCount === 1
                        ? "správa"
                        : conv.messageCount < 5
                          ? "správy"
                          : "správ"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            !selectedNote?.mood && (
              <div className="py-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tento deň bol tichý
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
