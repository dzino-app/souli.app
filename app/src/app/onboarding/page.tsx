"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    name: "",
    profession: "",
    needs: "",
    documentTypes: "",
    style: "" as "brief" | "detailed" | "",
  });

  function updateAnswer(key: keyof typeof answers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleFinish() {
    // Store onboarding data in localStorage for now
    // Will move to Supabase memories table later
    localStorage.setItem("dzino_onboarding", JSON.stringify(answers));
    router.push("/");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {step === 1 && (
            <>
              <div className="text-2xl font-bold text-primary mb-2">Dzino</div>
              <CardTitle className="text-xl">{t("welcome")}</CardTitle>
              <CardDescription>{t("welcomeDesc")}</CardDescription>
            </>
          )}
          {step > 1 && (
            <CardDescription>
              {t("step", { current: step, total: TOTAL_STEPS })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("q1")}</label>
                <input
                  type="text"
                  value={answers.name}
                  onChange={(e) => updateAnswer("name", e.target.value)}
                  placeholder={t("q1placeholder")}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Profession */}
            {step === 2 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("q2")}</label>
                <input
                  type="text"
                  value={answers.profession}
                  onChange={(e) => updateAnswer("profession", e.target.value)}
                  placeholder={t("q2placeholder")}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
            )}

            {/* Step 3: Needs */}
            {step === 3 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("q3")}</label>
                <textarea
                  value={answers.needs}
                  onChange={(e) => updateAnswer("needs", e.target.value)}
                  placeholder={t("q3placeholder")}
                  rows={3}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  autoFocus
                />
              </div>
            )}

            {/* Step 4: Document types */}
            {step === 4 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("q4")}</label>
                <input
                  type="text"
                  value={answers.documentTypes}
                  onChange={(e) => updateAnswer("documentTypes", e.target.value)}
                  placeholder={t("q4placeholder")}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
            )}

            {/* Step 5: Communication style */}
            {step === 5 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">{t("q5")}</label>
                <div className="flex flex-col gap-2 mt-1">
                  <button
                    onClick={() => updateAnswer("style", "brief")}
                    className={`rounded-lg border p-4 text-left text-sm transition-colors ${
                      answers.style === "brief"
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {t("q5option1")}
                  </button>
                  <button
                    onClick={() => updateAnswer("style", "detailed")}
                    className={`rounded-lg border p-4 text-left text-sm transition-colors ${
                      answers.style === "detailed"
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {t("q5option2")}
                  </button>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("previous")}
              </Button>

              {step < TOTAL_STEPS ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((s) => s + 1)}
                  >
                    {t("skip")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setStep((s) => s + 1)}
                  >
                    {t("next")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <Button onClick={handleFinish}>
                  {t("finish")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
