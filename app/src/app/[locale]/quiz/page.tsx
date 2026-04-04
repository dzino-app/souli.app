"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { Button } from "@/components/ui/button";
import {
  SOULI_TYPES,
  computeSpecies,
  buildQuizAppearance,
} from "@/lib/souli-types";
import { generateShareImage } from "@/lib/quiz-share";

/* ------------------------------------------------------------------ */
/*  Quiz questions — 5 questions, 4 answers each                      */
/* ------------------------------------------------------------------ */

const QUESTIONS = [
  { key: "q1", answers: ["q1a", "q1b", "q1c", "q1d"] },
  { key: "q2", answers: ["q2a", "q2b", "q2c", "q2d"] },
  { key: "q3", answers: ["q3a", "q3b", "q3c", "q3d"] },
  { key: "q4", answers: ["q4a", "q4b", "q4c", "q4d"] },
  { key: "q5", answers: ["q5a", "q5b", "q5c", "q5d"] },
] as const;

const ANSWER_EMOJIS = [
  ["\uD83D\uDCDA", "\uD83C\uDF89", "\uD83C\uDF3F", "\uD83D\uDE80"],
  ["\u2728", "\uD83E\uDDE0", "\uD83D\uDCAB", "\uD83D\uDD2E"],
  ["\u26F0\uFE0F", "\uD83C\uDFE0", "\uD83C\uDF8A", "\uD83C\uDF0D"],
  ["\uD83E\uDDE9", "\uD83D\uDC96", "\u26A1", "\uD83E\uDD1D"],
  ["\uD83C\uDF3A", "\uD83D\uDD25", "\uD83C\uDF19", "\uD83C\uDF88"],
];

/* ------------------------------------------------------------------ */
/*  Main Quiz Component                                               */
/* ------------------------------------------------------------------ */

export default function QuizPage() {
  const t = useTranslations("quiz");
  const params = useParams();
  const locale = params.locale as string;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<"quiz" | "revealing" | "result">("quiz");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);

  // After all 5 questions are answered, compute result
  const species = useMemo(
    () => (answers.length === 5 ? computeSpecies(answers) : null),
    [answers],
  );
  const souliType = species ? SOULI_TYPES[species] : null;
  const appearance = useMemo(
    () => (species ? buildQuizAppearance(answers, species) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [species],
  );

  const handleAnswer = useCallback(
    (answerIdx: number) => {
      if (selectedAnswer !== null) return; // prevent double-tap
      setSelectedAnswer(answerIdx);

      setTimeout(() => {
        const newAnswers = [...answers, answerIdx];
        setAnswers(newAnswers);
        setSelectedAnswer(null);

        if (newAnswers.length === 5) {
          // Start reveal animation
          setPhase("revealing");
          setTimeout(() => setPhase("result"), 2400);
        } else {
          setCurrentQ((prev) => prev + 1);
        }
      }, 400);
    },
    [answers, selectedAnswer],
  );

  const handleRetake = useCallback(() => {
    setAnswers([]);
    setCurrentQ(0);
    setPhase("quiz");
    setSelectedAnswer(null);
  }, []);

  const handleShare = useCallback(async () => {
    if (!appearance || !souliType) return;
    setSharing(true);

    try {
      const blob = await generateShareImage(
        appearance,
        souliType,
        t(souliType.nameKey),
        t(souliType.descriptionKey),
      );

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "souli.png", { type: "image/png" })] })) {
        await navigator.share({
          title: t("shareTitle"),
          text: t("shareText"),
          files: [new File([blob], "my-souli.png", { type: "image/png" })],
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-souli.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled or share failed — ignore
    } finally {
      setSharing(false);
    }
  }, [appearance, souliType, t]);

  /* ---------------------------------------------------------------- */
  /*  Reveal animation                                                */
  /* ---------------------------------------------------------------- */

  if (phase === "revealing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        {/* Pulsing circles */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              backgroundColor: souliType?.bodyColor ?? "#4F46E5",
              opacity: 0.15,
            }}
          />
          <div
            className="absolute inset-4 rounded-full animate-pulse"
            style={{
              backgroundColor: souliType?.bodyColor ?? "#4F46E5",
              opacity: 0.25,
            }}
          />
          <div
            className="w-20 h-20 rounded-full animate-pulse"
            style={{
              backgroundColor: souliType?.bodyColor ?? "#4F46E5",
              opacity: 0.4,
            }}
          />
        </div>
        <p className="text-lg text-muted-foreground animate-pulse">
          {t("revealing")}
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Result screen                                                   */
  /* ---------------------------------------------------------------- */

  if (phase === "result" && souliType && appearance) {
    return (
      <div className="flex flex-col items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-700">
        {/* Result title */}
        <h1 className="text-2xl font-bold">{t("resultTitle")}</h1>

        {/* Avatar with glow */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ backgroundColor: souliType.bodyColor }}
          />
          <div
            className="relative"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            <PixelAvatar
              state="happy"
              appearance={appearance}
              level={10}
              size="lg"
            />
          </div>
        </div>

        {/* Type name + emoji */}
        <div>
          <span className="text-4xl">{souliType.emoji}</span>
          <h2
            className="text-2xl font-bold mt-2"
            style={{ color: souliType.bodyColor }}
          >
            {t(souliType.nameKey)}
          </h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground max-w-sm">
          {t(souliType.descriptionKey)}
        </p>

        {/* Traits */}
        <div className="flex flex-wrap justify-center gap-2">
          {souliType.traits.map((trait) => (
            <span
              key={trait}
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: souliType.bodyColor + "20",
                color: souliType.bodyColor,
              }}
            >
              {t(trait)}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <a
            href={`/${locale}/registracia`}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full"
          >
            {t("resultCta")}
          </a>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? "..." : t("resultShare")}
          </Button>
          <button
            onClick={handleRetake}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("retake")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Quiz questions                                                  */
  /* ---------------------------------------------------------------- */

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ) / QUESTIONS.length) * 100;

  return (
    <div className="flex flex-col min-h-[70vh]">
      {/* Header with title + progress */}
      {currentQ === 0 && (
        <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question number */}
      <p className="text-sm text-muted-foreground text-center mb-2">
        {currentQ + 1} / {QUESTIONS.length}
      </p>

      {/* Question */}
      <h2
        key={question.key}
        className="text-xl font-semibold text-center mb-8 animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {t(question.key)}
      </h2>

      {/* Answer options — big emoji cards */}
      <div
        key={`answers-${currentQ}`}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        {question.answers.map((answerKey, idx) => {
          const isSelected = selectedAnswer === idx;
          return (
            <button
              key={answerKey}
              onClick={() => handleAnswer(idx)}
              disabled={selectedAnswer !== null}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 text-left
                transition-all duration-200 ease-out
                hover:scale-[1.02] hover:border-primary/50 hover:bg-accent/50
                active:scale-[0.98]
                disabled:cursor-default
                ${isSelected
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-border bg-card"
                }
              `}
            >
              <span className="text-3xl shrink-0">{ANSWER_EMOJIS[currentQ][idx]}</span>
              <span className="text-sm font-medium">{t(answerKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
