/**
 * Pixel art generation for the Dzino avatar.
 *
 * Every level renders a cute, expressive character --
 * low levels use fewer, bigger pixels; high levels use more, smaller pixels.
 */

import type { AvatarAppearance } from "./avatar";
import type { AvatarFrame } from "@/components/avatar/avatar-frames";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** null = transparent pixel */
export type PixelGrid = (string | null)[][];

// ---------------------------------------------------------------------------
// Resolution mapping
// ---------------------------------------------------------------------------

export function getResolution(level: number): number {
  if (level <= 2) return 4;
  if (level <= 5) return 6;
  if (level <= 10) return 8;
  if (level <= 15) return 12;
  return 16;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function empty(size: number): PixelGrid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function set(grid: PixelGrid, r: number, c: number, color: string | null) {
  if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
    grid[r][c] = color;
  }
}

function fill(grid: PixelGrid, r: number, c: number, w: number, h: number, color: string | null) {
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      set(grid, r + dr, c + dc, color);
    }
  }
}

// ---------------------------------------------------------------------------
// Eye color
// ---------------------------------------------------------------------------
const EYE_COLOR = "#1a1a2e";
const EYE_HIGHLIGHT = "#ffffff";
const BLUSH_COLOR = "#f472b6";
const TEAR_COLOR = "#60a5fa";

// ---------------------------------------------------------------------------
// 4x4 grid (levels 1-2): Just a head -- round blob with face
// ---------------------------------------------------------------------------

function generate4x4(
  ap: AvatarAppearance,
  frame: AvatarFrame,
  level: number,
): PixelGrid {
  const g = empty(4);
  const C = ap.bodyColor;
  const Cd = darken(C, 30);

  // Fill body color
  fill(g, 0, 0, 4, 4, C);
  // Round the corners
  set(g, 0, 0, null);
  set(g, 0, 3, null);
  set(g, 3, 0, null);
  set(g, 3, 3, null);

  // Shading: bottom-right darker
  set(g, 2, 3, Cd);
  set(g, 3, 2, Cd);
  set(g, 3, 1, Cd);

  // Eyes on row 1 (always shown even at level 1 -- for cuteness)
  const ev = frame.eyeVariant;
  if (ev === "closed" || ev === "half") {
    // Sleepy: horizontal line eyes
    set(g, 1, 1, darken(EYE_COLOR, -40));
    set(g, 1, 2, darken(EYE_COLOR, -40));
  } else if (ev === "squeezed") {
    // Happy squint
    set(g, 1, 1, Cd);
    set(g, 1, 2, Cd);
  } else if (ev === "up-left" || ev === "up-right") {
    // Thinking: asymmetric
    set(g, 1, 1, EYE_COLOR);
    set(g, 0, 2, EYE_COLOR); // one eye higher (using corner pixel)
  } else {
    // Normal open eyes
    set(g, 1, 1, EYE_COLOR);
    set(g, 1, 2, EYE_COLOR);
  }

  // Mouth on row 2
  const mv = frame.mouthVariant;
  if (mv === "big-smile" || mv === "smile") {
    set(g, 2, 1, darken(C, 50));
    set(g, 2, 2, darken(C, 50));
  } else if (mv === "open" || mv === "o-shape") {
    set(g, 2, 1, EYE_COLOR);
    if (mv === "o-shape") {
      set(g, 2, 2, EYE_COLOR);
    }
  } else if (mv === "frown") {
    set(g, 2, 2, darken(C, 60));
  } else if (mv === "tongue") {
    set(g, 2, 1, EYE_COLOR);
    set(g, 2, 2, BLUSH_COLOR);
  } else {
    // closed mouth -- subtle line
    set(g, 2, 1, darken(C, 40));
  }

  // Species hint: color variation at top for ears
  if (ap.species === "cat" || ap.species === "fox") {
    set(g, 0, 0, darken(C, 15)); // pointy ear hints
    set(g, 0, 3, darken(C, 15));
  } else if (ap.species === "bunny") {
    set(g, 0, 1, lighten(C, 30)); // tall ear hints
    set(g, 0, 2, lighten(C, 30));
  } else if (ap.species === "bear") {
    set(g, 0, 0, lighten(C, 20)); // round ear hints
    set(g, 0, 3, lighten(C, 20));
  }

  // Blush
  if (frame.blush && level >= 2) {
    set(g, 2, 0, BLUSH_COLOR);
  }

  return g;
}

// ---------------------------------------------------------------------------
// 6x6 grid (levels 3-5): Head + body, species-specific ears
// ---------------------------------------------------------------------------

