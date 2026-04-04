"use client";

import { useState, useEffect } from "react";
import { PixelAvatar } from "./pixel-avatar";
import { playTimerTick, playTimerComplete } from "@/lib/pixel-sounds";
import type { AvatarAppearance, AvatarState } from "@/lib/avatar";

/**
 * Hatching egg animation:
 * 1. Egg wobbles and cracks
 * 2. Cracks grow with particle effects
 * 3. Egg breaks open with flash
 * 4. Baby Souli emerges (level 1, tiny)
 */

interface HatchingEggProps {
  appearance: AvatarAppearance;
  onHatched?: () => void;
}

const EGG_PIXELS = [
  // 8x10 pixel egg shape (0 = empty, 1 = shell, 2 = highlight, 3 = shadow)
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
  3: "#A89880",
};

// Crack patterns (pixel positions that crack at each stage)
const CRACK_STAGES = [
  [[4,3],[4,4]], // tiny crack
  [[3,3],[4,3],[4,4],[5,4]], // medium crack
  [[2,3],[3,3],[3,4],[4,2],[4,3],[4,4],[4,5],[5,3],[5,4]], // big crack
  [[1,3],[2,2],[2,3],[2,4],[3,2],[3,3],[3,4],[3,5],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[5,2],[5,3],[5,4],[5,5]], // breaking
];

type Stage = "wobble" | "crack1" | "crack2" | "crack3" | "break" | "flash" | "reveal";

export function HatchingEgg({ appearance, onHatched }: HatchingEggProps) {
  const [stage, setStage] = useState<Stage>("wobble");
  const [wobbleAngle, setWobbleAngle] = useState(0);
  const [particles, setParticles] = useState<{ x: number; y: number; id: number }[]>([]);
  const [souliState, setSouliState] = useState<AvatarState>("idle");

  useEffect(() => {
    // Wobble animation
    const wobbleInterval = setInterval(() => {
      setWobbleAngle((prev) => {
        const next = prev + 1;
        return next;
      });
    }, 100);

    // Stage progression timeline
    const timers = [
      setTimeout(() => { setStage("crack1"); playTimerTick(); }, 1500),
      setTimeout(() => { setStage("crack2"); playTimerTick(); addParticles(); }, 2500),
      setTimeout(() => { setStage("crack3"); playTimerTick(); addParticles(); }, 3500),
      setTimeout(() => { setStage("break"); playTimerTick(); addParticles(); }, 4500),
      setTimeout(() => { setStage("flash"); }, 5000),
      setTimeout(() => {
        setStage("reveal");
        playTimerComplete();
        setSouliState("happy");
        setTimeout(() => setSouliState("waving"), 1500);
        onHatched?.();
      }, 5500),
    ];

    function addParticles() {
      const newParticles = Array.from({ length: 4 }, (_, i) => ({
        x: 40 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        id: Date.now() + i,
      }));
      setParticles((prev) => [...prev, ...newParticles]);
      setTimeout(() => setParticles((prev) => prev.filter((p) => !newParticles.includes(p))), 800);
    }

    return () => {
      clearInterval(wobbleInterval);
      timers.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wobbleDeg = stage === "wobble" ? Math.sin(wobbleAngle * 0.8) * 8 :
                    stage === "crack1" ? Math.sin(wobbleAngle * 1.2) * 12 :
                    stage === "crack2" ? Math.sin(wobbleAngle * 1.5) * 15 :
                    stage === "crack3" ? Math.sin(wobbleAngle * 2) * 20 :
                    0;

  const crackIdx = stage === "crack1" ? 0 : stage === "crack2" ? 1 : stage === "crack3" ? 2 : stage === "break" ? 3 : -1;

  if (stage === "flash") {
    return (
      <div className="flex items-center justify-center w-32 h-40">
        <div className="w-24 h-24 rounded-full bg-primary/40 animate-ping" />
      </div>
    );
  }

  if (stage === "reveal") {
    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500">
        <div className="relative w-[180px] h-[180px] flex items-center justify-center" style={{ animation: "float 3s ease-in-out infinite" }}>
          {/* Large canvas, tiny Souli inside — emphasizes how small they start */}
          <PixelAvatar state={souliState} appearance={appearance} level={1} size="lg" />
        </div>
      </div>
    );
  }

  // Egg render
  const pixelSize = 12;
  return (
    <div className="relative flex items-center justify-center w-32 h-40">
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
          const isCracked = crackIdx >= 0 && CRACK_STAGES[crackIdx].some(([r, c]) => r === row && c === col);

          let color = EGG_COLORS[val];
          if (isCracked && val !== 0) {
            color = "#4F46E5"; // crack glow color (primary)
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

      {/* Crack particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
}
