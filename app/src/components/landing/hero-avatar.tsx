"use client";

import { useState, useEffect, useCallback } from "react";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { playAvatarSound } from "@/lib/pixel-sounds";
import { generateSoundDNA } from "@/lib/avatar";
import type { AvatarState, AvatarAppearance, SoundDNA } from "@/lib/avatar";

const HERO_APPEARANCE: AvatarAppearance = {
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

const CYCLE_STATES: AvatarState[] = [
  "waving", "idle", "happy", "walking", "thinking",
  "eating", "idle", "waving", "talking", "idle",
];

export function HeroAvatar() {
  const [state, setState] = useState<AvatarState>("waving");
  const [soundDNA] = useState<SoundDNA>(() => generateSoundDNA());

  // Cycle through activities
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % CYCLE_STATES.length;
      setState(CYCLE_STATES[idx]);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback(() => {
    const reactions: AvatarState[] = ["waving", "happy", "happy", "eating", "walking"];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    setState(pick);
    playAvatarSound(pick, soundDNA);
    setTimeout(() => setState("idle"), 2500);
  }, [soundDNA]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
      style={{ animation: "float 3s ease-in-out infinite" }}
    >
      <PixelAvatar
        state={state}
        level={10}
        size="lg"
        appearance={HERO_APPEARANCE}
      />
    </button>
  );
}
