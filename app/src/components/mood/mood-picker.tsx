"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logMood, getTodayMood } from "@/lib/mood-tracking";

const MOODS = [
  { value: 1 as const, emoji: "😢", label: "Zle" },
  { value: 2 as const, emoji: "😕", label: "Nie najlepšie" },
  { value: 3 as const, emoji: "😐", label: "Ujde to" },
  { value: 4 as const, emoji: "🙂", label: "Dobre" },
  { value: 5 as const, emoji: "😊", label: "Super!" },
];

const ENCOURAGEMENTS = [
  "Ďakujem, že si sa podelil!",
  "Zapísal som si to!",
  "Díky za zdieľanie!",
  "Fajn, že mi to hovoríš!",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function MoodPicker() {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [saved, setSaved] = useState(false);
  const [encouragement, setEncouragement] = useState("");
  const [alreadyLogged, setAlreadyLogged] = useState(false);

  useEffect(() => {
    const today = getTodayMood();
    if (today) {
      setAlreadyLogged(true);
      setSelected(today.mood);
    }
  }, []);

  function handleSelect(mood: 1 | 2 | 3 | 4 | 5) {
    setSelected(mood);
    setShowNote(true);
  }

  function handleSave() {
    if (selected === null) return;
    logMood(selected, note || undefined);
    setSaved(true);
    setAlreadyLogged(true);
    setEncouragement(pickRandom(ENCOURAGEMENTS));
  }

  if (alreadyLogged && !showNote) {
    const moodItem = MOODS.find((m) => m.value === selected);
    return (
      <Card className="border-muted">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{moodItem?.emoji}</span>
            <span>Dnes sa cítiš: {moodItem?.label}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (saved) {
    return (
      <Card className="border-muted">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-center text-muted-foreground">
            {encouragement}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardContent className="py-3 px-4">
        <p className="text-sm text-muted-foreground mb-2">
          Ako sa dnes cítiš?
        </p>
        <div className="flex justify-center gap-2 mb-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => handleSelect(m.value)}
              className={`text-2xl p-1.5 rounded-lg transition-all hover:scale-110 ${
                selected === m.value
                  ? "bg-primary/10 ring-2 ring-primary scale-110"
                  : "hover:bg-muted"
              }`}
              title={m.label}
              type="button"
            >
              {m.emoji}
            </button>
          ))}
        </div>

        {showNote && !saved && (
          <div className="flex flex-col gap-2 mt-2">
            <input
              type="text"
              placeholder="Chceš pridať poznámku? (voliteľné)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="sm" onClick={handleSave} className="self-end">
              Uložiť
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
