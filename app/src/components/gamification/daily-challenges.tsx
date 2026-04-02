"use client";

import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { getDailyChallenges, completeChallengeById, type DailyChallenge } from "@/lib/challenges";
import { addXp } from "@/lib/gamification";
import { ShareCompletion } from "./share-completion";
import { Button } from "@/components/ui/button";

export function DailyChallenges() {
  const [items, setItems] = useState<DailyChallenge[]>(() => getDailyChallenges());
  const [proofFor, setProofFor] = useState<string | null>(null); // challenge ID being proved
  const [proofText, setProofText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleStartProof(id: string) {
    setProofFor(id);
    setProofText("");
  }

  function handleSubmitProof(id: string) {
    if (!proofText.trim()) return;
    completeChallengeById(id, proofText.trim());
    addXp(20, "challenge");
    setProofFor(null);
    setProofText("");
    setItems(getDailyChallenges());
  }

  function handlePhotoProof(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Store as "photo taken" proof (actual upload would go to Supabase Storage)
    const proof = `📸 Foto: ${file.name}`;
    completeChallengeById(id, proof);
    addXp(20, "challenge");
    setProofFor(null);
    setItems(getDailyChallenges());
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Denné výzvy
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((ch) => {
          const done = ch.completed;
          const isProving = proofFor === ch.id;

          return (
            <div key={ch.id} className="flex flex-col">
              <div
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  done
                    ? "bg-success/5 border-success/30"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                <button
                  onClick={() => !done && handleStartProof(ch.id)}
                  disabled={done}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer disabled:cursor-default"
                >
                  <span className="text-xl shrink-0">{ch.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${done ? "line-through text-muted-foreground" : "font-medium"}`}>
                      {ch.text}
                    </p>
                    {done && ch.proof && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {ch.proof}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {done ? (
                    <>
                      <ShareCompletion challengeText={ch.text} />
                      <span className="text-success text-sm">✓</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Splniť</span>
                  )}
                </div>
              </div>

              {/* Proof input */}
              {isProving && (
                <div className="flex flex-col gap-2 mt-2 ml-10 mr-2">
                  <p className="text-xs text-muted-foreground">{ch.proofHint}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      placeholder="Napíš krátky dôkaz..."
                      className="flex-1 text-sm px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitProof(ch.id)}
                    />
                    {(ch.proofType === "photo" || ch.proofType === "either") && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded-md border hover:bg-secondary"
                          title="Pridať fotku"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoProof(ch.id, e)}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setProofFor(null)}>
                      Zrušiť
                    </Button>
                    <Button size="sm" onClick={() => handleSubmitProof(ch.id)} disabled={!proofText.trim()}>
                      Splnené!
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
