/**
 * Weekly Souli Report — share image generator.
 *
 * Renders a 1080x1920 (Instagram Stories) PNG card using canvas.
 * Features the pixel avatar, stats grid, and dzino.app branding.
 */

import type { WeeklyReportData } from "./weekly-report";
import type { AvatarAppearance } from "./avatar";
import { getResolution, generateCharacter } from "./pixel-art";
import { ACTIVITY_ANIMATIONS } from "@/components/avatar/avatar-frames";

const W = 1080;
const H = 1920;

// --- Colors ---
const BG_TOP = "#0f0a1e";
const BG_BOTTOM = "#1a1035";
const ACCENT = "#a78bfa"; // primary violet
const ACCENT_GLOW = "rgba(167, 139, 250, 0.15)";
const TEXT_PRIMARY = "#f5f5f5";
const TEXT_SECONDARY = "#a1a1aa";
const TEXT_MUTED = "#71717a";
const CARD_BG = "rgba(255, 255, 255, 0.06)";
const CARD_BORDER = "rgba(255, 255, 255, 0.08)";

// --- Helpers ---

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawGradientBg(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, BG_TOP);
  grad.addColorStop(0.5, BG_BOTTOM);
  grad.addColorStop(1, BG_TOP);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow behind avatar area
  const radial = ctx.createRadialGradient(W / 2, 420, 50, W / 2, 420, 400);
  radial.addColorStop(0, "rgba(167, 139, 250, 0.20)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);
}

function drawPixelAvatar(
  ctx: CanvasRenderingContext2D,
  appearance: AvatarAppearance,
  level: number,
  cx: number,
  cy: number,
  size: number,
) {
  const resolution = getResolution(level);
  const idleAnim = ACTIVITY_ANIMATIONS["idle"];
  const frame = idleAnim ? idleAnim.frames[0] : ACTIVITY_ANIMATIONS.idle.frames[0];
  const grid = generateCharacter(appearance, resolution, frame, level);
  const pixelSize = size / resolution;

  // Glow behind avatar
  ctx.save();
  const avatarGlow = ctx.createRadialGradient(cx, cy, size * 0.3, cx, cy, size * 0.8);
  avatarGlow.addColorStop(0, "rgba(167, 139, 250, 0.25)");
  avatarGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = avatarGlow;
  ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
  ctx.restore();

  const startX = cx - size / 2;
  const startY = cy - size / 2;

  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const color = grid[row]?.[col];
      if (color) {
        ctx.fillStyle = color;
        const x = startX + col * pixelSize;
        const y = startY + row * pixelSize;
        const borderRadius = resolution >= 16 ? 4 : resolution >= 12 ? 2 : 0;
        if (borderRadius > 0) {
          roundRect(ctx, x, y, pixelSize, pixelSize, borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }
  }
}

function moodEmoji(avg: number): string {
  if (avg >= 4.5) return "\u{1F929}"; // star eyes
  if (avg >= 3.5) return "\u{1F60A}"; // smiling
  if (avg >= 2.5) return "\u{1F610}"; // neutral
  if (avg >= 1.5) return "\u{1F614}"; // pensive
  return "\u{1F622}"; // crying
}

function moodTrendEmoji(trend: "up" | "down" | "stable"): string {
  if (trend === "up") return "\u2197\uFE0F"; // trending up
  if (trend === "down") return "\u2198\uFE0F"; // trending down
  return "\u27A1\uFE0F"; // right arrow (stable)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface StatItem {
  emoji: string;
  value: string;
  label: string;
}

function drawStatCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stat: StatItem,
) {
  // Card background
  ctx.fillStyle = CARD_BG;
  roundRect(ctx, x, y, w, h, 24);
  ctx.fill();

  // Card border
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 24);
  ctx.stroke();

  // Emoji
  ctx.font = "48px serif";
  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.fillText(stat.emoji, x + w / 2, y + 60);

  // Value
  ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.fillText(stat.value, x + w / 2, y + 120);

  // Label
  ctx.font = "26px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = TEXT_SECONDARY;
  ctx.fillText(stat.label, x + w / 2, y + 158);
}

/**
 * Generate a 1080x1920 PNG share image for the weekly report.
 * Must run in browser (uses canvas).
 */
