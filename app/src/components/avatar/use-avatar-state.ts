"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAvatarData,
  setAvatarState,
  recordInteraction,
  type AvatarState,
  type AvatarData,
  type AvatarAppearance,
} from "@/lib/avatar";
import { getIdleState, calculateMood } from "@/lib/avatar-mood";

const DEFAULT_APPEARANCE: AvatarAppearance = {
  species: "human",
  bodyShape: "round",
  eyeStyle: "dots",
  mouthStyle: "smile",
  earStyle: "none",
  accessory: "none",
  hairStyle: "none",
  skinColor: "#FDDCB5",
  bodyColor: "#4F46E5",
};

export function useAvatarState() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<AvatarData>({
    state: "idle",
    mood: 70,
    lastInteraction: new Date().toISOString(),
    color: "#4F46E5",
    name: "Dzino",
    appearance: DEFAULT_APPEARANCE,
  });
  const [transientState, setTransientState] = useState<AvatarState | null>(null);

  // Only read localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const stored = getAvatarData();
    const mood = calculateMood();
    const idle = getIdleState();
    setData({ ...stored, mood, state: idle });

    // Play waving animation on first load
    setTransientState("waving");
    const timer = setTimeout(() => {
      setTransientState(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const playState = useCallback(
    (state: AvatarState, durationMs: number = 2000) => {
      setTransientState(state);
      setAvatarState(state);
      setTimeout(() => {
        const idle = getIdleState();
        setTransientState(null);
        setAvatarState(idle);
        setData(getAvatarData());
      }, durationMs);
    },
    []
  );

  const onChatStart = useCallback(() => {
    playState("thinking", 60000);
  }, [playState]);

  const onChatResponse = useCallback(() => {
    setTransientState("talking");
  }, []);

  const onChatEnd = useCallback(() => {
    recordInteraction();
    playState("happy", 2000);
  }, [playState]);

  const currentState = transientState || data.state;

  return {
    mounted,
    state: currentState,
    mood: data.mood,
    color: data.color,
    name: data.name,
    appearance: data.appearance,
    playState,
    onChatStart,
    onChatResponse,
    onChatEnd,
  };
}
