"use client";

import type { AvatarState } from "@/lib/avatar";
import "./avatar.css";

interface AvatarProps {
  state: AvatarState;
  color: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { body: 40, scale: 0.5 },
  md: { body: 80, scale: 1 },
  lg: { body: 120, scale: 1.5 },
};

export function Avatar({ state, color, size = "md" }: AvatarProps) {
  const { scale } = SIZES[size];

  return (
    <div
      className={`avatar-container avatar--${state}`}
      style={{ transform: `scale(${scale})` }}
    >
      <div className="avatar-body" style={{ backgroundColor: color }}>
        <div className="avatar-eyes">
          <div className="avatar-eye" />
          <div className="avatar-eye" />
        </div>
        <div className="avatar-mouth" />
        <span className="avatar-zzz">💤</span>
      </div>
    </div>
  );
}
