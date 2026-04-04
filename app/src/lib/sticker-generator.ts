"use client";

/**
 * Generate 512x512 WebP stickers from pixel avatar.
 * Falls back to PNG if WebP is not supported.
 */

import type { AvatarAppearance, AvatarState } from "./avatar";
import { getResolution, generateCharacter } from "./pixel-art";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";

const STICKER_SIZE = 512;
const AVATAR_SIZE = 400; // avatar render area within the 512 sticker
const LABEL_AREA = 60; // pixels reserved for label at bottom

/**
 * Pick the most expressive frame from an animation for a static sticker.
 */
function getBestFrame(state: AvatarState) {
  const animation = ACTIVITY_ANIMATIONS[state] || ACTIVITY_ANIMATIONS.idle;
  // Pick the frame with the most visual expression (first non-neutral frame, or frame 0)
  return animation.frames[1] || animation.frames[0];
}

/**
 * Generate a 512x512 sticker as a Blob (WebP preferred, PNG fallback).
 */
export async function generateSticker(
  appearance: AvatarAppearance,
  level: number,
  state: AvatarState,
  label?: string,
): Promise<Blob> {
  const resolution = getResolution(level);
  const frame = getBestFrame(state);
  const grid = generateCharacter(appearance, resolution, frame, level);
  const pixelSize = AVATAR_SIZE / resolution;

  const canvas = document.createElement("canvas");
  canvas.width = STICKER_SIZE;
  canvas.height = STICKER_SIZE;
  const ctx = canvas.getContext("2d")!;

  // Transparent background
  ctx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);

  // Calculate vertical centering — shift up if there's a label
  const avatarAreaHeight = label ? STICKER_SIZE - LABEL_AREA : STICKER_SIZE;
  const centerX = STICKER_SIZE / 2;
  const centerY = avatarAreaHeight / 2;

  // Apply frame offsets
  const offsetX = frame.bodyOffsetX * (pixelSize / 8);
  const offsetY = frame.bodyOffsetY * (pixelSize / 8);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((frame.bodyRotation * Math.PI) / 180);
  ctx.translate(-AVATAR_SIZE / 2 + offsetX, -AVATAR_SIZE / 2 + offsetY);

  // Render pixel grid
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const color = grid[row]?.[col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
      }
    }
  }
  ctx.restore();

  // Draw label
  if (label) {
    const fontSize = 36;
    ctx.font = `bold ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labelY = STICKER_SIZE - LABEL_AREA / 2;

    // White outline for readability on any background
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.lineJoin = "round";
    ctx.strokeText(label, centerX, labelY);

    // Dark text fill
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(label, centerX, labelY);
  }

  // Convert to WebP (or PNG fallback)
  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // WebP not supported — fall back to PNG
          canvas.toBlob(
            (pngBlob) => resolve(pngBlob!),
            "image/png",
          );
        }
      },
      "image/webp",
      0.9,
    );
  });
}