function generate6x6(
  ap: AvatarAppearance,
  frame: AvatarFrame,
  level: number,
): PixelGrid {
  const g = empty(6);
  const C = ap.bodyColor;
  const Cd = darken(C, 30);
  const Cl = lighten(C, 30);
  const S = ap.skinColor;

  // ---- Head (rows 0-3) ----
  // Rounded head shape
  set(g, 0, 1, C); set(g, 0, 2, C); set(g, 0, 3, C); set(g, 0, 4, C);
  fill(g, 1, 0, 6, 1, C);
  fill(g, 2, 0, 6, 1, C);
  set(g, 3, 1, C); set(g, 3, 2, C); set(g, 3, 3, C); set(g, 3, 4, C);

  // Skin color face area (rows 1-2 center)
  if (level >= 4) {
    set(g, 1, 2, S); set(g, 1, 3, S);
    set(g, 2, 2, S); set(g, 2, 3, S);
  }

  // Shading on head
  if (level >= 4) {
    set(g, 3, 4, Cd);
    set(g, 2, 5, Cd);
    set(g, 0, 1, Cl);
  }

  // ---- Eyes (row 1) ----
  const ev = frame.eyeVariant;
  if (ev === "closed" || ev === "half") {
    set(g, 1, 1, darken(EYE_COLOR, -40));
    set(g, 1, 4, darken(EYE_COLOR, -40));
  } else if (ev === "squeezed") {
    set(g, 1, 1, Cd);
    set(g, 1, 4, Cd);
  } else if (ev === "wide") {
    set(g, 1, 1, EYE_HIGHLIGHT);
    set(g, 1, 4, EYE_HIGHLIGHT);
    // pupils at bottom of eye (next row peek)
    set(g, 2, 1, EYE_COLOR);
    set(g, 2, 4, EYE_COLOR);
  } else if (ev === "up-left" || ev === "up-right") {
    set(g, 1, 1, EYE_COLOR);
    set(g, 1, 4, EYE_COLOR);
    // shift one higher
    set(g, 0, ev === "up-left" ? 1 : 4, EYE_HIGHLIGHT);
  } else {
    // Normal
    set(g, 1, 1, EYE_COLOR);
    set(g, 1, 4, EYE_COLOR);
  }

  // ---- Mouth (row 2) ----
  const mv = frame.mouthVariant;
  if (mv === "big-smile") {
    set(g, 2, 2, EYE_COLOR);
    set(g, 2, 3, EYE_COLOR);
  } else if (mv === "smile") {
    set(g, 2, 2, darken(C, 50));
    set(g, 2, 3, darken(C, 50));
  } else if (mv === "open" || mv === "o-shape") {
    set(g, 2, 2, EYE_COLOR);
    if (mv === "o-shape") set(g, 2, 3, EYE_COLOR);
  } else if (mv === "frown") {
    set(g, 2, 2, darken(C, 50));
    set(g, 2, 3, darken(C, 50));
  } else if (mv === "tongue") {
    set(g, 2, 2, EYE_COLOR);
    set(g, 2, 3, BLUSH_COLOR);
  } else {
    set(g, 2, 2, darken(C, 40));
  }

  // ---- Body (rows 4-5) ----
  set(g, 4, 2, C); set(g, 4, 3, C);
  set(g, 5, 2, C); set(g, 5, 3, C);
  // Body shading
  set(g, 5, 3, Cd);

  // ---- Species ears ----
  if (ap.species === "cat" || ap.species === "fox") {
    set(g, 0, 0, C);  // left pointy ear
    set(g, 0, 5, C);  // right pointy ear
  } else if (ap.species === "bunny") {
    // Tall ears above head -- use row 0 corners
    set(g, 0, 0, C);
    set(g, 0, 5, C);
    // Make inner ear different
    set(g, 0, 0, lighten(C, 40));
    set(g, 0, 5, lighten(C, 40));
  } else if (ap.species === "bear") {
    set(g, 0, 0, C);
    set(g, 0, 5, C);
  } else if (ap.species === "dog") {
    // Floppy ears on the sides
    set(g, 2, 0, Cd);
    set(g, 3, 0, Cd);
    set(g, 2, 5, Cd);
    set(g, 3, 5, Cd);
  }

  // ---- Accessory at level 5 ----
  if (level >= 5 && ap.accessory === "crown") {
    set(g, 0, 2, "#F59E0B");
    set(g, 0, 3, "#F59E0B");
  } else if (level >= 5 && ap.accessory === "halo") {
    set(g, 0, 2, "#FBBF24");
    set(g, 0, 3, "#FBBF24");
  }

  // ---- Blush ----
  if (frame.blush) {
    set(g, 2, 1, BLUSH_COLOR);
    set(g, 2, 4, BLUSH_COLOR);
  }

  return g;
}

// ---------------------------------------------------------------------------
// 8x8 grid (levels 6-10): Head + body + arms + legs
// ---------------------------------------------------------------------------

