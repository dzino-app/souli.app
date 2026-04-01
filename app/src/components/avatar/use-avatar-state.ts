"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAvatarData,
  setAvatarState,
  recordInteraction,
  type AvatarState,
  type AvatarData,
} from "@/lib/avatar";
import { getIdleState, calculateMood } from "@/lib/avatar-mood";

export function useAvatarState() {
  const [data, setData] = useState<AvatarData>(() => getAvatarData());
  const [transientState, setTransientState] = useState<AvatarState | null>(null);

  // On mount: calculate mood and set appropriate idle state
  useEffect(() => {
    const mood = calculateMood();
    const idle = getIdleState();
    setData((prev) => ({ ...prev, mood, state: idle }));

    // Play waving animation on first load
    setTransientState("waving");
    const timer = setTimeout(() => {
      setTransientState(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Play a temporary state animation, then return to idle
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

  // Record a chat interaction (boosts mood)
  const onChatStart = useCallback(() => {
    playState("thinking", 60000); // thinking until response
  }, [playState]);

  const onChatResponse = useCallback(() => {
    setTransientState("talking");
  }, []);

  const onChatEnd = useCallback(() => {
    recordInteraction();
    playState("happy", 2000);
  }, [playState]);

  const currentState = transientState || data.state;
  const mood = data.mood;

  return {
    state: currentState,
    mood,
    color: data.color,
    name: data.name,
    playState,
    onChatStart,
    onChatResponse,
    onChatEnd,
  };
}
