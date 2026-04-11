"use client";

/**
 * Occasionally make the avatar do a random little thing — wave, dance, eat,
 * mutter — accompanied by its chiptune voice. Only runs when the user is
 * signed in, only fires when the tab is visible, and the sound is gated by
 * the existing soundEnabled user setting via playAvatarSound.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAvatarData, type AvatarState } from "@/lib/avatar";
import { playAvatarSound } from "@/lib/pixel-sounds";

const FUN_STATES: AvatarState[] = [
  "waving",
  "happy",
  "dancing",
  "eating",
  "talking",
  "walking",
  "thinking",
];

const FIRST_DELAY_MIN_MS = 15_000;
const FIRST_DELAY_MAX_MS = 45_000;
const NEXT_DELAY_MIN_MS = 45_000;
const NEXT_DELAY_MAX_MS = 120_000;
const ANIMATION_MS = 2_500;

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min));
}

function pickState(): AvatarState {
  return FUN_STATES[Math.floor(Math.random() * FUN_STATES.length)];
}

export function useRandomIdleBehavior(
  playState: (state: AvatarState, durationMs?: number) => void,
) {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function schedule(min: number, max: number) {
      if (cancelled) return;
      timer = setTimeout(trigger, randInt(min, max));
    }

    function trigger() {
      if (cancelled) return;
      // Don't disturb a hidden tab — reschedule instead
      if (typeof document !== "undefined" && document.hidden) {
        schedule(NEXT_DELAY_MIN_MS, NEXT_DELAY_MAX_MS);
        return;
      }
      const state = pickState();
      playState(state, ANIMATION_MS);
      const dna = getAvatarData().soundDNA;
      if (dna) playAvatarSound(state, dna);
      schedule(NEXT_DELAY_MIN_MS, NEXT_DELAY_MAX_MS);
    }

    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user || cancelled) return;
        schedule(FIRST_DELAY_MIN_MS, FIRST_DELAY_MAX_MS);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [playState]);
}
