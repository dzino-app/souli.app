/**
 * Generate a shareable 1080x1080 card image for quiz results.
 * Renders the Souli pixel art + personality type onto a canvas.
 */

import type { AvatarAppearance } from "./avatar";
import { getResolution, generateCharacter } from "./pixel-art";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";
import type { SouliType } from "./souli-types";

/**
 * Draw the quiz result card and return a Blob (PNG).
 */
export async function generateShareImage(
  appearance: AvatarAppearance,
  souliType: SouliType,
  typeName: string,
  typeDesc: string,
): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#0f0f23");
  gradient.addColorStop(0.5, "#1a1a3e");
  gradient.addColorStop(1, "#0f0f23");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Decorative dots pattern
  ctx.globalAlpha = 0.08;
  for (let x = 0; x < size; x += 40) {
    for (let y = 0; y < size; y += 40) {
      ctx.fillStyle = souliType.bodyColor;
      ctx.fillRect(x, y, 4, 4);
    }
  }
  ctx.globalAlpha = 1;

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("What Souli are you?", size / 2, 100);

  // Draw the avatar pixels
  const level = 10; // show a nice detailed version
  const resolution = getResolution(level);
  const idleFrame = ACTIVITY_ANIMATIONS.idle.frames[0];
  const grid = generateCharacter(appearance, resolution, idleFrame, level);

  const avatarSize = 400;
  const pixelSize = avatarSize / resolution;
  const avatarX = (size - avatarSize) / 2;
  const avatarY = 160;

  // Glow behind avatar
  ctx.save();
  ctx.shadowColor = souliType.bodyColor;
  ctx.shadowBlur = 60;
  ctx.fillStyle = souliType.bodyColor + "30";
  ctx.beginPath();
  ctx.arc(size / 2, avatarY + avatarSize / 2, avatarSize / 2 + 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Render pixel grid
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const color = grid[row][col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          avatarX + col * pixelSize,
          avatarY + row * pixelSize,
          pixelSize + 0.5,
          pixelSize + 0.5,
        );
      }
    }
  }

  // Personality type emoji + name
  const nameY = avatarY + avatarSize + 80;
  ctx.font = "72px system-ui, -apple-system, sans-serif";
  ctx.fillText(souliType.emoji, size / 2, nameY);

  ctx.fillStyle = souliType.bodyColor;
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  ctx.fillText(typeName, size / 2, nameY + 70);

  // Description (wrapped)
  ctx.fillStyle = "#b0b0d0";
  ctx.font = "32px system-ui, -apple-system, sans-serif";
  const words = typeDesc.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > size - 160) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const descY = nameY + 120;
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, descY + i * 44);
  });

  // Footer URL
  ctx.fillStyle = "#ffffff60";
  ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
  ctx.fillText("dzino.app/quiz", size / 2, size - 60);

  // Dzino logo
  ctx.fillStyle = souliType.bodyColor;
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("Dzino", size / 2, size - 110);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate share image"));
    }, "image/png");
  });
}
