"use client";

import { useEffect } from "react";
import { getAvatarResolution } from "@/lib/avatar-resolution";

interface LevelUpCelebrationProps {
  previousLevel: number;
  newLevel: number;
  onDismiss: () => void;
}

// Generate random pixel particles for fireworks
function generateParticles(count: number) {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    "#F1948A", "#82E0AA", "#F8C471", "#AED6F1",
    "#D2B4DE", "#A3E4D7", "#FAD7A0", "#ABEBC6",
  ];

  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 120 + Math.random() * 180;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 6 + Math.random() * 10;
    const delay = Math.random() * 0.4;
    const duration = 0.8 + Math.random() * 0.6;
    const color = colors[Math.floor(Math.random() * colors.length)];

    return { id: i, x, y, size, delay, duration, color };
  });
}

const particles = generateParticles(30);

export function LevelUpCelebration({ previousLevel, newLevel, onDismiss }: LevelUpCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const oldRes = getAvatarResolution(previousLevel);
  const newRes = getAvatarResolution(newLevel);
  const resolutionChanged = oldRes.label !== newRes.label;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={onDismiss}
    >
      {/* Pixel fireworks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2">
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: 2,
                left: 0,
                top: 0,
                opacity: 0,
                animation: `pixelExplode ${p.duration}s ease-out ${p.delay}s forwards`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--tx" as any]: `${p.x}px`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--ty" as any]: `${p.y}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center gap-4 text-center px-6"
        style={{ animation: "levelUpPop 0.5s ease-out forwards" }}
      >
        <p className="text-4xl font-black text-white tracking-wider"
          style={{ textShadow: "0 0 20px rgba(255,255,255,0.5)" }}
        >
          NOV{"\u00c1"} {"\u00da"}ROVE{"\u0147"}!
        </p>
        <div className="text-7xl font-black text-primary"
          style={{ textShadow: "0 0 30px var(--primary)" }}
        >
          {newLevel}
        </div>
        <p className="text-sm text-white/80">
          Dzino z{"\u00ed"}skal viac pixelov!
        </p>
        {resolutionChanged && (
          <div className="flex items-center gap-2 text-sm text-white/90 bg-white/10 rounded-full px-4 py-1.5">
            <span className="text-muted-foreground">{oldRes.label}</span>
            <span className="text-white">{"\u2192"}</span>
            <span className="text-primary font-bold">{newRes.label}</span>
          </div>
        )}
      </div>

      {/* CSS animations injected via style element */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pixelExplode {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes levelUpPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      ` }} />
    </div>
  );
}