function generate8x8(
  ap: AvatarAppearance,
  frame: AvatarFrame,
  level: number,
): PixelGrid {
  const g = empty(8);
  const C = ap.bodyColor;
  const Cd = darken(C, 30);
  const Cl = lighten(C, 25);
  const S = ap.skinColor;
  const Sd = darken(S, 20);

  // ---- Head (rows 0-3) ----
  fill(g, 0, 2, 4, 1, C);  // top of head
  fill(g, 1, 1, 6, 1, C);  // face row 1
  fill(g, 2, 1, 6, 1, C);  // face row 2
  fill(g, 3, 2, 4, 1, C);  // bottom of head

  // Skin face area
  if (level >= 7) {
    set(g, 1, 2, S); set(g, 1, 3, S); set(g, 1, 4, S); set(g, 1, 5, S);
    set(g, 2, 2, S); set(g, 2, 3, S); set(g, 2, 4, S); set(g, 2, 5, S);
  }

  // Shading
  set(g, 3, 5, Cd);
  set(g, 2, 6, Cd);
  set(g, 0, 2, Cl);

  // ---- Eyes (row 1, cols 2 and 5) ----
  const ev = frame.eyeVariant;
  if (ev === "closed") {
    set(g, 1, 2, EYE_COLOR); set(g, 1, 3, EYE_COLOR);
    set(g, 1, 4, EYE_COLOR); set(g, 1, 5, EYE_COLOR);
  } else if (ev === "half") {
    set(g, 1, 3, EYE_COLOR);
    set(g, 1, 4, EYE_COLOR);
  } else if (ev === "squeezed") {
    // Happy squint - arc shape
    set(g, 1, 2, darken(C, 50)); set(g, 1, 3, darken(C, 50));
    set(g, 1, 4, darken(C, 50)); set(g, 1, 5, darken(C, 50));
  } else if (ev === "wide") {
    // Large eyes with highlight
    set(g, 1, 2, EYE_HIGHLIGHT); set(g, 1, 3, EYE_COLOR);
    set(g, 1, 4, EYE_HIGHLIGHT); set(g, 1, 5, EYE_COLOR);
  } else if (ev === "up-left") {
    set(g, 0, 2, EYE_COLOR); set(g, 1, 2, EYE_HIGHLIGHT);
    set(g, 0, 5, EYE_COLOR); set(g, 1, 5, EYE_HIGHLIGHT);
  } else if (ev === "up-right") {
    set(g, 0, 3, EYE_COLOR); set(g, 1, 3, EYE_HIGHLIGHT);
    set(g, 0, 4, EYE_COLOR); set(g, 1, 4, EYE_HIGHLIGHT);
  } else {
    // Normal open
    set(g, 1, 2, EYE_COLOR);
    set(g, 1, 5, EYE_COLOR);
  }

  // ---- Mouth (row 2) ----
  const mv = frame.mouthVariant;
  if (mv === "big-smile") {
    set(g, 2, 3, EYE_COLOR); set(g, 2, 4, EYE_COLOR);
    // Smile curves
    set(g, 2, 2, darken(C, 45)); set(g, 2, 5, darken(C, 45));
  } else if (mv === "smile") {
    set(g, 2, 3, darken(C, 50)); set(g, 2, 4, darken(C, 50));
  } else if (mv === "open") {
    set(g, 2, 3, EYE_COLOR); set(g, 2, 4, EYE_COLOR);
  } else if (mv === "o-shape") {
    set(g, 2, 3, EYE_COLOR);
  } else if (mv === "frown") {
    set(g, 2, 3, darken(C, 50)); set(g, 2, 4, darken(C, 50));
    set(g, 2, 2, Sd); set(g, 2, 5, Sd);
  } else if (mv === "tongue") {
    set(g, 2, 3, EYE_COLOR);
    set(g, 2, 4, BLUSH_COLOR);
  } else {
    // closed
    set(g, 2, 3, darken(C, 40));
    set(g, 2, 4, darken(C, 40));
  }

  // ---- Body (rows 4-5) ----
  fill(g, 4, 2, 4, 1, C);
  fill(g, 5, 2, 4, 1, C);
  // Body shading
  set(g, 5, 4, Cd); set(g, 5, 5, Cd);
  set(g, 4, 2, Cl);

  // ---- Arms (row 4, cols 0-1 and 6-7) ----
  const isWaving = frame.bodyRotation > 5 || frame.bodyRotation < -5;
  if (isWaving) {
    // Right arm up
    set(g, 3, 7, C);
    set(g, 4, 7, null);
    set(g, 4, 1, C);
  } else {
    set(g, 4, 1, C);
    set(g, 4, 6, C);
  }

  // ---- Legs (rows 6-7) ----
  const isWalking = frame.bodyOffsetX !== 0;
  if (isWalking && frame.bodyOffsetX > 0) {
    set(g, 6, 3, C); set(g, 7, 3, C);
    set(g, 6, 4, C); set(g, 7, 5, C);
  } else if (isWalking && frame.bodyOffsetX < 0) {
    set(g, 6, 3, C); set(g, 7, 2, C);
    set(g, 6, 4, C); set(g, 7, 4, C);
  } else {
    set(g, 6, 3, C); set(g, 7, 3, C);
    set(g, 6, 4, C); set(g, 7, 4, C);
  }

  // ---- Species ears ----
  if (ap.species === "cat" || ap.species === "fox") {
    set(g, 0, 1, C);
    set(g, 0, 6, C);
    // Inner ear lighter
    if (level >= 8) {
      set(g, 0, 1, lighten(C, 40));
      set(g, 0, 6, lighten(C, 40));
    }
  } else if (ap.species === "bunny") {
    // Tall ears
    set(g, 0, 2, lighten(C, 30));
    set(g, 0, 5, lighten(C, 30));
    // Could use accessory-row to make taller
  } else if (ap.species === "bear") {
    set(g, 0, 1, C);
    set(g, 0, 6, C);
  } else if (ap.species === "dog") {
    set(g, 2, 0, Cd);
    set(g, 3, 0, Cd);
    set(g, 2, 7, Cd);
    set(g, 3, 7, Cd);
  }

  // Tail at level 8+
  if (level >= 8 && (ap.species === "cat" || ap.species === "fox")) {
    set(g, 5, 7, C);
    set(g, 4, 7, Cl);
  } else if (level >= 8 && ap.species === "bunny") {
    set(g, 5, 6, lighten(C, 50));
  } else if (level >= 8 && ap.species === "dog") {
    set(g, 4, 7, Cd);
    set(g, 3, 7, Cd);
  }

  // ---- Accessory ----
  if (level >= 8 && ap.accessory === "crown") {
    set(g, 0, 3, "#F59E0B");
    set(g, 0, 4, "#F59E0B");
  } else if (level >= 8 && ap.accessory === "halo") {
    set(g, 0, 3, "#FBBF24");
    set(g, 0, 4, "#FBBF24");
  } else if (level >= 8 && ap.accessory === "glasses") {
    // Glasses over eyes
    set(g, 1, 2, "#333333");
    set(g, 1, 5, "#333333");
  }

  // ---- Blush ----
  if (frame.blush) {
    set(g, 2, 2, BLUSH_COLOR);
    set(g, 2, 5, BLUSH_COLOR);
  }

  // ---- Tear for sad ----
  if (ev === "half" && mv === "frown") {
    set(g, 2, 2, TEAR_COLOR);
  }

  return g;
}

