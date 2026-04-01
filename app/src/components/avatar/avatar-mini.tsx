"use client";

import type { AvatarState } from "@/lib/avatar";
import "./avatar.css";

interface AvatarMiniProps {
  state: AvatarState;
  color: string;
}

export function AvatarMini({ state, color }: AvatarMiniProps) {
  return (
    <div
      className={`avatar-container avatar--${state}`}
      style={{ transform: "scale(0.4)" }}
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
