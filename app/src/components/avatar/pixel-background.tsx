"use client";

import { useMemo } from "react";

type TimeOfDay = "morning" | "day" | "evening" | "night";

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const SKY_PALETTES: Record<TimeOfDay, string[]> = {
  morning: ["#FFE4B5", "#FFDAB0", "#FFC89A", "#87CEEB", "#73B8DE", "#5FA8D0"],
  day:     ["#87CEEB", "#7EC8E3", "#5BB5D5", "#4AA8C8", "#3D9BBB", "#2F8EAE"],
  evening: ["#FF8C42", "#E86B3A", "#CC4B32", "#8B3A62", "#5C2D82", "#3D1F72"],
  night:   ["#0D1B2A", "#1B2838", "#1B3044", "#152540", "#0F1D30", "#0A1525"],
};

const GROUND_PALETTES: Record<TimeOfDay, string[]> = {
  morning: ["#7CCD7C", "#6BBF6B", "#5AB05A", "#4FA34F"],
  day:     ["#5DAE5D", "#4FA34F", "#419841", "#338D33"],
  evening: ["#4A7A4A", "#3D6D3D", "#306030", "#235323"],
  night:   ["#1A3A1A", "#153015", "#102810", "#0D200D"],
};

interface Star { x: number; y: number; bright: boolean }

function generateStars(seed: number, count: number): Star[] {
  const stars: Star[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 7) % 2147483647;
    const x = (s % 100) / 100;
    s = (s * 16807 + 7) % 2147483647;
    const y = (s % 60) / 100;
    s = (s * 16807 + 7) % 2147483647;
    stars.push({ x, y, bright: s % 3 === 0 });
  }
  return stars;
}

function getCelestialY(tod: TimeOfDay): number {
  const h = new Date().getHours();
  if (tod === "morning") return 0.3 - (h - 6) * 0.03;
  if (tod === "day") return 0.15 + Math.abs(h - 14) * 0.02;
  if (tod === "evening") return 0.2 + (h - 17) * 0.04;
  return 0.18;
}

const CLOUD_SHAPES = [
  [[0,0],[1,0],[2,0],[3,0],[1,-1],[2,-1]],
  [[0,0],[1,0],[2,0],[1,-1]],
  [[0,0],[1,0],[2,0],[3,0],[4,0],[1,-1],[2,-1],[3,-1]],
];

function setCell(cells: string[][], y: number, x: number, color: string, rows: number, maxCols: number) {
  if (y >= 0 && y < rows && x >= 0 && x < maxCols) cells[y][x] = color;
}

