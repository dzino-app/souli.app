"use client";

/**
 * Generate 512x512 WebP stickers from pixel avatar.
 * Avatar is auto-scaled to fit all frame offsets/rotation — never cropped.
 */

import type { AvatarAppearance, AvatarState } from "./avatar";
import { getResolution, generateCharacter } from "./pixel-art";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";
import type { AvatarFrame } from "@/components/avatar/avatar-frames";

const STICKER_SIZE = 512;
const LABEL_AREA = 60;

function getBestFrame(state: AvatarState): AvatarFrame {
  const animation = ACTIVITY_ANIMATIONS[state] || ACTIVITY_ANIMATIONS.idle;
  return animation.frames[1] || animation.frames[0];
}

/**
 * Calculate the scale factor needed so the avatar + its offsets/rotation
 * fit within the available area without cropping.
 */
function calculateSafeScale(frame: AvatarFrame, resolution: number, availableSize: number): number {
  const baseSize = availableSize * 0.85; // start at 85% of available
  const pixelSize = baseSize / resolution;

  const offsetX = Math.abs(frame.bodyOffsetX * (pixelSize / 8));
  const offsetY = Math.abs(frame.bodyOffsetY * (pixelSize / 8));
  const rotRad = Math.abs(frame.bodyRotation * Math.PI) / 180;

  // Rotated bounding box: corner distance from center
  const halfSize = baseSize / 2;
  const diagonal = halfSize * Math.SQRT2;
  const rotExtent = diagonal * Math.sin(rotRad + Math.PI / 4);

  const maxExtent = Math.max(
    halfSize + offsetX,
    halfSize + offsetY,
    rotExtent + Math.max(offsetX, offsetY),
  );

  const maxAllowed = availableSize / 2 - 8; // 8px padding
  if (maxExtent > maxAllowed) {
    return (maxAllowed / maxExtent) * baseSize;
  }
  return baseSize;
}

export async function generateSticker(
  appearance: AvatarAppearance,
  level: number,
  state: AvatarState,
  label?: string,
): Promise<Blob> {
  const resolution = getResolution(level);
  const frame = getBestFrame(state);
  const grid = generateCharacter(appearance, resolution, frame, level);

  const avatarAreaHeight = label ? STICKER_SIZE - LABEL_AREA : STICKER_SIZE;
  const availableSize = Math.min(STICKER_SIZE, avatarAreaHeight);
  const renderSize = calculateSafeScale(frame, resolution, availableSize);
  const pixelSize = renderSize / resolution;

  const canvas = document.createElement("canvas");
  canvas.width = STICKER_SIZE;
  canvas.height = STICKER_SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);

  const centerX = STICKER_SIZE / 2;
  const centerY = avatarAreaHeight / 2;

  const offsetX = frame.bodyOffsetX * (pixelSize / 8);
  const offsetY = frame.bodyOffsetY * (pixelSize / 8);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((frame.bodyRotation * Math.PI) / 180);
  ctx.translate(-renderSize / 2 + offsetX, -renderSize / 2 + offsetY);

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
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.lineJoin = "round";
    ctx.strokeText(label, centerX, labelY);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(label, centerX, labelY);
  }

  // Watermark: souli.app in bottom-right corner
  ctx.font = `500 14px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillText("souli.app", STICKER_SIZE - 8, STICKER_SIZE - 4);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          canvas.toBlob((pngBlob) => resolve(pngBlob!), "image/png");
        }
      },
      "image/webp",
      0.9,
    );
  });
}
