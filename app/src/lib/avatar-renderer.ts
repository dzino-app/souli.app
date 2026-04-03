/**
 * Client-side avatar renderer.
 *
 * Renders all animation frames for every activity to an offscreen canvas,
 * returning PNG data URLs. These are then uploaded to Supabase Storage
 * so the gallery can display static images without client-side pixel rendering.
 */

import type { AvatarAppearance } from "./avatar";
import type { AvatarState } from "./avatar";
import { getResolution, generateCharacter, type PixelGrid } from "./pixel-art";
import {
  ACTIVITY_ANIMATIONS,
  type AvatarFrame,
} from "@/components/avatar/avatar-frames";

/** All avatar activities we render */
const ALL_ACTIVITIES: AvatarState[] = [
  "idle",
  "happy",
  "sad",
  "walking",
  "talking",
  "thinking",
  "waving",
  "eating",
  "sleeping",
];

/** Size in physical pixels for the rendered PNG */
const RENDER_SIZE = 240;

export interface RenderedAvatarAssets {
  /** data:image/png of idle frame 0 */
  preview: string;
  /** activity name -> array of data:image/png frame URLs */
  activities: Record<string, string[]>;
}

/**
 * Render a pixel grid to a canvas data URL.
 */
function renderGridToDataUrl(
  grid: PixelGrid,
  resolution: number,
  frame: AvatarFrame,
  renderSize: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = renderSize;
  canvas.height = renderSize;
  const ctx = canvas.getContext("2d")!;

  const pixelSize = renderSize / resolution;

  // Apply frame transform (offset + rotation)
  const offsetX = frame.bodyOffsetX * (pixelSize / 8);
  const offsetY = frame.bodyOffsetY * (pixelSize / 8);

  ctx.save();
  ctx.translate(renderSize / 2, renderSize / 2);
  ctx.rotate((frame.bodyRotation * Math.PI) / 180);
  ctx.translate(-renderSize / 2 + offsetX, -renderSize / 2 + offsetY);

  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const color = grid[row]?.[col];
      if (color) {
        ctx.fillStyle = color;

        // Match pixel-avatar border radius: round corners at higher resolutions
        const borderRadius =
          resolution >= 16 ? 2 : resolution >= 12 ? 1 : 0;

        if (borderRadius > 0) {
          const x = col * pixelSize;
          const y = row * pixelSize;
          ctx.beginPath();
          ctx.roundRect(x, y, pixelSize, pixelSize, borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  ctx.restore();

  return canvas.toDataURL("image/png");
}

/**
 * Render all animation frames for all activities.
 * Must run in the browser (uses canvas).
 */
export function renderAvatarFrames(
  appearance: AvatarAppearance,
  level: number,
): RenderedAvatarAssets {
  const resolution = getResolution(level);

  const activities: Record<string, string[]> = {};
  let preview = "";

  for (const activity of ALL_ACTIVITIES) {
    const animation = ACTIVITY_ANIMATIONS[activity];
    if (!animation) continue;

    const frameUrls: string[] = [];

    for (let i = 0; i < animation.frames.length; i++) {
      const frame = animation.frames[i];
      const grid = generateCharacter(appearance, resolution, frame, level);
      const dataUrl = renderGridToDataUrl(grid, resolution, frame, RENDER_SIZE);
      frameUrls.push(dataUrl);

      // First frame of idle = preview thumbnail
      if (activity === "idle" && i === 0) {
        preview = dataUrl;
      }
    }

    activities[activity] = frameUrls;
  }

  return { preview, activities };
}

/**
 * Convert a data URL to a Blob for upload.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
