"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logMood, getTodayMood } from "@/lib/mood-tracking";

const MOODS = [
  { value: 1 as const, emoji: "😢", label: "Zle", ring: "ring-blue-400" },
  { value: 2 as const, emoji: "😕", label: "Nie najlepšie", ring: "ring-orange-400" },
  { value: 3 as const, emoji: "😐", label: "Ujde to", ring: "ring-muted-foreground" },
  { value: 4 as const, emoji: "🙂", label: "Dobre", ring: "ring-energy" },
  { value: 5 as const, emoji: "😊", label: "Super!", ring: "ring-gold" },
];

const RESPONSES: Record<number, string[]> = {
  1: [
    "Hej, som tu s tebou. Bude lepšie. 💙",
    "Drž sa, zajtra je nový deň. 🤗",
    "Ťažké dni sú súčasťou života. Si silný/á.",
  ],
  2: [
    "Rozumiem. Dúfam, že sa to zlepší. 🌤️",
    "Nie každý deň je super — a to je ok.",
    "Nechceš mi o tom povedať viac? 🤔",
  ],
  3: [
    "Neutrálny deň tiež nie je zlý! ☀️",
    "Niekedy je 'ok' úplne dosť. 👍",
    "Fajn! Čo by ti dnes spravilo radosť?",
  ],
  4: [
    "Rád to počujem! Užívaj si to. 😊",
    "Super! Čo ťa dnes potešilo?",
    "Paráda! Dobrý deň sa ráta. ✨",
  ],
  5: [
    "To je úžasné! Tešíš ma! 🎉",
    "Wow, to je energia! Využi to! 🔥",
    "Super nálada! Pozor, je to nákazlivé! 😄",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function MoodPicker() {
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [note, setNote] = useState("");
  const [response, setResponse] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
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
    logMood(mood);
    setAlreadyLogged(true);
    setResponse(pickRandom(RESPONSES[mood]));
    setShowNote(true);
  }

  function handleSaveNote() {
    if (selected === null) return;
    logMood(selected, note || undefined);
    setNoteSaved(true);
  }

  // Already logged today — compact display
  if (alreadyLogged && !response) {
    const moodItem = MOODS.find((m) => m.value === selected);
    return (
      <Card className="border-muted">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-xl">{moodItem?.emoji}</span>
            <span>Dnes sa cítiš: {moodItem?.label}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardContent className="py-3 px-4">
        {!response ? (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              Ako sa dnes cítiš?
            </p>
            <div className="flex justify-center gap-2 bg-secondary/50 rounded-full px-3 py-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleSelect(m.value)}
                  className="text-3xl p-1.5 rounded-full transition-all hover:scale-125 active:scale-95"
                  title={m.label}
                  type="button"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {/* Souli reaction */}
            <div className="flex items-start gap-2">
              <span className="text-xl">{MOODS.find((m) => m.value === selected)?.emoji}</span>
              <p className="text-sm leading-relaxed pt-0.5">{response}</p>
            </div>

            {/* Optional note */}
            {showNote && !noteSaved && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pridaj poznámku... (voliteľné)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && note.trim()) handleSaveNote(); }}
                  className="flex-1 text-xs px-3 py-1.5 rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {note.trim() && (
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={handleSaveNote}>
                    Uložiť
                  </Button>
                )}
              </div>
            )}
            {noteSaved && (
              <p className="text-xs text-muted-foreground">Poznámka uložená! ✓</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