// ---------------------------------------------------------------------------
// 12x12 grid (levels 11-15): Full detail - hair, ears, detailed face
// ---------------------------------------------------------------------------

function generate12x12(
  ap: AvatarAppearance,
  frame: AvatarFrame,
  level: number,
): PixelGrid {
  const g = empty(12);
  const C = ap.bodyColor;
  const Cd = darken(C, 25);
  const Cl = lighten(C, 25);
  const S = ap.skinColor;
  const Sd = darken(S, 20);

  // ---- Head (rows 1-5) ----
  fill(g, 1, 3, 6, 1, C);      // top
  fill(g, 2, 2, 8, 1, C);      // wider
  fill(g, 3, 2, 8, 1, C);      // face
  fill(g, 4, 2, 8, 1, C);      // face
  fill(g, 5, 3, 6, 1, C);      // chin

  // Skin
  fill(g, 2, 4, 4, 1, S);
  fill(g, 3, 3, 6, 1, S);
  fill(g, 4, 3, 6, 1, S);

  // Shading on head
  set(g, 5, 8, Cd);
  set(g, 4, 9, Cd);
  set(g, 1, 3, Cl);
  set(g, 1, 4, Cl);

  // ---- Hair (row 0-1) ----
  if (level >= 11) {
    if (ap.hairStyle === "spiky") {
      set(g, 0, 4, C); set(g, 0, 6, C); set(g, 0, 8, C);
      fill(g, 1, 3, 6, 1, C); // override top with hair color
    } else if (ap.hairStyle === "tuft") {
      set(g, 0, 5, C); set(g, 0, 6, C);
    } else if (ap.hairStyle === "bangs") {
      fill(g, 1, 3, 6, 1, C);
    }
  }

  // ---- Eyes (row 3) ----
  const ev = frame.eyeVariant;
  if (ev === "closed") {
    set(g, 3, 4, EYE_COLOR); set(g, 3, 5, EYE_COLOR);
    set(g, 3, 6, EYE_COLOR); set(g, 3, 7, EYE_COLOR);
  } else if (ev === "half") {
    set(g, 3, 4, EYE_COLOR);
    set(g, 3, 7, EYE_COLOR);
  } else if (ev === "squeezed") {
    set(g, 3, 4, Cd); set(g, 3, 5, Cd);
    set(g, 3, 6, Cd); set(g, 3, 7, Cd);
  } else if (ev === "wide") {
    // 2x2 eyes with highlight
    set(g, 2, 4, EYE_HIGHLIGHT); set(g, 2, 5, EYE_COLOR);
    set(g, 3, 4, EYE_COLOR);     set(g, 3, 5, EYE_COLOR);
    set(g, 2, 6, EYE_HIGHLIGHT); set(g, 2, 7, EYE_COLOR);
    set(g, 3, 6, EYE_COLOR);     set(g, 3, 7, EYE_COLOR);
  } else if (ev === "up-left") {
    set(g, 2, 4, EYE_COLOR); set(g, 3, 4, EYE_HIGHLIGHT);
    set(g, 2, 7, EYE_COLOR); set(g, 3, 7, EYE_HIGHLIGHT);
  } else if (ev === "up-right") {
    set(g, 2, 5, EYE_COLOR); set(g, 3, 5, EYE_HIGHLIGHT);
    set(g, 2, 6, EYE_COLOR); set(g, 3, 6, EYE_HIGHLIGHT);
  } else {
    // Normal open -- 1x1 dots
    set(g, 3, 4, EYE_COLOR);
    set(g, 3, 7, EYE_COLOR);
    // Tiny highlights
    if (level >= 12) {
      set(g, 2, 4, EYE_HIGHLIGHT);
      set(g, 2, 7, EYE_HIGHLIGHT);
    }
  }

  // ---- Mouth (row 4) ----
  const mv = frame.mouthVariant;
  if (mv === "big-smile") {
    set(g, 4, 4, darken(S, 40)); set(g, 4, 5, EYE_COLOR);
    set(g, 4, 6, EYE_COLOR); set(g, 4, 7, darken(S, 40));
  } else if (mv === "smile") {
    set(g, 4, 5, darken(S, 50)); set(g, 4, 6, darken(S, 50));
  } else if (mv === "open") {
    set(g, 4, 5, EYE_COLOR); set(g, 4, 6, EYE_COLOR);
  } else if (mv === "o-shape") {
    set(g, 4, 5, EYE_COLOR);
  } else if (mv === "frown") {
    set(g, 4, 5, Sd); set(g, 4, 6, Sd);
    set(g, 4, 4, darken(S, 40)); set(g, 4, 7, darken(S, 40));
  } else if (mv === "tongue") {
    set(g, 4, 5, EYE_COLOR);
    set(g, 4, 6, BLUSH_COLOR);
    set(g, 5, 6, BLUSH_COLOR);
  } else {
    set(g, 4, 5, darken(S, 40));
    set(g, 4, 6, darken(S, 40));
  }

  // ---- Body (rows 6-8) ----
  fill(g, 6, 3, 6, 1, C);
  fill(g, 7, 3, 6, 1, C);
  fill(g, 8, 3, 6, 1, C);
  // Body shading
  set(g, 8, 7, Cd); set(g, 8, 8, Cd);
  set(g, 7, 8, Cd);
  set(g, 6, 3, Cl);

  // ---- Arms (rows 6-8) ----
  const isWaving = frame.bodyRotation > 5 || frame.bodyRotation < -5;
  if (isWaving) {
    set(g, 5, 10, C); set(g, 6, 10, C); // right arm up
    set(g, 6, 2, C); set(g, 7, 2, C);   // left arm down
  } else {
    set(g, 6, 2, C); set(g, 7, 2, C);   // left arm
    set(g, 6, 9, C); set(g, 7, 9, C);   // right arm
  }

  // ---- Legs (rows 9-11) ----
  const isWalking = frame.bodyOffsetX !== 0;
  if (isWalking && frame.bodyOffsetX > 0) {
    set(g, 9, 4, C); set(g, 10, 4, C); set(g, 11, 4, Cd);
    set(g, 9, 7, C); set(g, 10, 8, C); set(g, 11, 8, Cd);
  } else if (isWalking && frame.bodyOffsetX < 0) {
    set(g, 9, 4, C); set(g, 10, 3, C); set(g, 11, 3, Cd);
    set(g, 9, 7, C); set(g, 10, 7, C); set(g, 11, 7, Cd);
  } else {
    set(g, 9, 4, C); set(g, 10, 4, C); set(g, 11, 4, Cd);
    set(g, 9, 7, C); set(g, 10, 7, C); set(g, 11, 7, Cd);
  }

  // ---- Species ears ----
  applyEars12(g, ap, C, Cl);

  // Tail
  if (ap.species === "cat" || ap.species === "fox") {
    set(g, 7, 10, C); set(g, 8, 11, Cl);
  } else if (ap.species === "bunny") {
    set(g, 8, 9, lighten(C, 50));
  } else if (ap.species === "dog") {
    set(g, 6, 10, Cd); set(g, 5, 11, Cd);
  }

  // ---- Accessory ----
  if (ap.accessory === "crown") {
    set(g, 0, 4, "#F59E0B"); set(g, 0, 5, "#F59E0B");
    set(g, 0, 6, "#F59E0B"); set(g, 0, 7, "#F59E0B");
    set(g, 1, 5, "#DAA520");  set(g, 1, 6, "#DAA520");
  } else if (ap.accessory === "halo") {
    set(g, 0, 4, "#FBBF24"); set(g, 0, 5, "#FBBF24");
    set(g, 0, 6, "#FBBF24"); set(g, 0, 7, "#FBBF24");
  } else if (ap.accessory === "glasses") {
    set(g, 3, 3, "#333"); set(g, 3, 4, "#555"); set(g, 3, 5, "#333");
    set(g, 3, 6, "#333"); set(g, 3, 7, "#555"); set(g, 3, 8, "#333");
  } else if (ap.accessory === "bow") {
    set(g, 1, 8, BLUSH_COLOR); set(g, 1, 9, darken(BLUSH_COLOR, 30));
  }

  // ---- Blush ----
  if (frame.blush && level >= 12) {
    set(g, 4, 3, BLUSH_COLOR);
    set(g, 4, 8, BLUSH_COLOR);
  }

  // Tear
  if (ev === "half" && mv === "frown") {
    set(g, 4, 4, TEAR_COLOR);
  }

  return g;
}

