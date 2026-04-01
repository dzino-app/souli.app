// Voxel grid: 16×16×16 array of color values
// null = empty/air, string = hex color
// grid[y][z][x] — y is height (0=bottom), z is depth, x is width

export type VoxelColor = string | null;
export type VoxelLayer = VoxelColor[][]; // z × x
export type VoxelGrid = VoxelLayer[]; // y layers

export const GRID_SIZE = 16;

export interface VoxelAnimationSet {
  idle: VoxelGrid[];
  walk: VoxelGrid[];
  talk: VoxelGrid[];
  eat: VoxelGrid[];
  sleep: VoxelGrid[];
  happy: VoxelGrid[];
  sad: VoxelGrid[];
  think: VoxelGrid[];
  wave: VoxelGrid[];
}

export interface VoxelAvatarData {
  baseGrid: VoxelGrid;
  animations: VoxelAnimationSet;
  description: string;
  generatedAt: string;
}

const STORAGE_KEY = "dzino_voxel_avatar";

export function getVoxelAvatar(): VoxelAvatarData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveVoxelAvatar(data: VoxelAvatarData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearVoxelAvatar() {
  localStorage.removeItem(STORAGE_KEY);
}

// Create an empty grid
export function emptyGrid(): VoxelGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null)
    )
  );
}

// Simple placeholder character (used before Gemini generates the real one)
export function placeholderCharacter(color: string): VoxelGrid {
  const grid = emptyGrid();
  const dark = darken(color);
  const light = lighten(color);

  // Body (y=0..5, centered)
  for (let y = 0; y <= 5; y++) {
    for (let z = 5; z <= 10; z++) {
      for (let x = 5; x <= 10; x++) {
        grid[y][z][x] = color;
      }
    }
  }

  // Head (y=6..10, centered)
  for (let y = 6; y <= 10; y++) {
    for (let z = 4; z <= 11; z++) {
      for (let x = 4; x <= 11; x++) {
        grid[y][z][x] = light;
      }
    }
  }

  // Eyes (y=8, z=5)
  grid[8][5][6] = "#1a1a2e";
  grid[8][5][9] = "#1a1a2e";

  // Mouth (y=7, z=5)
  grid[7][5][7] = dark;
  grid[7][5][8] = dark;

  // Feet (y=0)
  grid[0][7][5] = dark;
  grid[0][7][10] = dark;

  return grid;
}

// Simple color manipulation
function darken(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lighten(hex: string): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 30);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 30);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 30);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
