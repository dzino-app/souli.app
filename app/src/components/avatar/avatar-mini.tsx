"use client";

import type { AvatarState, AvatarAppearance } from "@/lib/avatar";
import { Avatar } from "./avatar";

interface AvatarMiniProps {
  state: AvatarState;
  color: string;
  appearance?: AvatarAppearance;
}

export function AvatarMini({ state, color, appearance }: AvatarMiniProps) {
  return <Avatar state={state} color={color} size="sm" appearance={appearance} />;
}
