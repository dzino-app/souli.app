"use client";

/**
 * Render a pixel Souli to a PNG data URL suitable for WebGL texture.
 */

import type { AvatarAppearance } from "@/lib/avatar";
import { renderAvatarFrames } from "@/lib/avatar-renderer";

export function avatarToTexture(
  appearance: AvatarAppearance,
  level: number,
): string {
  const assets = renderAvatarFrames(appearance, level);
  return assets.preview;
}
