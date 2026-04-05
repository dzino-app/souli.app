"use client";

import { useState, useEffect } from "react";
import { playTimerTick } from "@/lib/pixel-sounds";

/**
 * Pre-hatching egg: wobbles and cracks but NEVER hatches.
 * Creates anticipation → "sign up to see who's inside"
 * Loops: wobble → crack → stronger crack → pause → repeat
 */

const EGG_PIXELS = [
  [0,0,0,1,1,0,0,0],
  [0,0,1,2,2,1,0,0],
  [0,1,2,2,2,2,1,0],
  [0,1,2,2,2,2,1,0],
  [1,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,1],
  [1,1,2,2,2,2,1,1],
  [0,1,1,2,2,1,1,0],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,0,0],
];

const EGG_COLORS: Record<number, string> = {
  0: "transparent",
  1: "#C4B5A0",
  2: "#F5F0E8",
};

const CRACK_STAGES = [
  [[4,3],[4,4]],
  [[3,3],[4,3],[4,4],[5,4]],
  [[2,3],[3,3],[3,4],[4,2],[4,3],[4,4],[4,5],[5,3],[5,4]],
];

interface PreHatchingEggProps {
  /** Color of the glow/cracks — matches the Souli's body color */
  glowColor?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = { sm: 8, md: 12, lg: 16 };

export function PreHatchingEgg({ glowColor = "#6C5CE7", size = "md" }: PreHatchingEggProps) {
  const [crackStage, setCrackStage] = useState(-1); // -1 = no cracks
  const [wobbleAngle, setWobbleAngle] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const pixelSize = SIZE_MAP[size];

  useEffect(() => {
    // Wobble continuously
    const wobbleInterval = setInterval(() => {
      setWobbleAngle((prev) => prev + 1);
    }, 100);

    // Crack cycle: no crack → crack1 → crack2 → crack3 → glow → pause → repeat
    let cycle = 0;
    const crackInterval = setInterval(() => {
      cycle = (cycle + 1) % 20; // 20 ticks per cycle at 500ms = 10 seconds
      if (cycle === 2) { setCrackStage(0); playTimerTick(); }
      else if (cycle === 5) { setCrackStage(1); playTimerTick(); }
      else if (cycle === 8) { setCrackStage(2); playTimerTick(); setGlowing(true); }
      else if (cycle === 12) { setGlowing(false); setCrackStage(-1); } // reset
    }, 500);

    return () => {
      clearInterval(wobbleInterval);
      clearInterval(crackInterval);
    };
  }, []);

  const wobbleIntensity = crackStage === -1 ? 5 : crackStage === 0 ? 8 : crackStage === 1 ? 12 : 18;
  const wobbleDeg = Math.sin(wobbleAngle * 0.8) * wobbleIntensity;

  return (
    <div className="relative flex items-center justify-center" style={{ width: pixelSize * 8, height: pixelSize * 10 }}>
      {/* Glow behind egg */}
      {glowing && (
        <div
          className="absolute inset-0 rounded-full blur-xl animate-pulse"
          style={{ backgroundColor: glowColor, opacity: 0.3 }}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(8, ${pixelSize}px)`,
          gridTemplateRows: `repeat(10, ${pixelSize}px)`,
          transform: `rotate(${wobbleDeg}deg)`,
          transition: "transform 100ms ease-in-out",
          imageRendering: "pixelated" as const,
        }}
      >
        {EGG_PIXELS.flat().map((val, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const isCracked = crackStage >= 0 && CRACK_STAGES[crackStage]?.some(([r, c]) => r === row && c === col);

          let color = EGG_COLORS[val];
          if (isCracked && val !== 0) {
            color = glowColor;
          }

          return (
            <div
              key={i}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: color,
                transition: "background-color 200ms ease",
              }}
            />
          );
        })}
      </div>

      {/* Sparkle particles on cracks */}
      {crackStage >= 1 && (
        <>
          <div className="absolute w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: glowColor, top: "30%", left: "60%", animationDuration: "0.8s" }} />
          <div className="absolute w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: glowColor, top: "50%", left: "35%", animationDuration: "0.6s", animationDelay: "0.2s" }} />
        </>
      )}
      {crackStage >= 2 && (
        <>
          <div className="absolute w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: glowColor, top: "25%", left: "45%", animationDuration: "0.5s" }} />
          <div className="absolute w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: glowColor, top: "55%", left: "55%", animationDuration: "0.7s", animationDelay: "0.1s" }} />
        </>
      )}
    </div>
  );
}
