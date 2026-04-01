// Pre-rendered avatar frame cache
// Each activity has an array of data URL images (like GIF frames)
// Regenerated whenever appearance changes

import type { AvatarAppearance } from "./avatar";
import type { AvatarFrame } from "@/components/avatar/avatar-frames";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";

export interface CachedActivityFrames {
  dataUrls: string[]; // array of data:image/png;base64,... per frame
  fps: number;
  loop: boolean;
}

export interface AvatarFrameCache {
  appearance: AvatarAppearance; // the appearance these were generated for
  activities: Record<string, CachedActivityFrames>;
  generatedAt: string;
}

const STORAGE_KEY = "dzino_avatar_frames";

export function getFrameCache(): AvatarFrameCache | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveFrameCache(cache: AvatarFrameCache) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function clearFrameCache() {
  localStorage.removeItem(STORAGE_KEY);
}

// Check if cache matches current appearance
export function isCacheValid(appearance: AvatarAppearance): boolean {
  const cache = getFrameCache();
  if (!cache) return false;
  return JSON.stringify(cache.appearance) === JSON.stringify(appearance);
}

// Render a single avatar frame to a canvas and return data URL
function renderFrameToDataUrl(
  appearance: AvatarAppearance,
  frame: AvatarFrame,
  size: number = 120
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const cx = size / 2;
  const bodyW = appearance.bodyShape === "tall" ? size * 0.45 : size * 0.55;
  const bodyH = appearance.bodyShape === "tall" ? size * 0.65 : size * 0.55;
  const bodyX = cx - bodyW / 2 + frame.bodyOffsetX;
  const bodyY = size - bodyH - 8 + frame.bodyOffsetY;
  const bodyR = appearance.bodyShape === "square" ? 4 : appearance.bodyShape === "tall" ? 8 : 14;

  ctx.save();
  ctx.translate(cx, bodyY + bodyH / 2);
  ctx.rotate((frame.bodyRotation * Math.PI) / 180);
  ctx.translate(-cx, -(bodyY + bodyH / 2));

  // Ears
  const earColor = appearance.skinColor;
  if (appearance.earStyle === "pointy") {
    ctx.fillStyle = earColor;
    // Left ear
    ctx.beginPath();
    ctx.moveTo(bodyX - 2, bodyY + 20);
    ctx.lineTo(bodyX + 6, bodyY - 12);
    ctx.lineTo(bodyX + 14, bodyY + 20);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW - 14, bodyY + 20);
    ctx.lineTo(bodyX + bodyW - 6, bodyY - 12);
    ctx.lineTo(bodyX + bodyW + 2, bodyY + 20);
    ctx.closePath();
    ctx.fill();
  } else if (appearance.earStyle === "round" || appearance.earStyle === "bear") {
    ctx.fillStyle = earColor;
    const earSize = appearance.earStyle === "bear" ? 14 : 12;
    ctx.beginPath();
    ctx.arc(bodyX + 4, bodyY + 6, earSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bodyX + bodyW - 4, bodyY + 6, earSize, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.earStyle === "floppy") {
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.ellipse(bodyX - 6, bodyY + 30, 8, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW + 6, bodyY + 30, 8, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body
  ctx.fillStyle = appearance.bodyColor;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, bodyR);
  ctx.fill();

  // Body shadow (3D effect)
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  roundRect(ctx, bodyX + bodyW * 0.6, bodyY, bodyW * 0.4, bodyH, bodyR);
  ctx.fill();

  // Body highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  roundRect(ctx, bodyX, bodyY, bodyW * 0.35, bodyH, bodyR);
  ctx.fill();

  // Face area
  const faceW = bodyW * 0.65;
  const faceH = bodyH * 0.5;
  const faceX = cx - faceW / 2;
  const faceY = bodyY + bodyH * 0.2;
  ctx.fillStyle = appearance.skinColor;
  roundRect(ctx, faceX, faceY, faceW, faceH, bodyR * 0.8);
  ctx.fill();

  // Eyes
  const eyeY = faceY + faceH * 0.35;
  const eyeGap = faceW * 0.28;
  drawEyes(ctx, cx - eyeGap, eyeY, cx + eyeGap, eyeY, frame.eyeVariant);

  // Mouth
  const mouthY = faceY + faceH * 0.72;
  drawMouth(ctx, cx, mouthY, frame.mouthVariant);

  // Blush
  if (frame.blush) {
    ctx.fillStyle = "rgba(244,114,182,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx - eyeGap - 4, eyeY + 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + eyeGap + 4, eyeY + 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hair
  if (appearance.hairStyle === "spiky") {
    ctx.fillStyle = appearance.bodyColor;
    for (let i = 0; i < 5; i++) {
      const x = bodyX + bodyW * 0.2 + i * (bodyW * 0.15);
      ctx.beginPath();
      ctx.moveTo(x - 4, bodyY + 4);
      ctx.lineTo(x, bodyY - 10 - Math.random() * 6);
      ctx.lineTo(x + 4, bodyY + 4);
      ctx.closePath();
      ctx.fill();
    }
  } else if (appearance.hairStyle === "tuft") {
    ctx.fillStyle = appearance.bodyColor;
    ctx.beginPath();
    ctx.arc(cx, bodyY, 12, Math.PI, 0);
    ctx.fill();
  } else if (appearance.hairStyle === "bangs") {
    ctx.fillStyle = appearance.bodyColor;
    roundRect(ctx, bodyX + 6, bodyY - 2, bodyW - 12, 14, 4);
    ctx.fill();
  }

  ctx.restore();

  // Effects (outside rotation)
  if (frame.zzz) {
    ctx.font = "14px serif";
    ctx.fillText("💤", size - 24, 16);
  }
  if (frame.sparkle) {
    ctx.font = "12px serif";
    ctx.fillText("✨", size - 22, 14);
  }

  return canvas.toDataURL("image/png");
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  lx: number, ly: number,
  rx: number, ry: number,
  variant: AvatarFrame["eyeVariant"]
) {
  ctx.fillStyle = "#1a1a2e";
  switch (variant) {
    case "open":
      ctx.fillRect(lx - 3, ly - 3, 6, 6);
      ctx.fillRect(rx - 3, ry - 3, 6, 6);
      break;
    case "wide":
      ctx.fillStyle = "#fff";
      ctx.fillRect(lx - 6, ly - 5, 12, 10);
      ctx.fillRect(rx - 6, ry - 5, 12, 10);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(lx - 2, ly, 5, 5);
      ctx.fillRect(rx - 2, ry, 5, 5);
      break;
    case "closed":
      ctx.fillRect(lx - 5, ly, 10, 2);
      ctx.fillRect(rx - 5, ry, 10, 2);
      break;
    case "half":
      ctx.fillRect(lx - 5, ly - 1, 10, 4);
      ctx.fillRect(rx - 5, ry - 1, 10, 4);
      break;
    case "up-left":
      ctx.fillStyle = "#fff";
      ctx.fillRect(lx - 6, ly - 5, 12, 10);
      ctx.fillRect(rx - 6, ry - 5, 12, 10);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(lx - 5, ly - 4, 5, 5);
      ctx.fillRect(rx - 5, ry - 4, 5, 5);
      break;
    case "up-right":
      ctx.fillStyle = "#fff";
      ctx.fillRect(lx - 6, ly - 5, 12, 10);
      ctx.fillRect(rx - 6, ry - 5, 12, 10);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(lx + 1, ly - 4, 5, 5);
      ctx.fillRect(rx + 1, ry - 4, 5, 5);
      break;
    case "squeezed":
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI, false);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI, false);
      ctx.fill();
      break;
  }
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  variant: AvatarFrame["mouthVariant"]
) {
  ctx.fillStyle = "#1a1a2e";
  switch (variant) {
    case "smile":
      ctx.beginPath();
      ctx.arc(x, y - 2, 7, 0.1, Math.PI - 0.1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a1a2e";
      ctx.stroke();
      break;
    case "big-smile":
      ctx.beginPath();
      ctx.arc(x, y - 2, 10, 0.1, Math.PI - 0.1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a1a2e";
      ctx.stroke();
      break;
    case "open":
      ctx.fillRect(x - 5, y - 4, 10, 8);
      break;
    case "o-shape":
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "frown":
      ctx.beginPath();
      ctx.arc(x, y + 4, 7, Math.PI + 0.1, -0.1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a1a2e";
      ctx.stroke();
      break;
    case "closed":
      ctx.fillRect(x - 6, y - 1, 12, 2);
      break;
    case "tongue":
      ctx.fillRect(x - 5, y - 3, 10, 6);
      ctx.fillStyle = "#f472b6";
      ctx.beginPath();
      ctx.arc(x, y + 5, 4, 0, Math.PI);
      ctx.fill();
      break;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Generate and cache all activity frames for an appearance
export function generateAllFrames(appearance: AvatarAppearance): AvatarFrameCache {
  const activities: Record<string, CachedActivityFrames> = {};

  for (const [key, animation] of Object.entries(ACTIVITY_ANIMATIONS)) {
    const dataUrls = animation.frames.map((frame) =>
      renderFrameToDataUrl(appearance, frame)
    );
    activities[key] = {
      dataUrls,
      fps: animation.fps,
      loop: animation.loop,
    };
  }

  const cache: AvatarFrameCache = {
    appearance,
    activities,
    generatedAt: new Date().toISOString(),
  };

  saveFrameCache(cache);
  return cache;
}