function applyEars12(g: PixelGrid, ap: AvatarAppearance, C: string, Cl: string) {
  if (ap.species === "cat" || ap.species === "fox") {
    set(g, 0, 2, C); set(g, 0, 3, C);
    set(g, 0, 8, C); set(g, 0, 9, C);
    // Inner ear
    set(g, 0, 3, Cl); set(g, 0, 8, Cl);
  } else if (ap.species === "bunny") {
    set(g, 0, 4, lighten(C, 30)); set(g, 0, 7, lighten(C, 30));
    // Use row before for taller ears -- but we only have row 0
    set(g, 0, 4, C); set(g, 0, 7, C);
    set(g, 1, 4, lighten(C, 30)); set(g, 1, 7, lighten(C, 30));
  } else if (ap.species === "bear") {
    set(g, 0, 2, C); set(g, 0, 3, C);
    set(g, 0, 8, C); set(g, 0, 9, C);
  } else if (ap.species === "dog") {
    set(g, 3, 1, darken(C, 25));
    set(g, 4, 1, darken(C, 25));
    set(g, 5, 1, darken(C, 25));
    set(g, 3, 10, darken(C, 25));
    set(g, 4, 10, darken(C, 25));
    set(g, 5, 10, darken(C, 25));
  }
}

// ---------------------------------------------------------------------------
// 16x16 grid (levels 16+): Maximum detail
// ---------------------------------------------------------------------------

