"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import { getGamification } from "@/lib/gamification";
import { getResolution, generateCharacter } from "@/lib/pixel-art";
import { ACTIVITY_ANIMATIONS } from "./avatar-frames";
import "./avatar.css";

interface PixelAvatarProps {
  state: AvatarState;
  appearance: AvatarAppearance;
  level?: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_PX: Record<string, number> = {
  sm: 60,
  md: 120,
  lg: 180,
};

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
  dancing: "dancing",
};

export function PixelAvatar({
  state,
  appearance,
  level: levelProp,
  size = "md",
}: PixelAvatarProps) {
  const resolvedLevel = levelProp ?? getGamification().level;
  const resolution = getResolution(resolvedLevel);
  const totalPx = SIZE_PX[size];
  const pixelSize = totalPx / resolution;

  const animKey = STATE_MAP[state] || "idle";
  const animation = ACTIVITY_ANIMATIONS[animKey] || ACTIVITY_ANIMATIONS.idle;

  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle frames
  useEffect(() => {
    setFrameIndex(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (!animation.loop && next >= animation.frames.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return animation.frames.length - 1;
        }
        return next % animation.frames.length;
      });
    }, 1000 / animation.fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animKey, animation.fps, animation.frames.length, animation.loop]);

  const currentFrame = animation.frames[frameIndex % animation.frames.length];

  const grid = useMemo(
    () => generateCharacter(appearance, resolution, currentFrame, resolvedLevel),
    [appearance, resolution, currentFrame, resolvedLevel],
  );

  // Border radius per pixel: chunky at low levels, smoother at high
  const borderRadius =
    resolution >= 16 ? 2 : resolution >= 12 ? 1 : 0;

  // The frame's body offset creates a slight shift -- we replicate that
  // by shifting the entire grid container
  const offsetX = currentFrame.bodyOffsetX * (pixelSize / 8);
  const offsetY = currentFrame.bodyOffsetY * (pixelSize / 8);

  // Slight container rotation from the frame
  const rotation = currentFrame.bodyRotation;

  // Transition speed tied to animation FPS
  const transitionMs = Math.round((1 / animation.fps) * 600);

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${resolution}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${resolution}, ${pixelSize}px)`,
          gap: 0,
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
          transition: `transform ${transitionMs}ms ease-in-out`,
          imageRendering: "pixelated" as const,
        }}
      >
        {grid.flat().map((color, i) => (
          <div
            key={i}
            style={{
              width: pixelSize,
              height: pixelSize,
              backgroundColor: color || "transparent",
              borderRadius,
              transition: `background-color ${transitionMs}ms ease-in-out`,
            }}
          />
        ))}
      </div>

      {/* ZZZ effect for sleeping */}
      {currentFrame.zzz && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            fontSize: Math.round(totalPx / 8),
            animation: "pixel-float-up 2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        >
          {"\ud83d\udca4"}
        </span>
      )}

      {/* Sparkle effect */}
      {currentFrame.sparkle && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            fontSize: Math.round(totalPx / 9),
            animation: "pixel-sparkle 0.6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        >
          {"\u2728"}
        </span>
      )}
    </div>
  );
}
