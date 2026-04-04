"use client";

import { useState } from "react";
import { Sparkles, ChevronRight, Check, X, Brain, Lightbulb, MessageCircle, FlaskConical, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addXp } from "@/lib/gamification";

type Phase = "intro" | "deep" | "quiz" | "result";

/* eslint-disable @typescript-eslint/no-explicit-any */

const FORMAT_ICONS: Record<string, typeof Brain> = {
  fact: Brain,
  concept: Lightbulb,
  debate: MessageCircle,
  experiment: FlaskConical,
  story: BookOpen,
};

const FORMAT_LABELS: Record<string, string> = {
  fact: "Vedel si?",
  concept: "Mini-lekcia",
  debate: "Čo si myslíš?",
  experiment: "Vyskúšaj si",
  story: "Príbeh",
};

interface LessonCardProps {
  format: string;
  content: any;
  completed?: boolean;
  onComplete?: () => void;
}

export function LessonCard({ format, content, completed, onComplete }: LessonCardProps) {
  const [phase, setPhase] = useState<Phase>(completed ? "result" : "intro");
  const [correct, setCorrect] = useState<boolean | null>(completed ? true : null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const Icon = FORMAT_ICONS[format] || Brain;
  const label = FORMAT_LABELS[format] || "Vedel si?";

  function handleAnswer(index: number) {
    const isCorrect = index === content.quiz?.correctIndex;
    setCorrect(isCorrect);
    setPhase("result");
    if (!completed) {
      addXp(isCorrect ? 15 : 5, "lesson");
      onComplete?.();
    }
  }

  function handleDebateChoice() {
    setPhase("result");
    if (!completed) {
      addXp(10, "lesson");
      onComplete?.();
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="py-4 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{content.emoji}</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {content.category}
              </p>
              <p className="text-sm font-semibold">{content.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium">{label}</span>
          </div>
        </div>

        {/* === FACT FORMAT === */}
        {format === "fact" && (
          <>
            {phase === "intro" && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{content.fact}</p>
                <Button size="sm" variant="outline" className="w-full group" onClick={() => setPhase("deep")}>
                  Chcem vedieť viac
                  <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            )}
            {phase === "deep" && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{content.fact}</p>
                <div className="bg-background/60 rounded-lg p-3 border border-primary/10">
                  <p className="text-xs leading-relaxed text-muted-foreground">{content.explanation}</p>
                </div>
                <Button size="sm" className="w-full" onClick={() => setPhase("quiz")}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Otestuj sa!
                </Button>
              </div>
            )}
          </>
        )}

        {/* === CONCEPT FORMAT === */}
        {format === "concept" && (
          <>
            {phase === "intro" && (
              <div className="space-y-3">
                {content.steps?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-xs font-bold text-primary mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.content}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs font-medium">Vyskúšaj dnes:</p>
                  <p className="text-xs text-muted-foreground">{content.tryThis}</p>
                </div>
                {content.quiz && (
                  <Button size="sm" className="w-full" onClick={() => setPhase("quiz")}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Otestuj sa!
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* === STORY FORMAT === */}
        {format === "story" && (
          <>
            {phase === "intro" && (
              <div className="space-y-3">
                <p className="text-sm font-medium italic">{content.hook}</p>
                <Button size="sm" variant="outline" className="w-full group" onClick={() => setPhase("deep")}>
                  Pokračuj v príbehu
                  <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            )}
            {phase === "deep" && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{content.story}</p>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs font-medium">{content.twist}</p>
                </div>
                {content.quiz && (
                  <Button size="sm" className="w-full" onClick={() => setPhase("quiz")}>
                    <Sparkles className="h-3.5 w-3.5 mr-1" /> Otestuj sa!
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* === DEBATE FORMAT === */}
        {format === "debate" && (
          <>
            {phase === "intro" && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{content.setup}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDebateChoice}
                    className="text-left p-3 rounded-lg border bg-background/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <p className="text-xs font-semibold mb-1">{content.sideA?.label}</p>
                    <p className="text-[11px] text-muted-foreground">{content.sideA?.argument}</p>
                  </button>
                  <button
                    onClick={handleDebateChoice}
                    className="text-left p-3 rounded-lg border bg-background/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <p className="text-xs font-semibold mb-1">{content.sideB?.label}</p>
                    <p className="text-[11px] text-muted-foreground">{content.sideB?.argument}</p>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* === EXPERIMENT FORMAT === */}
        {format === "experiment" && (
          <>
            {phase === "intro" && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{content.why}</p>
                <div className="space-y-1.5">
                  {content.steps?.map((step: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-primary mt-0.5">{i + 1}</span>
                      <p className="text-xs">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-primary/10 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium">Čo si všímaj:</p>
                  <p className="text-xs text-muted-foreground">{content.whatToNotice}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setPhase("deep")}>
                  Prečo to funguje?
                </Button>
              </div>
            )}
            {phase === "deep" && (
              <div className="space-y-3">
                <div className="bg-background/60 rounded-lg p-3 border border-primary/10">
                  <p className="text-xs leading-relaxed text-muted-foreground">{content.science}</p>
                </div>
                <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => { addXp(10, "lesson"); onComplete?.(); setDismissed(true); }}>
                  Hotovo!
                </Button>
              </div>
            )}
          </>
        )}

        {/* === QUIZ (shared) === */}
        {phase === "quiz" && content.quiz && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{content.quiz.question}</p>
            <div className="space-y-2">
              {content.quiz.options?.map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border bg-background/60 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <span className="text-muted-foreground mr-2 font-mono text-xs">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === RESULT (shared) === */}
        {phase === "result" && (
          <div className="space-y-3">
            {correct !== null && (
              correct ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm font-medium text-green-700">Správne! +15 XP</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <X className="h-5 w-5 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-700">Skoro! +5 XP</p>
                    <p className="text-xs text-orange-600/80">Odpoveď: {content.quiz?.options?.[content.quiz?.correctIndex]}</p>
                  </div>
                </div>
              )
            )}
            {format === "debate" && content.funFact && (
              <div className="bg-background/60 rounded-lg p-3 border border-primary/10">
                <p className="text-xs text-muted-foreground">{content.funFact}</p>
              </div>
            )}
            {completed && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-green-600" /> Hotovo!
              </p>
            )}
            <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setDismissed(true)}>
              Zavrieť
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
