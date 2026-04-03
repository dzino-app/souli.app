"use client";

import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import { PixelAvatar } from "./pixel-avatar";

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

interface AvatarMiniProps {
  state: AvatarState;
  color: string;
  appearance?: AvatarAppearance;
}

export function AvatarMini({ state, appearance }: AvatarMiniProps) {
  return <PixelAvatar state={state} size="sm" appearance={appearance ?? DEFAULT_APPEARANCE} />;
}
