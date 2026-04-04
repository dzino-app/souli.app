"use client";

/**
 * Generate animated GIFs from pixel avatar frames.
 * Uses modern-gif for encoding, canvas for rendering.
 */

import { encodeAnimatedGif } from "./gif-encoder";
import type { AvatarAppearance, AvatarState } from "./avatar";
import { getResolution, generateCharacter } from "./pixel-art";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";
import type { AvatarFrame } from "@/components/avatar/avatar-frames";

const GIF_SIZE = 240;

function renderFrameToImageData(
  appearance: AvatarAppearance,
  level: number,
  frame: AvatarFrame,
): ImageData {
  const resolution = getResolution(level);
  const grid = generateCharacter(appearance, resolution, frame, level);
  const pixelSize = GIF_SIZE / resolution;

  const canvas = document.createElement("canvas");
  canvas.width = GIF_SIZE;
  canvas.height = GIF_SIZE;
  const ctx = canvas.getContext("2d")!;

  // Transparent background
  ctx.clearRect(0, 0, GIF_SIZE, GIF_SIZE);

  // Apply frame transform
  const offsetX = frame.bodyOffsetX * (pixelSize / 8);
  const offsetY = frame.bodyOffsetY * (pixelSize / 8);

  ctx.save();
  ctx.translate(GIF_SIZE / 2, GIF_SIZE / 2);
  ctx.rotate((frame.bodyRotation * Math.PI) / 180);
  ctx.translate(-GIF_SIZE / 2 + offsetX, -GIF_SIZE / 2 + offsetY);

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

  return ctx.getImageData(0, 0, GIF_SIZE, GIF_SIZE);
}

export async function generateAvatarGif(
  appearance: AvatarAppearance,
  level: number,
  activity: AvatarState,
): Promise<Blob> {
  const animKey = activity;
  const animation = ACTIVITY_ANIMATIONS[animKey] || ACTIVITY_ANIMATIONS.idle;
  const delay = Math.round(1000 / animation.fps);

  const frames = animation.frames.map((frame) => ({
    imageData: renderFrameToImageData(appearance, level, frame),
    delay,
  }));

  const gif = encodeAnimatedGif(frames, GIF_SIZE, GIF_SIZE);
  return new Blob([gif.buffer as ArrayBuffer], { type: "image/gif" });
}

/**
 * Generate and trigger download of a GIF
 */
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

/**
 * Generate GIF and share via Web Share API (mobile messengers)
 */
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

  // Fallback: download
  downloadAvatarGif(name, appearance, level, activity);
  return false;
}

/**
 * Generate GIF and upload to Supabase Storage for public URL
 */
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
