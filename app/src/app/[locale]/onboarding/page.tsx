"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { playAvatarSound } from "@/lib/pixel-sounds";
import { getAvatarData, saveAvatarData, randomAppearance, generateSoundDNA } from "@/lib/avatar";
import { saveSoulFile } from "@/lib/soul";
import { addXp } from "@/lib/gamification";
import type { AvatarState, AvatarAppearance } from "@/lib/avatar";

// Dzino's appearance (the original mascot)
const DZINO_APPEARANCE: AvatarAppearance = {
  species: "cat",
  bodyShape: "round",
  eyeStyle: "anime",
  mouthStyle: "smile",
  earStyle: "pointy",
  accessory: "crown",
  hairStyle: "none",
  skinColor: "#FFE4C9",
  bodyColor: "#4F46E5",
};

const DZINO_SOUND_DNA = {
  basePitch: 550,
  timbre: "square" as OscillatorType,
  tempo: 1.0,
  chirpRange: 120,
  harmonicShift: 50,
};

type Phase = "intro" | "story" | "name" | "about" | "interests" | "style" | "birth" | "meet";

// Generate a cute, pronounceable name from syllable combinations
function randomSouliName(): string {
  const starts = ["Ki", "Lu", "Mo", "No", "Pi", "Zu", "Ba", "To", "Mi", "Ri", "Su", "Yu", "Ko", "Ta", "Na", "Bu", "Fi", "Zo", "Ma", "Ni"];
  const ends = ["ki", "lo", "mi", "ri", "ko", "ni", "po", "chi", "bi", "to", "shi", "ra", "li", "ka", "no", "ba", "fi", "zu"];
  const s = starts[Math.floor(Math.random() * starts.length)];
  const e = ends[Math.floor(Math.random() * ends.length)];
  return s + e;
}

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [dzState, setDzState] = useState<AvatarState>("waving");
  const [name, setName] = useState("");
  const [souliName, setSouliName] = useState(() => randomSouliName());
  const [about, setAbout] = useState("");
  const [interests, setInterests] = useState("");
  const [style, setStyle] = useState<"brief" | "detailed" | "">("");
  const [newAppearance, setNewAppearance] = useState<AvatarAppearance | null>(null);
  const [newSouliState, setNewSouliState] = useState<AvatarState>("idle");
  const [typedText, setTypedText] = useState("");
  const [typing, setTyping] = useState(false);

  // Typewriter effect for Dzino's messages
  function typeText(text: string, onDone?: () => void) {
    setTyping(true);
    setTypedText("");
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
        onDone?.();
      }
    }, 30);
    return () => clearInterval(interval);
  }

  // Phase transitions with Dzino reactions
  useEffect(() => {
    if (phase === "intro") {
      setDzState("waving");
      playAvatarSound("waving", DZINO_SOUND_DNA);
      typeText(t("storyIntro"));
    } else if (phase === "story") {
      setDzState("talking");
      typeText(t("storyOrigin"));
    } else if (phase === "name") {
      setDzState("happy");
      playAvatarSound("happy", DZINO_SOUND_DNA);
      typeText(t("storyName"));
    } else if (phase === "about") {
      setDzState("thinking");
      typeText(t("storyAbout"));
    } else if (phase === "interests") {
      setDzState("talking");
      typeText(t("storyInterests"));
    } else if (phase === "style") {
      setDzState("thinking");
      typeText(t("storyStyle"));
    } else if (phase === "birth") {
      setDzState("happy");
      playAvatarSound("happy", DZINO_SOUND_DNA);
      // Generate the new Souli
      const app = randomAppearance();
      setNewAppearance(app);
      typeText(t("storyBirth"), () => {
        setTimeout(() => setNewSouliState("waving"), 500);
      });
    } else if (phase === "meet") {
      setDzState("waving");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleNext() {
    const order: Phase[] = ["intro", "story", "name", "about", "interests", "style", "birth", "meet"];
    const idx = order.indexOf(phase);
    if (idx < order.length - 1) {
      setPhase(order[idx + 1]);
    }
  }

  function handleSkipTo(p: Phase) {
    setPhase(p);
  }

  function handleFinish() {
    // Save the new Souli
    const data = getAvatarData();
    if (newAppearance) {
      data.appearance = newAppearance;
    }
    data.name = souliName || "Souli";
    data.soundDNA = generateSoundDNA();
    saveAvatarData(data);

    // Save soul files from onboarding answers
    if (name) {
      saveSoulFile("preferencie", `# Preferencie\n\n- Meno používateľa: ${name}\n- Štýl: ${style === "brief" ? "stručné odpovede" : style === "detailed" ? "podrobné odpovede" : "predvolený"}\n`, "dzino");
    }
    if (about) {
      saveSoulFile("osobnost", `# Osobnosť\n\n- ${about}\n`, "dzino");
    }
    if (interests) {
      saveSoulFile("zaujmy", `# Záujmy\n\n- ${interests}\n`, "dzino");
    }

    addXp(50, "onboarding");
    localStorage.setItem("dzino_onboarding", "done");
    router.push("/");
  }

  const progress = ["intro", "story", "name", "about", "interests", "style", "birth", "meet"].indexOf(phase);
  const total = 8;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
      {/* Dzino (always visible until birth phase) */}
      {phase !== "birth" && phase !== "meet" && (
        <div style={{ animation: "float 3s ease-in-out infinite" }}>
          <PixelAvatar state={dzState} appearance={DZINO_APPEARANCE} level={10} size="lg" />
        </div>
      )}

      {/* Birth phase: show both Dzino and new Souli */}
      {(phase === "birth" || phase === "meet") && newAppearance && (
        <div className="flex items-end gap-6">
          <div style={{ animation: "float 3s ease-in-out infinite" }}>
            <PixelAvatar state={dzState} appearance={DZINO_APPEARANCE} level={10} size="md" />
          </div>
          <div style={{ animation: "float 3s ease-in-out infinite 0.5s" }}>
            <PixelAvatar state={newSouliState} appearance={newAppearance} level={1} size="lg" />
          </div>
        </div>
      )}

      {/* Speech bubble */}
      <div className="max-w-md w-full">
        <div className="bg-card border-2 border-border rounded-2xl px-5 py-4 shadow-sm relative">
          <p className="text-sm leading-relaxed min-h-[3rem]">
            {typedText}
            {typing && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>

      {/* Input area (only for relevant phases) */}
      {phase === "name" && !typing && (
        <div className="max-w-md w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("q1placeholder")}
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleNext(); }}
          />
        </div>
      )}

      {phase === "about" && !typing && (
        <div className="max-w-md w-full">
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder={t("q2placeholder")}
            rows={2}
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            autoFocus
          />
        </div>
      )}

      {phase === "interests" && !typing && (
        <div className="max-w-md w-full">
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder={t("q4placeholder")}
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
          />
        </div>
      )}

      {phase === "style" && !typing && (
        <div className="max-w-md w-full flex gap-3">
          <button
            onClick={() => { setStyle("brief"); handleSkipTo("birth"); }}
            className={`flex-1 rounded-xl border p-4 text-sm transition-all hover:border-primary hover:bg-primary/5 ${
              style === "brief" ? "border-primary bg-primary/5" : ""
            }`}
          >
            {t("q5option1")}
          </button>
          <button
            onClick={() => { setStyle("detailed"); handleSkipTo("birth"); }}
            className={`flex-1 rounded-xl border p-4 text-sm transition-all hover:border-primary hover:bg-primary/5 ${
              style === "detailed" ? "border-primary bg-primary/5" : ""
            }`}
          >
            {t("q5option2")}
          </button>
        </div>
      )}

      {/* Meet phase: name your Souli + finish */}
      {phase === "meet" && !typing && (
        <div className="max-w-md w-full text-center space-y-4">
          <input
            type="text"
            value={souliName}
            onChange={(e) => setSouliName(e.target.value)}
            placeholder={t("storyNameSouli")}
            className="w-full rounded-xl border bg-background px-4 py-3 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            maxLength={20}
            onKeyDown={(e) => { if (e.key === "Enter" && souliName.trim()) handleFinish(); }}
          />
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={handleFinish} className="px-8">
              {t("finish")}
            </Button>
          </div>
          <button
            onClick={() => { setNewAppearance(randomAppearance()); setNewSouliState("happy"); }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {t("storyReroll")}
          </button>
        </div>
      )}

      {/* Progress + next */}
      <div className="max-w-md w-full space-y-3">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i <= progress ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Next / Skip */}
        {phase !== "meet" && phase !== "style" && !typing && (
          <div className="flex justify-center gap-3">
            <Button onClick={handleNext} size="sm">
              {t("next")}
            </Button>
            {(phase === "name" || phase === "about" || phase === "interests") && (
              <Button variant="ghost" size="sm" onClick={handleNext}>
                {t("skip")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