export function generateReportImage(data: WeeklyReportData): Blob {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 1. Background
  drawGradientBg(ctx);

  // 2. Decorative floating pixels (subtle)
  ctx.globalAlpha = 0.06;
  const decorPixels = [
    [80, 200, 12], [960, 340, 8], [150, 1500, 10], [900, 1600, 6],
    [200, 1100, 8], [850, 900, 10], [100, 800, 6], [950, 1200, 8],
  ];
  for (const [px, py, ps] of decorPixels) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(px, py, ps, ps);
  }
  ctx.globalAlpha = 1;

  // 3. Date range at top
  const dateRangeText = `${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`;
  ctx.font = "28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText(dateRangeText, W / 2, 100);

  // 4. "WEEKLY REPORT" badge
  const badgeText = "WEEKLY REPORT";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 48;
  const badgeX = (W - badgeWidth) / 2;
  const badgeY = 120;

  ctx.fillStyle = "rgba(167, 139, 250, 0.15)";
  roundRect(ctx, badgeX, badgeY, badgeWidth, 40, 20);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText(badgeText, W / 2, badgeY + 28);

  // 5. Pixel avatar (large, centered)
  const avatarSize = 320;
  const avatarCy = 380;
  drawPixelAvatar(ctx, data.avatarAppearance, data.level, W / 2, avatarCy, avatarSize);

  // 6. Avatar name
  ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.fillText(data.avatarName, W / 2, avatarCy + avatarSize / 2 + 60);

  // Level badge below name
  const levelText = `Level ${data.level}`;
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
  const lvlWidth = ctx.measureText(levelText).width + 40;
  const lvlX = (W - lvlWidth) / 2;
  const lvlY = avatarCy + avatarSize / 2 + 80;

  ctx.fillStyle = ACCENT_GLOW;
  roundRect(ctx, lvlX, lvlY, lvlWidth, 44, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(167, 139, 250, 0.3)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, lvlX, lvlY, lvlWidth, 44, 22);
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText(levelText, W / 2, lvlY + 31);

  // 7. Stats grid (2 columns, 3 rows)
  const stats: StatItem[] = [
    {
      emoji: "\u{1F4AC}",
      value: String(data.totalMessages),
      label: "Messages",
    },
    {
      emoji: "\u{1F4D6}",
      value: String(data.soulChanges),
      label: "Things learned",
    },
    {
      emoji: moodEmoji(data.moodAverage),
      value: data.moodAverage > 0 ? data.moodAverage.toFixed(1) : "--",
      label: `Mood ${moodTrendEmoji(data.moodTrend)}`,
    },
    {
      emoji: "\u{1F525}",
      value: String(data.streakDays),
      label: "Day streak",
    },
    {
      emoji: "\u{2B50}",
      value: String(data.level),
      label: "Level",
    },
    {
      emoji: "\u{26A1}",
      value: `+${data.xpGained}`,
      label: "XP gained",
    },
  ];

  const gridStartY = lvlY + 80;
  const cardW = 460;
  const cardH = 180;
  const gapX = 40;
  const gapY = 24;
  const gridStartX = (W - cardW * 2 - gapX) / 2;

  for (let i = 0; i < stats.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridStartX + col * (cardW + gapX);
    const y = gridStartY + row * (cardH + gapY);
    drawStatCard(ctx, x, y, cardW, cardH, stats[i]);
  }

  // 8. Top topics section (if any)
  const topicsY = gridStartY + 3 * (cardH + gapY) + 20;
  if (data.topTopics.length > 0) {
    ctx.font = "26px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = TEXT_MUTED;
    ctx.textAlign = "center";
    ctx.fillText("Top soul updates", W / 2, topicsY);

    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = TEXT_SECONDARY;
    const topicStr = data.topTopics.join("  \u00B7  ");
    ctx.fillText(topicStr, W / 2, topicsY + 44);
  }

  // 9. Watermark & tagline at bottom
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText("dzino.app", W / 2, H - 120);

  ctx.font = "26px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = TEXT_MUTED;
  ctx.fillText("Raise your own Souli", W / 2, H - 76);

  // 10. Convert to blob
  // canvas.toBlob is async, but we can use toDataURL synchronously
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrlToBlob(dataUrl);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
