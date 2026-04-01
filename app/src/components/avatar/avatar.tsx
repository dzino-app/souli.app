"use client";

import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import "./avatar.css";

interface AvatarProps {
  state: AvatarState;
  color: string;
  size?: "sm" | "md" | "lg";
  appearance?: AvatarAppearance;
}

const SIZES = {
  sm: { body: 40, scale: 0.5 },
  md: { body: 80, scale: 1 },
  lg: { body: 120, scale: 1.5 },
};

const DEFAULT_APPEARANCE: AvatarAppearance = {
  bodyShape: "round",
  eyeStyle: "dots",
  mouthStyle: "smile",
  accessory: "none",
};

/* ---------- Eyes ---------- */
function Eyes({ style }: { style: AvatarAppearance["eyeStyle"] }) {
  switch (style) {
    case "dots":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--dots" />
          <div className="av-eye av-eye--dots" />
        </div>
      );
    case "wide":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--wide">
            <div className="av-pupil" />
          </div>
          <div className="av-eye av-eye--wide">
            <div className="av-pupil" />
          </div>
        </div>
      );
    case "sleepy":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--sleepy" />
          <div className="av-eye av-eye--sleepy" />
        </div>
      );
    case "anime":
      return (
        <div className="av-eyes av-eyes--anime">
          <div className="av-eye av-eye--anime">
            <div className="av-pupil av-pupil--anime" />
            <div className="av-shine" />
          </div>
          <div className="av-eye av-eye--anime">
            <div className="av-pupil av-pupil--anime" />
            <div className="av-shine" />
          </div>
        </div>
      );
  }
}

/* ---------- Mouth ---------- */
function Mouth({ style }: { style: AvatarAppearance["mouthStyle"] }) {
  return <div className={`av-mouth av-mouth--${style}`} />;
}

/* ---------- Accessory ---------- */
function AccessoryLayer({ type, color }: { type: AvatarAppearance["accessory"]; color: string }) {
  switch (type) {
    case "none":
      return null;
    case "crown":
      return (
        <div className="av-accessory av-crown">
          <div className="av-crown__base" />
          <div className="av-crown__spike av-crown__spike--l" />
          <div className="av-crown__spike av-crown__spike--c" />
          <div className="av-crown__spike av-crown__spike--r" />
        </div>
      );
    case "cap":
      return (
        <div className="av-accessory av-cap">
          <div className="av-cap__top" style={{ backgroundColor: color }} />
          <div className="av-cap__brim" style={{ backgroundColor: color, filter: "brightness(0.8)" }} />
        </div>
      );
    case "bow":
      return (
        <div className="av-accessory av-bow">
          <div className="av-bow__left" />
          <div className="av-bow__knot" />
          <div className="av-bow__right" />
        </div>
      );
    case "horns":
      return (
        <div className="av-accessory av-horns">
          <div className="av-horn av-horn--l" />
          <div className="av-horn av-horn--r" />
        </div>
      );
    case "halo":
      return (
        <div className="av-accessory av-halo" />
      );
  }
}

export function Avatar({ state, color, size = "md", appearance }: AvatarProps) {
  const { scale } = SIZES[size];
  const ap = appearance ?? DEFAULT_APPEARANCE;

  return (
    <div
      className={`avatar-container avatar--${state}`}
      style={{ transform: `scale(${scale})` }}
    >
      <AccessoryLayer type={ap.accessory} color={color} />
      <div
        className={`avatar-body avatar-body--${ap.bodyShape}`}
        style={{ backgroundColor: color }}
      >
        <div className="av-pixel-border" style={{ borderColor: color }} />
        <Eyes style={ap.eyeStyle} />
        <Mouth style={ap.mouthStyle} />
        <span className="avatar-zzz">&#x1F4A4;</span>
      </div>
    </div>
  );
}
