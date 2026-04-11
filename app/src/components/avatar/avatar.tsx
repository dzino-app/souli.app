"use client";

import { useEffect, useState, useRef } from "react";
import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import { getGamification } from "@/lib/gamification";
import { getAvatarResolution } from "@/lib/avatar-resolution";
import { ACTIVITY_ANIMATIONS, type AvatarFrame } from "./avatar-frames";
import "./avatar.css";

interface AvatarProps {
  state: AvatarState;
  color: string;
  size?: "sm" | "md" | "lg";
  appearance?: AvatarAppearance;
}

const SIZES = {
  sm: 0.5,
  md: 1,
  lg: 1.5,
};

const DEFAULT_APPEARANCE: AvatarAppearance = {
  species: "human",
  bodyShape: "round",
  eyeStyle: "dots",
  mouthStyle: "smile",
  earStyle: "none",
  accessory: "none",
  hairStyle: "none",
  skinColor: "#FDDCB5",
  bodyColor: "#4F46E5",
};

// Map AvatarState to animation key
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

/* ---------- Eye Renderer ---------- */
function Eyes({ variant }: { variant: AvatarFrame["eyeVariant"] }) {
  switch (variant) {
    case "open":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--dot" />
          <div className="av-eye av-eye--dot" />
        </div>
      );
    case "wide":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--wide"><div className="av-pupil" /></div>
          <div className="av-eye av-eye--wide"><div className="av-pupil" /></div>
        </div>
      );
    case "closed":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--closed" />
          <div className="av-eye av-eye--closed" />
        </div>
      );
    case "half":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--half" />
          <div className="av-eye av-eye--half" />
        </div>
      );
    case "up-left":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--wide"><div className="av-pupil av-pupil--up-left" /></div>
          <div className="av-eye av-eye--wide"><div className="av-pupil av-pupil--up-left" /></div>
        </div>
      );
    case "up-right":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--wide"><div className="av-pupil av-pupil--up-right" /></div>
          <div className="av-eye av-eye--wide"><div className="av-pupil av-pupil--up-right" /></div>
        </div>
      );
    case "squeezed":
      return (
        <div className="av-eyes">
          <div className="av-eye av-eye--squeezed" />
          <div className="av-eye av-eye--squeezed" />
        </div>
      );
  }
}

/* ---------- Mouth Renderer ---------- */
function Mouth({ variant }: { variant: AvatarFrame["mouthVariant"] }) {
  return <div className={`av-mouth av-mouth--${variant}`} />;
}

/* ---------- Effects ---------- */
function Effects({ frame }: { frame: AvatarFrame }) {
  return (
    <>
      {frame.zzz && <span className="av-zzz">{"\ud83d\udca4"}</span>}
      {frame.sparkle && <span className="av-sparkle">{"\u2728"}</span>}
      {frame.blush && (
        <>
          <span className="av-blush av-blush--left" />
          <span className="av-blush av-blush--right" />
        </>
      )}
      {frame.sweatDrop && <span className="av-sweat">{"\ud83d\udca7"}</span>}
    </>
  );
}

/* ---------- Accessory ---------- */
function AccessoryLayer({ type, color }: { type: AvatarAppearance["accessory"]; color: string; bounce: number }) {
  switch (type) {
    case "none": return null;
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
      return <div className="av-accessory av-halo" />;
    case "glasses":
      return (
        <div className="av-accessory av-glasses">
          <div className="av-glasses__lens" />
          <div className="av-glasses__bridge" />
          <div className="av-glasses__lens" />
        </div>
      );
  }
}

/* ---------- Ears ---------- */
function Ears({ style, skinColor }: { style: AvatarAppearance["earStyle"]; skinColor: string }) {
  if (style === "none") return null;
  return (
    <>
      <div className={`av-ear av-ear--${style} av-ear--left`} style={{ backgroundColor: skinColor }} />
      <div className={`av-ear av-ear--${style} av-ear--right`} style={{ backgroundColor: skinColor }} />
    </>
  );
}

/* ---------- Hair ---------- */
function Hair({ style, color }: { style: AvatarAppearance["hairStyle"]; color: string }) {
  if (style === "none") return null;
  return <div className={`av-hair av-hair--${style}`} style={{ backgroundColor: color }} />;
}

/* ---------- Main Avatar ---------- */
export function Avatar({ state, color, size = "md", appearance }: AvatarProps) {
  const scale = SIZES[size];
  const ap = appearance ?? DEFAULT_APPEARANCE;
  const animKey = STATE_MAP[state] || "idle";
  const animation = ACTIVITY_ANIMATIONS[animKey] || ACTIVITY_ANIMATIONS.idle;

  // Get avatar resolution based on gamification level
  const gamData = getGamification();
  const res = getAvatarResolution(gamData.level);

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

  const bodyColor = ap.bodyColor || color;
  const skinColor = ap.skinColor || "#FDDCB5";

  // Resolution-scaled styles
  const borderWidth = res.pixelSize >= 10 ? 6 : res.pixelSize >= 6 ? 4 : 3;
  const borderRadius = res.pixelSize >= 10 ? 8 : res.pixelSize >= 6 ? 12 : 16;

  return (
    <div
      className="avatar-container"
      style={{ transform: `scale(${scale})` }}
    >
      {res.showEars && <Ears style={ap.earStyle} skinColor={skinColor} />}
      {res.showHair && <Hair style={ap.hairStyle} color={bodyColor} />}
      {res.showAccessory && (
        <AccessoryLayer
          type={ap.accessory}
          color={bodyColor}
          bounce={currentFrame.accessoryBounce}
        />
      )}
      <div
        className={`avatar-body avatar-body--${ap.bodyShape}`}
        style={{
          backgroundColor: bodyColor,
          width: res.bodyWidth,
          height: res.bodyHeight,
          borderWidth,
          borderRadius,
          borderStyle: "solid",
          borderColor: "rgba(0, 0, 0, 0.25)",
          boxShadow: res.showShading
            ? `inset -${borderWidth}px -${borderWidth}px 0 rgba(0,0,0,0.15), inset ${borderWidth}px ${borderWidth}px 0 rgba(255,255,255,0.15)`
            : "none",
          transform: `translateX(${currentFrame.bodyOffsetX}px) translateY(${currentFrame.bodyOffsetY}px) rotate(${currentFrame.bodyRotation}deg)`,
          transition: `transform ${1 / animation.fps * 0.8}s ease-in-out`,
          imageRendering: res.pixelSize >= 8 ? "pixelated" as const : undefined,
        }}
      >
        {res.showShading && (
          <div className="av-pixel-border" style={{ borderColor: bodyColor }} />
        )}
        {/* Face area -- lighter skin tone */}
        {res.showSkin && (
          <div className="av-face" style={{ backgroundColor: skinColor }} />
        )}
        {res.showEyes && <Eyes variant={currentFrame.eyeVariant} />}
        {res.showMouth && <Mouth variant={currentFrame.mouthVariant} />}
        {res.showParticles && <Effects frame={currentFrame} />}
        {res.showBlush && currentFrame.blush && (
          <>
            <span className="av-blush av-blush--left" />
            <span className="av-blush av-blush--right" />
          </>
        )}
      </div>
    </div>
  );
}
