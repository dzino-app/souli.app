"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Check, Clock, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getUpcomingEvents,
  getDiaryEvents,
  refreshEventStatuses,
  markEventDone,
  deleteEvent,
  type DzinoEvent,
} from "@/lib/events";

export default function EventsPage() {
  const [tab, setTab] = useState<"upcoming" | "diary">("upcoming");
  const [upcoming, setUpcoming] = useState<DzinoEvent[]>([]);
  const [diary, setDiary] = useState<DzinoEvent[]>([]);

  useEffect(() => {
    refreshEventStatuses();
    setUpcoming(getUpcomingEvents());
    setDiary(getDiaryEvents());
  }, []);

  function handleDone(id: string) {
    markEventDone(id);
    setUpcoming(getUpcomingEvents());
    setDiary(getDiaryEvents());
  }

  function handleDelete(id: string) {
    deleteEvent(id);
    setUpcoming(getUpcomingEvents());
    setDiary(getDiaryEvents());
  }

  const events = tab === "upcoming" ? upcoming : diary;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Udalosti</h1>
        </div>
        <Link href="/udalosti/nova">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nová
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "upcoming" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Plánované ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("diary")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "diary" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Prebehlo ({diary.length})
        </button>
      </div>

      {/* Events list */}
      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {tab === "upcoming" ? "Žiadne plánované udalosti." : "Žiadne záznamy."}
            </p>
          </CardContent>
        </Card>
      )}

      {events.map((event) => (
        <Card key={event.id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {event.status === "done" && <Check className="h-4 w-4 text-success" />}
                  {event.status === "upcoming" && <Clock className="h-4 w-4 text-primary" />}
                  {event.status === "missed" && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("sk-SK", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                    {event.time && ` · ${event.time}`}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {event.createdBy === "dzino" && (
                    <span className="text-[10px] text-primary">Navrhol Dzino</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {event.status === "upcoming" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDone(event.id)}
                  >
                    <Check className="h-3.5 w-3.5 text-success" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