function generate16x16(
  ap: AvatarAppearance,
  frame: AvatarFrame,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _level: number,
): PixelGrid {
  const g = empty(16);
  const C = ap.bodyColor;
  const Cd = darken(C, 25);
  const Cl = lighten(C, 25);
  const S = ap.skinColor;
  const Sd = darken(S, 20);
  const Sl = lighten(S, 20);

  // ---- Head (rows 1-7) ----
  fill(g, 1, 5, 6, 1, C);       // top
  fill(g, 2, 3, 10, 1, C);      // wider
  fill(g, 3, 2, 12, 1, C);      // full width
  fill(g, 4, 2, 12, 1, C);      // face
  fill(g, 5, 2, 12, 1, C);      // face
  fill(g, 6, 3, 10, 1, C);      // lower face
  fill(g, 7, 4, 8, 1, C);       // chin

  // Skin face
  fill(g, 3, 4, 8, 1, S);
  fill(g, 4, 3, 10, 1, S);
  fill(g, 5, 3, 10, 1, S);
  fill(g, 6, 4, 8, 1, S);

  // Highlight / shading
  set(g, 1, 5, Cl); set(g, 1, 6, Cl);
  set(g, 2, 3, Cl); set(g, 2, 4, Cl);
  set(g, 7, 10, Cd); set(g, 7, 11, Cd);
  set(g, 6, 12, Cd);
  set(g, 5, 12, Cd);

  // ---- Hair (row 0-1) ----
  if (ap.hairStyle === "spiky") {
    set(g, 0, 5, C); set(g, 0, 7, C); set(g, 0, 9, C); set(g, 0, 11, C);
    fill(g, 1, 4, 8, 1, C);
  } else if (ap.hairStyle === "tuft") {
    set(g, 0, 6, C); set(g, 0, 7, C); set(g, 0, 8, C);
  } else if (ap.hairStyle === "bangs") {
    fill(g, 1, 4, 8, 1, C);
    fill(g, 2, 4, 8, 1, C);
  }

  // ---- Eyes (rows 4-5) ----
  const ev = frame.eyeVariant;
  if (ev === "closed") {
    fill(g, 4, 5, 2, 1, EYE_COLOR);
    fill(g, 4, 9, 2, 1, EYE_COLOR);
  } else if (ev === "half") {
    set(g, 5, 5, EYE_COLOR); set(g, 5, 6, EYE_COLOR);
    set(g, 5, 9, EYE_COLOR); set(g, 5, 10, EYE_COLOR);
  } else if (ev === "squeezed") {
    // Happy squints -- arc shapes
    set(g, 4, 5, darken(S, 55)); set(g, 4, 6, darken(S, 55));
    set(g, 5, 4, darken(S, 55)); set(g, 5, 7, darken(S, 55));
    set(g, 4, 9, darken(S, 55)); set(g, 4, 10, darken(S, 55));
    set(g, 5, 8, darken(S, 55)); set(g, 5, 11, darken(S, 55));
  } else if (ev === "wide") {
    // 2x2 eyes with shine
    set(g, 3, 5, EYE_HIGHLIGHT); set(g, 3, 6, EYE_COLOR);
    set(g, 4, 5, EYE_COLOR);     set(g, 4, 6, EYE_COLOR);
    set(g, 3, 9, EYE_HIGHLIGHT); set(g, 3, 10, EYE_COLOR);
    set(g, 4, 9, EYE_COLOR);     set(g, 4, 10, EYE_COLOR);
  } else if (ev === "up-left") {
    set(g, 3, 5, EYE_COLOR); set(g, 4, 5, EYE_HIGHLIGHT);
    set(g, 4, 6, Sl);
    set(g, 3, 9, EYE_COLOR); set(g, 4, 9, EYE_HIGHLIGHT);
    set(g, 4, 10, Sl);
  } else if (ev === "up-right") {
    set(g, 3, 6, EYE_COLOR); set(g, 4, 6, EYE_HIGHLIGHT);
    set(g, 4, 5, Sl);
    set(g, 3, 10, EYE_COLOR); set(g, 4, 10, EYE_HIGHLIGHT);
    set(g, 4, 9, Sl);
  } else {
    // Normal open -- 2 pixels each with highlights
    set(g, 4, 5, EYE_COLOR); set(g, 4, 6, EYE_COLOR);
    set(g, 3, 5, EYE_HIGHLIGHT);
    set(g, 4, 9, EYE_COLOR); set(g, 4, 10, EYE_COLOR);
    set(g, 3, 9, EYE_HIGHLIGHT);
  }

  // ---- Mouth (row 6) ----
  const mv = frame.mouthVariant;
  if (mv === "big-smile") {
    set(g, 6, 5, darken(S, 40));
    fill(g, 6, 6, 4, 1, EYE_COLOR);
    set(g, 6, 10, darken(S, 40));
  } else if (mv === "smile") {
    set(g, 6, 6, darken(S, 50));
    set(g, 6, 7, darken(S, 50));
    set(g, 6, 8, darken(S, 50));
  } else if (mv === "open") {
    set(g, 6, 7, EYE_COLOR); set(g, 6, 8, EYE_COLOR);
    set(g, 7, 7, "#c44"); set(g, 7, 8, "#c44"); // inside mouth
  } else if (mv === "o-shape") {
    set(g, 6, 7, EYE_COLOR);
    set(g, 6, 8, EYE_COLOR);
  } else if (mv === "frown") {
    set(g, 6, 6, Sd); set(g, 6, 7, darken(S, 50));
    set(g, 6, 8, darken(S, 50)); set(g, 6, 9, Sd);
  } else if (mv === "tongue") {
    set(g, 6, 7, EYE_COLOR); set(g, 6, 8, EYE_COLOR);
    set(g, 7, 7, BLUSH_COLOR); set(g, 7, 8, BLUSH_COLOR);
  } else {
    set(g, 6, 7, darken(S, 40)); set(g, 6, 8, darken(S, 40));
  }

  // ---- Body (rows 8-11) ----
  fill(g, 8, 4, 8, 1, C);
  fill(g, 9, 4, 8, 1, C);
  fill(g, 10, 4, 8, 1, C);
  fill(g, 11, 4, 8, 1, C);

  // Body highlights/shading
  set(g, 8, 4, Cl); set(g, 8, 5, Cl);
  set(g, 9, 4, Cl);
  set(g, 10, 10, Cd); set(g, 10, 11, Cd);
  set(g, 11, 10, Cd); set(g, 11, 11, Cd);

  // ---- Arms ----
  const isWaving = frame.bodyRotation > 5 || frame.bodyRotation < -5;
  if (isWaving) {
    // Right arm up
    set(g, 7, 13, C); set(g, 8, 13, C);
    set(g, 6, 14, C);
    // Left arm normal
    set(g, 8, 3, C); set(g, 9, 3, C); set(g, 10, 2, C);
  } else {
    set(g, 8, 3, C); set(g, 9, 3, C); set(g, 10, 2, C);
    set(g, 8, 12, C); set(g, 9, 12, C); set(g, 10, 13, C);
  }

  // ---- Legs (rows 12-15) ----
  const isWalking = frame.bodyOffsetX !== 0;
  if (isWalking && frame.bodyOffsetX > 0) {
    set(g, 12, 5, C); set(g, 13, 5, C); set(g, 14, 5, Cd); set(g, 15, 5, Cd);
    set(g, 12, 10, C); set(g, 13, 11, C); set(g, 14, 11, Cd); set(g, 15, 12, Cd);
  } else if (isWalking && frame.bodyOffsetX < 0) {
    set(g, 12, 5, C); set(g, 13, 4, C); set(g, 14, 4, Cd); set(g, 15, 3, Cd);
    set(g, 12, 10, C); set(g, 13, 10, C); set(g, 14, 10, Cd); set(g, 15, 10, Cd);
  } else {
    set(g, 12, 5, C); set(g, 13, 5, C); set(g, 14, 5, Cd); set(g, 15, 5, Cd);
    set(g, 12, 10, C); set(g, 13, 10, C); set(g, 14, 10, Cd); set(g, 15, 10, Cd);
  }

  // ---- Species ears ----
  applyEars16(g, ap, C, Cl);

  // Tail
  if (ap.species === "cat" || ap.species === "fox") {
    set(g, 10, 13, C); set(g, 11, 14, Cl); set(g, 10, 14, Cl);
  } else if (ap.species === "bunny") {
    set(g, 11, 12, lighten(C, 50));
    set(g, 11, 13, lighten(C, 50));
  } else if (ap.species === "dog") {
    set(g, 8, 13, Cd); set(g, 7, 14, Cd); set(g, 6, 14, Cd);
  }

  // ---- Accessory ----
  if (ap.accessory === "crown") {
    fill(g, 0, 5, 6, 1, "#F59E0B");
    set(g, 0, 6, "#DAA520"); set(g, 0, 9, "#DAA520");
    // Spikes
    set(g, 0, 5, "#F59E0B"); set(g, 0, 7, "#FBBF24"); set(g, 0, 10, "#F59E0B");
  } else if (ap.accessory === "halo") {
    fill(g, 0, 5, 6, 1, "#FBBF24");
  } else if (ap.accessory === "cap") {
    fill(g, 0, 4, 8, 1, C);
    fill(g, 1, 3, 10, 1, C);
    fill(g, 2, 2, 3, 1, darken(C, 15));
  } else if (ap.accessory === "bow") {
    set(g, 1, 12, BLUSH_COLOR); set(g, 1, 13, darken(BLUSH_COLOR, 30));
    set(g, 2, 12, darken(BLUSH_COLOR, 30)); set(g, 2, 13, BLUSH_COLOR);
  } else if (ap.accessory === "glasses") {
    set(g, 4, 4, "#333"); fill(g, 4, 5, 2, 1, "#555"); set(g, 4, 7, "#333");
    set(g, 4, 8, "#333"); fill(g, 4, 9, 2, 1, "#555"); set(g, 4, 11, "#333");
  } else if (ap.accessory === "horns") {
    set(g, 0, 3, "#DC2626"); set(g, 0, 4, "#DC2626");
    set(g, 0, 11, "#DC2626"); set(g, 0, 12, "#DC2626");
  }

  // ---- Blush ----
  if (frame.blush) {
    set(g, 5, 4, BLUSH_COLOR); set(g, 5, 3, BLUSH_COLOR);
    set(g, 5, 11, BLUSH_COLOR); set(g, 5, 12, BLUSH_COLOR);
  }

  // Tear
  if (ev === "half" && mv === "frown") {
    set(g, 5, 5, TEAR_COLOR); set(g, 6, 5, TEAR_COLOR);
  }

  // Sparkle
  if (frame.sparkle) {
    set(g, 0, 14, "#FBBF24");
    set(g, 1, 15, "#FDE68A");
    set(g, 2, 14, "#FBBF24");
  }

  return g;
}

