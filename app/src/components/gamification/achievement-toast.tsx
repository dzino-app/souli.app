"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Achievement } from "@/lib/achievements";

interface AchievementToastState {
  visible: boolean;
  achievement: Achievement | null;
}

export function useAchievementToast() {
  const [state, setState] = useState<AchievementToastState>({
    visible: false,
    achievement: null,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((achievement: Achievement) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ visible: true, achievement });
    timerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    show,
    dismiss,
    visible: state.visible,
    achievement: state.achievement,
  };
}

interface AchievementToastProps {
  visible: boolean;
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementToast({
  visible,
  achievement,
  onDismiss,
}: AchievementToastProps) {
  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="flex items-center gap-3 rounded-xl border bg-background/95 backdrop-blur px-4 py-3 shadow-lg cursor-pointer hover:bg-secondary/50 transition-colors"
      >
        <span className="text-2xl">{achievement.icon}</span>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium">
            Nov{"\u00fd"} {"\u00fa"}spech!
          </span>
          <span className="text-sm font-semibold">{achievement.name}</span>
        </div>
      </button>
    </div>
  );
}
