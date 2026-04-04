"use client";

/**
 * Generate animated GIFs from pixel avatar frames.
 * Canvas is auto-sized to fit the avatar across ALL frames (no cropping).
 */

import { encodeAnimatedGif } from "./gif-encoder";
import type { AvatarAppearance, AvatarState } from "./avatar";
import { getResolution, generateCharacter } from "./pixel-art";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";
import type { AvatarFrame } from "@/components/avatar/avatar-frames";

const BASE_SIZE = 200; // base avatar render size (pixels)

/**
 * Calculate the bounding box needed across all frames of an animation.
 * Returns the total canvas size that ensures no frame is ever cropped.
 */
function calculateCanvasSize(
  frames: AvatarFrame[],
  resolution: number,
): number {
  const pixelSize = BASE_SIZE / resolution;
  let maxExtent = BASE_SIZE / 2; // half-size from center

  for (const frame of frames) {
    const offsetX = Math.abs(frame.bodyOffsetX * (pixelSize / 8));
    const offsetY = Math.abs(frame.bodyOffsetY * (pixelSize / 8));
    const rotRad = Math.abs(frame.bodyRotation * Math.PI) / 180;

    // Rotation expands the bounding box: rotated square corner distance
    const diagonal = (BASE_SIZE / 2) * Math.SQRT2;
    const rotExpand = diagonal * Math.sin(rotRad + Math.PI / 4);

    const extent = Math.max(
      BASE_SIZE / 2 + offsetX,
      BASE_SIZE / 2 + offsetY,
      rotExpand + Math.max(offsetX, offsetY),
    );
    maxExtent = Math.max(maxExtent, extent);
  }

  // Round up to even number, add small padding
  return Math.ceil(maxExtent * 2) + 16;
}

function renderFrameToImageData(
  appearance: AvatarAppearance,
  level: number,
  frame: AvatarFrame,
  canvasSize: number,
): ImageData {
  const resolution = getResolution(level);
  const grid = generateCharacter(appearance, resolution, frame, level);
  const pixelSize = BASE_SIZE / resolution;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const offsetX = frame.bodyOffsetX * (pixelSize / 8);
  const offsetY = frame.bodyOffsetY * (pixelSize / 8);

  // Center the avatar in the (potentially larger) canvas
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((frame.bodyRotation * Math.PI) / 180);
  ctx.translate(-BASE_SIZE / 2 + offsetX, -BASE_SIZE / 2 + offsetY);

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

  return ctx.getImageData(0, 0, canvasSize, canvasSize);
}

export async function generateAvatarGif(
  appearance: AvatarAppearance,
  level: number,
  activity: AvatarState,
): Promise<Blob> {
  const animation = ACTIVITY_ANIMATIONS[activity] || ACTIVITY_ANIMATIONS.idle;
  const delay = Math.round(1000 / animation.fps);
  const resolution = getResolution(level);
  const canvasSize = calculateCanvasSize(animation.frames, resolution);

  const frames = animation.frames.map((frame) => ({
    imageData: renderFrameToImageData(appearance, level, frame, canvasSize),
    delay,
  }));

  const gif = encodeAnimatedGif(frames, canvasSize, canvasSize);
  return new Blob([gif.buffer as ArrayBuffer], { type: "image/gif" });
}

export async function downloadAvatarGif(
  name: string,
  appearance: AvatarAppearance,
  level: number,
  activity: AvatarState,
) {
  const blob = await generateAvatarGif(appearance, level, activity);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${activity}.gif`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareAvatarGif(
  name: string,
  appearance: AvatarAppearance,
  level: number,
  activity: AvatarState,
): Promise<boolean> {
  const blob = await generateAvatarGif(appearance, level, activity);
  const file = new File([blob], `${name}-${activity}.gif`, { type: "image/gif" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${name} — ${activity}`,
        text: `Check out ${name}'s ${activity} on Dzino!`,
      });
      return true;
    } catch {
      // User cancelled or share failed
    }
  }

  downloadAvatarGif(name, appearance, level, activity);
  return false;
}

export async function uploadAvatarGif(
  avatarId: string,
  appearance: AvatarAppearance,
  level: number,
  activity: AvatarState,
): Promise<string | null> {
  try {
    const blob = await generateAvatarGif(appearance, level, activity);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const path = `gifs/${avatarId}/${activity}.gif`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, {
        contentType: "image/gif",
        upsert: true,
      });

    if (error) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
