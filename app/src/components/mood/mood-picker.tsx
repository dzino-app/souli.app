"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logMood, getTodayMood } from "@/lib/mood-tracking";

const MOODS = [
  { value: 1 as const, emoji: "\u{1F622}", label: "Zle" },
  { value: 2 as const, emoji: "\u{1F615}", label: "Nie najlep\u0161ie" },
  { value: 3 as const, emoji: "\u{1F610}", label: "Ujde to" },
  { value: 4 as const, emoji: "\u{1F642}", label: "Dobre" },
  { value: 5 as const, emoji: "\u{1F60A}", label: "Super!" },
];

const ENCOURAGEMENTS: string[] = [
  "\u{0110}akujem, \u{017E}e si sa podelil!",
  "Zap\u00EDsal som si to!",
  "D\u00EDky za zdielanie!",
  "Fajn, \u{017E}e mi to hovor\u00ED\u0161!",
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
            <span>
              Dnes sa c{"\u00ED"}ti{"\u0161"}: {moodItem?.label}
            </span>
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
          Ako sa dnes c{"\u00ED"}ti{"\u0161"}?
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
              placeholder="Chce\u0161 prida\u0165 pozn\u00E1mku? (volite\u013En\u00E9)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="sm" onClick={handleSave} className="self-end">
              Ulo{"\u017E"}i{"\u0165"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