function applyEars16(g: PixelGrid, ap: AvatarAppearance, C: string, Cl: string) {
  if (ap.species === "cat" || ap.species === "fox") {
    // Pointy ears
    set(g, 0, 3, C); set(g, 0, 4, C);
    set(g, 1, 2, C); set(g, 1, 3, Cl);
    set(g, 0, 11, C); set(g, 0, 12, C);
    set(g, 1, 12, Cl); set(g, 1, 13, C);
  } else if (ap.species === "bunny") {
    // Tall ears
    set(g, 0, 5, C); set(g, 0, 6, Cl);
    set(g, 0, 9, Cl); set(g, 0, 10, C);
    // Extend upward effect using row 1
    set(g, 1, 5, C); set(g, 1, 6, Cl);
    set(g, 1, 9, Cl); set(g, 1, 10, C);
  } else if (ap.species === "bear") {
    set(g, 0, 3, C); set(g, 0, 4, C);
    set(g, 0, 11, C); set(g, 0, 12, C);
    set(g, 1, 3, C); set(g, 1, 12, C);
  } else if (ap.species === "dog") {
    // Floppy ears
    set(g, 3, 1, darken(C, 25)); set(g, 4, 1, darken(C, 25));
    set(g, 5, 1, darken(C, 25)); set(g, 6, 0, darken(C, 25));
    set(g, 3, 14, darken(C, 25)); set(g, 4, 14, darken(C, 25));
    set(g, 5, 14, darken(C, 25)); set(g, 6, 15, darken(C, 25));
  }
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

export function generateCharacter(
  appearance: AvatarAppearance,
  resolution: number,
  frame: AvatarFrame,
  level: number,
): PixelGrid {
  switch (resolution) {
    case 4:
      return generate4x4(appearance, frame, level);
    case 6:
      return generate6x6(appearance, frame, level);
    case 8:
      return generate8x8(appearance, frame, level);
    case 12:
      return generate12x12(appearance, frame, level);
    case 16:
      return generate16x16(appearance, frame, level);
    default:
      return generate8x8(appearance, frame, level);
  }
}
