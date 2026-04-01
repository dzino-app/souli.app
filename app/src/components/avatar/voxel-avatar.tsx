"use client";

import { useEffect, useState, useMemo } from "react";
import type { AvatarState } from "@/lib/avatar";
import {
  getVoxelAvatar,
  placeholderCharacter,
  type VoxelGrid,
  type VoxelAnimationSet,
} from "@/lib/voxel";
import { VoxelRenderer } from "./voxel-renderer";

interface VoxelAvatarProps {
  state: AvatarState;
  color: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 80, height: 80 },
  md: { width: 160, height: 160 },
  lg: { width: 240, height: 240 },
};

// Map AvatarState to VoxelAnimationSet keys
const STATE_TO_ANIM: Record<AvatarState, keyof VoxelAnimationSet> = {
  idle: "idle",
  walking: "walk",
  talking: "talk",
  eating: "eat",
  sleeping: "sleep",
  happy: "happy",
  sad: "sad",
  thinking: "think",
  waving: "wave",
};

// Generate simple animation frames by modifying the base grid
// This is the fallback before Gemini generates proper animations
function generateSimpleFrames(
  base: VoxelGrid,
  state: keyof VoxelAnimationSet
): VoxelGrid[] {
  // For now, create simple animations by shifting the grid
  const frames: VoxelGrid[] = [];

  switch (state) {
    case "idle": {
      // Gentle bob: shift everything up by 1 voxel and back
      frames.push(base);
      frames.push(shiftGrid(base, 0, 1, 0));
      frames.push(base);
      frames.push(shiftGrid(base, 0, -1, 0));
      break;
    }
    case "walk": {
      // Sway left-right
      frames.push(base);
      frames.push(shiftGrid(base, 1, 0, 0));
      frames.push(base);
      frames.push(shiftGrid(base, -1, 0, 0));
      frames.push(base);
      frames.push(shiftGrid(base, 1, 1, 0));
      break;
    }
    case "talk": {
      // Quick bob
      frames.push(base);
      frames.push(shiftGrid(base, 0, 1, 0));
      frames.push(base);
      frames.push(shiftGrid(base, 0, 1, 0));
      break;
    }
    case "happy": {
      // Jump!
      frames.push(base);
      frames.push(shiftGrid(base, 0, 2, 0));
      frames.push(shiftGrid(base, 0, 3, 0));
      frames.push(shiftGrid(base, 0, 2, 0));
      break;
    }
    case "sad": {
      // Slow sway
      frames.push(base);
      frames.push(base);
      frames.push(shiftGrid(base, 0, -1, 0));
      frames.push(shiftGrid(base, 0, -1, 0));
      break;
    }
    case "sleep": {
      // Slow breathing (subtle)
      frames.push(base);
      frames.push(base);
      break;
    }
    case "think": {
      // Tilt
      frames.push(base);
      frames.push(shiftGrid(base, 1, 0, 0));
      frames.push(shiftGrid(base, 1, 1, 0));
      frames.push(shiftGrid(base, 0, 1, 0));
      break;
    }
    case "wave": {
      // Side to side
      frames.push(base);
      frames.push(shiftGrid(base, -1, 0, 0));
      frames.push(base);
      frames.push(shiftGrid(base, 1, 0, 0));
      break;
    }
    case "eat": {
      // Bob down and up
      frames.push(base);
      frames.push(shiftGrid(base, 0, -1, 0));
      frames.push(base);
      frames.push(shiftGrid(base, 0, 1, 0));
      frames.push(base);
      frames.push(shiftGrid(base, 0, -1, 0));
      break;
    }
    default:
      frames.push(base);
  }

  return frames;
}

// Shift all voxels in a grid by dx, dy, dz
function shiftGrid(
  grid: VoxelGrid,
  dx: number,
  dy: number,
  dz: number
): VoxelGrid {
  const size = grid.length;
  const newGrid: VoxelGrid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null)
    )
  );

  for (let y = 0; y < size; y++) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const ny = y + dy;
        const nz = z + dz;
        const nx = x + dx;
        if (
          ny >= 0 && ny < size &&
          nz >= 0 && nz < size &&
          nx >= 0 && nx < size &&
          grid[y]?.[z]?.[x]
        ) {
          newGrid[ny][nz][nx] = grid[y][z][x];
        }
      }
    }
  }

  return newGrid;
}

export function VoxelAvatar({ state, color, size = "md" }: VoxelAvatarProps) {
  const { width, height } = SIZES[size];
  const [baseGrid, setBaseGrid] = useState<VoxelGrid | null>(null);
  const [geminiAnimations, setGeminiAnimations] =
    useState<VoxelAnimationSet | null>(null);

  useEffect(() => {
    // Try to load cached voxel avatar
    const cached = getVoxelAvatar();
    if (cached) {
      setBaseGrid(cached.baseGrid);
      setGeminiAnimations(cached.animations);
    } else {
      // Use placeholder until Gemini generates the real one
      setBaseGrid(placeholderCharacter(color));
    }
  }, [color]);

  const animKey = STATE_TO_ANIM[state] || "idle";

  const frames = useMemo(() => {
    if (!baseGrid) return [];

    // Use Gemini-generated animations if available
    if (geminiAnimations && geminiAnimations[animKey]?.length > 0) {
      return geminiAnimations[animKey];
    }

    // Fallback to simple shift-based animations
    return generateSimpleFrames(baseGrid, animKey);
  }, [baseGrid, geminiAnimations, animKey]);

  const animFps = useMemo(() => {
    switch (animKey) {
      case "idle":
      case "sleep":
      case "sad":
        return 3;
      case "talk":
      case "happy":
        return 6;
      default:
        return 4;
    }
  }, [animKey]);

  if (!baseGrid) return null;

  return (
    <VoxelRenderer frames={frames} fps={animFps} width={width} height={height} />
  );
}