export function PixelBackground({ className }: { className?: string }) {
  const tod = getTimeOfDay();

  // Rows fixed at 10 for compact height, cols determined by CSS (we render enough)
  const rows = 14;
  const maxCols = 48; // render wide enough, CSS will clip

  const grid = useMemo(() => {
    const cells: string[][] = [];
    const skyColors = SKY_PALETTES[tod];
    const groundColors = GROUND_PALETTES[tod];
    const skyRows = Math.floor(rows * 0.7);
    const groundRows = rows - skyRows;

    // Sky gradient
    for (let y = 0; y < skyRows; y++) {
      const row: string[] = [];
      const colorIdx = Math.floor((y / skyRows) * skyColors.length);
      const baseColor = skyColors[Math.min(colorIdx, skyColors.length - 1)];
      for (let x = 0; x < maxCols; x++) {
        row.push(baseColor);
      }
      cells.push(row);
    }

    // Ground
    for (let y = 0; y < groundRows; y++) {
      const row: string[] = [];
      const colorIdx = Math.floor((y / groundRows) * groundColors.length);
      const baseColor = groundColors[Math.min(colorIdx, groundColors.length - 1)];
      for (let x = 0; x < maxCols; x++) {
        const hillOffset = Math.sin((x / maxCols) * Math.PI * 3 + y) * 0.5;
        if (y === 0 && hillOffset > 0.2 && x % 3 !== 0) {
          row.push(skyColors[skyColors.length - 1]);
        } else {
          row.push(baseColor);
        }
      }
      cells.push(row);
    }

    // Clouds
    if (tod === "morning" || tod === "day") {
      const cloudColor = tod === "morning" ? "#FFFFFF" : "#F0F8FF";
      const positions = [
        { shape: 0, cx: 3, cy: 1 },
        { shape: 1, cx: Math.floor(maxCols * 0.35), cy: 2 },
        { shape: 2, cx: Math.floor(maxCols * 0.65), cy: 1 },
        { shape: 1, cx: Math.floor(maxCols * 0.85), cy: 3 },
      ];
      for (const { shape, cx, cy } of positions) {
        for (const [dx, dy] of CLOUD_SHAPES[shape]) {
          setCell(cells, cy + dy, cx + dx, cloudColor, rows, maxCols);
        }
      }
    }

    // Stars
    if (tod === "night" || tod === "evening") {
      const starCount = tod === "night" ? 25 : 10;
      const stars = generateStars(42, starCount);
      for (const star of stars) {
        const sx = Math.floor(star.x * maxCols);
        const sy = Math.floor(star.y * rows);
        setCell(cells, sy, sx, star.bright ? "#FFFFFF" : "#AABBCC", rows, maxCols);
      }
    }

    // Sun or Moon
    const celY = getCelestialY(tod);
    const celRow = Math.floor(celY * rows);
    const celCol = tod === "morning" ? Math.floor(maxCols * 0.82) :
                   tod === "evening" ? Math.floor(maxCols * 0.12) :
                   tod === "night" ? Math.floor(maxCols * 0.8) :
                   Math.floor(maxCols * 0.78);

    if (tod === "morning" || tod === "day") {
      const sunColor = tod === "morning" ? "#FFD700" : "#FFF44F";
      const sunGlow = tod === "morning" ? "#FFEC8B" : "#FFFACD";
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          setCell(cells, celRow + dy, celCol + dx, sunColor, rows, maxCols);
      for (const [dy, dx] of [[-1,0],[-1,1],[0,-1],[0,2],[1,-1],[1,2],[2,0],[2,1]])
        setCell(cells, celRow + dy, celCol + dx, sunGlow, rows, maxCols);
    } else {
      const moonColor = "#E8E8D0";
      const moonShadow = tod === "night" ? "#1B2838" : "#5C2D82";
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          setCell(cells, celRow + dy, celCol + dx, (dx === 1 && dy === 0) ? moonShadow : moonColor, rows, maxCols);
    }

    // Trees scattered across the landscape
    const treeSpacing = Math.floor(maxCols / 7);
    const treePositions = [1, treeSpacing * 2, treeSpacing * 3 + 1, treeSpacing * 5, maxCols - 3];
    const trunkColor = tod === "night" ? "#2A1A0A" : "#8B5A2B";
    const leafColor = tod === "night" ? "#0D300D" : tod === "evening" ? "#2D5A2D" : "#228B22";
    const leafLight = tod === "night" ? "#153015" : tod === "evening" ? "#3D7A3D" : "#32CD32";
    for (const tx of treePositions) {
      const baseY = skyRows;
      setCell(cells, baseY - 1, tx, trunkColor, rows, maxCols);
      setCell(cells, baseY - 2, tx, trunkColor, rows, maxCols);
      setCell(cells, baseY - 3, tx, leafColor, rows, maxCols);
      setCell(cells, baseY - 3, tx - 1, leafColor, rows, maxCols);
      setCell(cells, baseY - 3, tx + 1, leafLight, rows, maxCols);
      setCell(cells, baseY - 4, tx, leafLight, rows, maxCols);
    }

    return cells;
  }, [tod]);

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 0,
        borderRadius: 12,
        overflow: "hidden",
        imageRendering: "pixelated" as const,
        width: "100%",
        aspectRatio: `${maxCols} / ${rows}`,
      }}
    >
      {grid.flat().map((color, i) => (
        <div
          key={i}
          style={{ backgroundColor: color, aspectRatio: "1" }}
        />
      ))}
    </div>
  );
}
