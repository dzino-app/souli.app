"use client";

import { useEffect, useState, useRef } from "react";
import { PixelAvatar } from "./pixel-avatar";
import { ACTIVITY_ANIMATIONS } from "./avatar-frames";
import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import "./avatar.css";

interface StoredAvatarProps {
  /** Pre-rendered static preview URL (idle frame 0) */
  previewUrl?: string | null;
  /** Pre-rendered animation frame URLs per activity */
  animationUrls?: Record<string, string[]> | null;
  /** Current activity state */
  state: AvatarState;
  /** Display size */
  size?: "sm" | "md" | "lg";
  /** If no stored frames, fall back to real-time PixelAvatar */
  fallbackAppearance?: AvatarAppearance;
  /** Level for fallback rendering */
  fallbackLevel?: number;
  /** If true, only show the static preview (no animation) */
  staticOnly?: boolean;
}

const SIZE_PX: Record<string, number> = {
  sm: 60,
  md: 120,
  lg: 180,
};

/* eslint-disable @next/next/no-img-element */

export function StoredAvatar({
  previewUrl,
  animationUrls,
  state,
  size = "md",
  fallbackAppearance,
  fallbackLevel,
  staticOnly = false,
}: StoredAvatarProps) {
  const totalPx = SIZE_PX[size];

  // If static only and we have a preview, just show the image
  if (staticOnly && previewUrl) {
    return (
      <div
        className="pixel-avatar-wrapper"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: totalPx,
          height: totalPx,
        }}
      >
        <img
          src={previewUrl}
          alt="Avatar"
          width={totalPx}
          height={totalPx}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    );
  }

  // If we have animation frames for the current state, animate them
  const frames = animationUrls?.[state];
  if (frames && frames.length > 0) {
    return (
      <AnimatedFrames
        frames={frames}
        state={state}
        totalPx={totalPx}
      />
    );
  }

  // If we have a preview but no animation frames for this state, show preview
  if (previewUrl && !animationUrls) {
    return (
      <div
        className="pixel-avatar-wrapper"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: totalPx,
          height: totalPx,
        }}
      >
        <img
          src={previewUrl}
          alt="Avatar"
          width={totalPx}
          height={totalPx}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    );
  }

  // Fallback: real-time PixelAvatar rendering
  if (fallbackAppearance) {
    return (
      <PixelAvatar
        state={state}
        appearance={fallbackAppearance}
        level={fallbackLevel}
        size={size}
      />
    );
  }

  // Nothing to show
  return (
    <div
      style={{
        width: totalPx,
        height: totalPx,
        backgroundColor: "var(--secondary, #f3f4f6)",
        borderRadius: 8,
      }}
    />
  );
}

/**
 * Internal component that cycles through pre-rendered frame images.
 */
function AnimatedFrames({
  frames,
  state,
  totalPx,
}: {
  frames: string[];
  state: string;
  totalPx: number;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animation = ACTIVITY_ANIMATIONS[state] || ACTIVITY_ANIMATIONS.idle;
  const fps = animation?.fps ?? 2;
  const loop = animation?.loop ?? true;

  useEffect(() => {
    setFrameIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (!loop && next >= frames.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return frames.length - 1;
        }
        return next % frames.length;
      });
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, fps, frames.length, loop]);

  const currentFrame = frames[frameIndex % frames.length];

  return (
    <div
      className="pixel-avatar-wrapper"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: totalPx,
        height: totalPx,
      }}
    >
      <img
        src={currentFrame}
        alt="Avatar"
        width={totalPx}
        height={totalPx}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
