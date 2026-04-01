"use client";

import { useEffect, useState, useRef } from "react";
import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import {
  getFrameCache,
  generateAllFrames,
  isCacheValid,
  type AvatarFrameCache,
} from "@/lib/avatar-cache";

interface CachedAvatarProps {
  state: AvatarState;
  appearance: AvatarAppearance;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: 60,
  md: 120,
  lg: 180,
};

// Map AvatarState to activity key
const STATE_MAP: Record<AvatarState, string> = {
  idle: "idle",
  talking: "talking",
  thinking: "thinking",
  happy: "happy",
  sad: "sad",
  waving: "waving",
  walking: "walking",
  eating: "eating",
  sleeping: "sleeping",
};

export function CachedAvatar({ state, appearance, size = "md" }: CachedAvatarProps) {
  const px = SIZES[size];
  const [cache, setCache] = useState<AvatarFrameCache | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load or generate cache
  useEffect(() => {
    if (isCacheValid(appearance)) {
      setCache(getFrameCache());
    } else {
      // Generate in next tick to avoid blocking render
      const timer = setTimeout(() => {
        const newCache = generateAllFrames(appearance);
        setCache(newCache);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [appearance]);

  // Animate frames
  const activityKey = STATE_MAP[state] || "idle";
  const activity = cache?.activities[activityKey] || cache?.activities["idle"];

  useEffect(() => {
    if (!activity) return;
    setFrameIndex(0);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (!activity.loop && next >= activity.dataUrls.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return activity.dataUrls.length - 1;
        }
        return next % activity.dataUrls.length;
      });
    }, 1000 / activity.fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activityKey, activity]);

  if (!activity || activity.dataUrls.length === 0) {
    // Fallback: colored placeholder while generating
    return (
      <div
        style={{
          width: px,
          height: px,
          backgroundColor: appearance.bodyColor,
          borderRadius: 16,
          opacity: 0.5,
        }}
      />
    );
  }

  const currentUrl = activity.dataUrls[frameIndex % activity.dataUrls.length];

  return (
    <img
      src={currentUrl}
      alt="Dzino"
      width={px}
      height={px}
      style={{
        imageRendering: "pixelated",
        width: px,
        height: px,
      }}
    />
  );
}
