"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createEvent } from "@/lib/events";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"plan" | "diary">("plan");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;

    createEvent({
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || undefined,
      type,
      status: type === "diary" ? "done" : "upcoming",
      createdBy: "user",
    });

    router.push("/udalosti");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/udalosti")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Nová udalosť</h1>
      </div>

      <Card>
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Type toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                type="button"
                onClick={() => setType("plan")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === "plan" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Plán
              </button>
              <button
                type="button"
                onClick={() => setType("diary")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === "diary" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Denník
              </button>
            </div>

            <div>
              <label className="text-sm font-medium">Názov</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Napr.: Dentista"
                required
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Dátum</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Čas (voliteľný)</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Popis (voliteľný)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Podrobnosti..."
                rows={3}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <Button type="submit" size="lg" disabled={!title.trim() || !date}>
              <Calendar className="h-4 w-4 mr-2" />
              Vytvoriť
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
