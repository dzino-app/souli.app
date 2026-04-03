"use client";

import { useState, useEffect, useCallback } from "react";
import { getGamification } from "@/lib/gamification";

const STORAGE_KEY = "dzino_previous_level";

function getStoredLevel(): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

function setStoredLevel(level: number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(level));
  }
}

export interface UseLevelUpResult {
  justLeveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  dismiss: () => void;
}

export function useLevelUp(): UseLevelUpResult {
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [newLevel, setNewLevel] = useState(1);

  useEffect(() => {
    const data = getGamification();
    const currentLevel = data.level;
    const stored = getStoredLevel();

    setNewLevel(currentLevel);

    if (stored === 0) {
      // First time: just store the current level, don't show celebration
      setStoredLevel(currentLevel);
      setPreviousLevel(currentLevel);
      return;
    }

    setPreviousLevel(stored);

    if (currentLevel > stored) {
      setJustLeveledUp(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setJustLeveledUp(false);
    setStoredLevel(newLevel);
  }, [newLevel]);

  return { justLeveledUp, previousLevel, newLevel, dismiss };
}
