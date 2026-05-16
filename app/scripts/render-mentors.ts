#!/usr/bin/env bun
/**
 * Renders the 12 canonical seed-avatar mentors as 512×512 PNGs by calling the
 * SAME `generateCharacter` function the app uses in /kniznica and /dusa.
 *
 * Same pixels in /kniznica → same pixels in the show. Continuity is the win.
 *
 * Output: public/style-anchors/mentors/{slug}.png
 * Run: bun run scripts/render-mentors.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { generateCharacter } from "../src/lib/pixel-art";
import { ACTIVITY_ANIMATIONS } from "../src/components/avatar/avatar-frames";
import type { AvatarAppearance } from "../src/lib/avatar";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "style-anchors", "mentors");

const INDIGO = { r: 79, g: 70, b: 229 };
const CREAM = { r: 255, g: 228, b: 201 };
const DARK = { r: 26, g: 24, b: 51 };

// Canon mentor data (mirrors src/lib/seed-avatars.ts but typed minimal for rendering)
interface MentorDef {
  slug: string;
  name: string;
  role: string;
  level: number;
  appearance: AvatarAppearance;
}

function makeAppearance(
  species: AvatarAppearance["species"],
  bodyShape: AvatarAppearance["bodyShape"],
  eyeStyle: AvatarAppearance["eyeStyle"],
  mouthStyle: AvatarAppearance["mouthStyle"],
  accessory: AvatarAppearance["accessory"],
  hairStyle: AvatarAppearance["hairStyle"],
  skinColor: string,
  bodyColor: string,
): AvatarAppearance {
  const earsForSpecies: Record<AvatarAppearance["species"], AvatarAppearance["earStyle"]> = {
    human: "none", cat: "pointy", dog: "floppy", bunny: "pointy",
    bear: "bear", fox: "pointy", owl: "wings", dragon: "horned", mushroom: "cap",
  };
  return {
    species, bodyShape, eyeStyle, mouthStyle,
    earStyle: earsForSpecies[species],
    accessory, hairStyle, skinColor, bodyColor,
  };
}

const MENTORS: MentorDef[] = [
  { slug: "kiko",    name: "Kiko",    role: "E02 · Binary Forest",            level: 8,
    appearance: makeAppearance("cat",   "tall",   "wide", "smile", "glasses", "tuft",   "#D4F0FF", "#4F46E5") },
  { slug: "luna",    name: "Luna",    role: "E03 · Mirror Garden",            level: 7,
    appearance: makeAppearance("fox",   "tall",   "sleepy", "smile", "bow",   "none",   "#FFE4C9", "#E8A87C") },
  { slug: "rex",     name: "Rex",     role: "E07 · Three-Moon Dunes",         level: 9,
    appearance: makeAppearance("dog",   "round",  "wide", "open",  "headband","none",   "#FFE4C9", "#F59E0B") },
  { slug: "mimi",    name: "Mimi",    role: "E08 · Silent Owl Grove",         level: 6,
    appearance: makeAppearance("bunny", "round",  "dots", "line",  "bow",    "none",    "#FFE4C9", "#F8BBD0") },
  { slug: "bruno",   name: "Bruno",   role: "E05 · Moon Realm",               level: 10,
    appearance: makeAppearance("bear",  "square", "sleepy","line", "none",   "none",    "#FFE4C9", "#8B7355") },
  { slug: "zara",    name: "Zara",    role: "E11 · Storm Field",              level: 9,
    appearance: makeAppearance("human", "round",  "anime","smile", "scarf",  "spiky",   "#FFE4C9", "#EC4899") },
  { slug: "pixel",   name: "Pixel",   role: "E09 · Twilight Stage",           level: 7,
    appearance: makeAppearance("cat",   "round",  "wide", "smile", "headband","spiky",  "#D4F0FF", "#10B981") },
  { slug: "nori",    name: "Nori",    role: "E04 · Cloud Café",               level: 8,
    appearance: makeAppearance("fox",   "round",  "wide", "smile", "scarf",  "tuft",    "#FFE4C9", "#F97316") },
  { slug: "biscuit", name: "Biscuit", role: "E10 · Library",                  level: 9,
    appearance: makeAppearance("dog",   "round",  "sleepy","smile","none",   "none",    "#FFE4C9", "#D4A574") },
  { slug: "hana",    name: "Hana",    role: "E01 · Pixel Garden",             level: 7,
    appearance: makeAppearance("bunny", "round",  "dots", "smile", "headband","tuft",   "#FFE4C9", "#84CC16") },
  { slug: "otto",    name: "Otto",    role: "E06 · Stream of Liquid Gold",    level: 11,
    appearance: makeAppearance("bear",  "round",  "sleepy","smile","monocle","none",    "#FFE4C9", "#A0522D") },
  { slug: "ari",     name: "Ari",     role: "E09 · Twilight Stage",           level: 8,
    appearance: makeAppearance("human", "tall",   "anime","smile", "headband","bangs",  "#FFE4C9", "#8B5CF6") },
];

// Also render Dzino — same canonical look used on hero / favicon
const DZINO: MentorDef = {
  slug: "dzino",
  name: "Dzino",
  role: "The First Souli",
  level: 10,
  appearance: makeAppearance("cat", "round", "anime", "smile", "crown", "none", "#FFE4C9", "#4F46E5"),
};

function parseHex(c: string): { r: number; g: number; b: number } {
  const s = c.replace("#", "");
  return {
    r: parseInt(s.substring(0, 2), 16),
    g: parseInt(s.substring(2, 4), 16),
    b: parseInt(s.substring(4, 6), 16),
  };
}

interface RenderOptions {
  size: number;        // total PNG size in px
  padding: number;     // padding inside the card around the character
  bgTop: { r: number; g: number; b: number };
  bgBot: { r: number; g: number; b: number };
  showLabel: boolean;
  label?: string;
  sublabel?: string;
}

async function renderMentor(mentor: MentorDef, opts: RenderOptions): Promise<Buffer> {
  // Use idle frame for clean reference
  const animation = ACTIVITY_ANIMATIONS["idle"];
  const frame = animation.frames[0];
  const resolution = mentor.level >= 16 ? 16 : mentor.level >= 12 ? 12 : mentor.level >= 6 ? 8 : 6;
  const grid = generateCharacter(mentor.appearance, resolution, frame, mentor.level);

  const { size, padding, bgTop, bgBot, showLabel, label, sublabel } = opts;
  const charArea = size - 2 * padding - (showLabel ? 130 : 0);
  const pixelSize = Math.floor(charArea / resolution);
  const charSize = pixelSize * resolution;
  const offsetX = (size - charSize) / 2;
  const offsetY = padding;

  // Build raw RGB buffer
  const channels = 3;
  const buf = Buffer.alloc(size * size * channels);

  // Gradient background
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const r = Math.round(bgTop.r + (bgBot.r - bgTop.r) * t);
    const g = Math.round(bgTop.g + (bgBot.g - bgTop.g) * t);
    const b = Math.round(bgTop.b + (bgBot.b - bgTop.b) * t);
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * channels;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
    }
  }

  // Render the grid: grid[row][col] in app's convention
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const color = grid[row]?.[col];
      if (!color) continue;
      const { r, g, b } = parseHex(color);
      const px = Math.round(offsetX + col * pixelSize);
      const py = Math.round(offsetY + row * pixelSize);
      for (let dy = 0; dy < pixelSize; dy++) {
        for (let dx = 0; dx < pixelSize; dx++) {
          const X = px + dx;
          const Y = py + dy;
          if (X >= 0 && X < size && Y >= 0 && Y < size) {
            const i = (Y * size + X) * channels;
            buf[i] = r;
            buf[i + 1] = g;
            buf[i + 2] = b;
          }
        }
      }
    }
  }

  // Bottom label plate
  if (showLabel && label) {
    const plateH = 130;
    const plateY = size - plateH;
    for (let y = plateY; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * channels;
        buf[i] = DARK.r;
        buf[i + 1] = DARK.g;
        buf[i + 2] = DARK.b;
      }
    }
  }

  // Compose final PNG via sharp + SVG overlay for crisp text
  let pipeline = sharp(buf, { raw: { width: size, height: size, channels } });

  if (showLabel && label) {
    const titleY = size - 80;
    const subY = size - 35;
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .title { font: bold 44px "Courier New", monospace; fill: rgb(${CREAM.r},${CREAM.g},${CREAM.b}); }
          .sub { font: 18px "Courier New", monospace; fill: rgb(${CREAM.r - 40},${CREAM.g - 40},${CREAM.b - 40}); }
          .foot { font: 12px "Courier New", monospace; fill: rgb(${CREAM.r - 80},${CREAM.g - 80},${CREAM.b - 80}); }
        </style>
        <text x="50%" y="${titleY}" text-anchor="middle" class="title">${label.toUpperCase()}</text>
        ${sublabel ? `<text x="50%" y="${subY}" text-anchor="middle" class="sub">${sublabel}</text>` : ""}
        <text x="50%" y="${size - 10}" text-anchor="middle" class="foot">PIXOCI · MENTOR REFERENCE</text>
      </svg>`;
    pipeline = pipeline.composite([{ input: Buffer.from(svg) }]);
  }

  return pipeline.png().toBuffer();
}

// Biome-tinted backgrounds for each mentor (warmer/cooler per their episode mood)
const TINTS: Record<string, { top: { r: number; g: number; b: number }; bot: { r: number; g: number; b: number } }> = {
  hana:    { top: { r: 255, g: 240, b: 220 }, bot: { r: 244, g: 224, b: 142 } },
  kiko:    { top: { r: 200, g: 230, b: 230 }, bot: { r: 94,  g: 234, b: 212 } },
  luna:    { top: { r: 230, g: 220, b: 245 }, bot: { r: 180, g: 145, b: 230 } },
  nori:    { top: { r: 255, g: 230, b: 210 }, bot: { r: 255, g: 191, b: 156 } },
  bruno:   { top: { r: 200, g: 200, b: 220 }, bot: { r: 110, g: 110, b: 140 } },
  otto:    { top: { r: 220, g: 180, b: 120 }, bot: { r: 218, g: 165, b: 32  } },
  rex:     { top: { r: 255, g: 220, b: 190 }, bot: { r: 245, g: 194, b: 104 } },
  mimi:    { top: { r: 230, g: 230, b: 240 }, bot: { r: 180, g: 198, b: 180 } },
  ari:     { top: { r: 200, g: 170, b: 240 }, bot: { r: 130, g: 90,  b: 200 } },
  pixel:   { top: { r: 200, g: 230, b: 230 }, bot: { r: 94,  g: 234, b: 212 } },
  biscuit: { top: { r: 220, g: 200, b: 170 }, bot: { r: 180, g: 150, b: 110 } },
  zara:    { top: { r: 220, g: 200, b: 200 }, bot: { r: 160, g: 80,  b: 80  } },
  dzino:   { top: { r: 255, g: 240, b: 220 }, bot: { r: 90,  g: 80,  b: 200 } },
};

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Rendering mentors using the app's PixelAvatar renderer…");

  // Dzino first (the protagonist)
  const dzinoTint = TINTS.dzino;
  const dzinoOut = path.join(ROOT, "public", "style-anchors", "dzino", "dzino.png");
  fs.mkdirSync(path.dirname(dzinoOut), { recursive: true });
  const dzinoBuf = await renderMentor(DZINO, {
    size: 512,
    padding: 40,
    bgTop: dzinoTint.top,
    bgBot: dzinoTint.bot,
    showLabel: true,
    label: DZINO.name,
    sublabel: DZINO.role,
  });
  fs.writeFileSync(dzinoOut, dzinoBuf);
  console.log(`  ${path.relative(ROOT, dzinoOut)}  ${dzinoBuf.length} bytes`);

  // Each mentor
  for (const m of MENTORS) {
    const tint = TINTS[m.slug] ?? { top: { r: 240, g: 240, b: 240 }, bot: { r: 100, g: 100, b: 130 } };
    const buf = await renderMentor(m, {
      size: 512,
      padding: 40,
      bgTop: tint.top,
      bgBot: tint.bot,
      showLabel: true,
      label: m.name,
      sublabel: m.role,
    });
    const outPath = path.join(OUT_DIR, `${m.slug}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`  ${path.relative(ROOT, outPath)}  ${buf.length} bytes`);
  }

  console.log(`\nDone. Rendered ${MENTORS.length + 1} canonical character sheets.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
