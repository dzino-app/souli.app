"use client";

import { useRef, useEffect, useCallback } from "react";
import { GRID_SIZE, type VoxelGrid } from "@/lib/voxel";

interface VoxelRendererProps {
  frames: VoxelGrid[];
  fps?: number;
  width?: number;
  height?: number;
}

// Isometric projection: convert 3D voxel coords to 2D screen coords
// Using a classic isometric view (30° angle)
const ISO_SCALE = 4; // pixels per voxel unit

function isoProject(
  x: number,
  y: number,
  z: number,
  offsetX: number,
  offsetY: number
): { sx: number; sy: number } {
  // Isometric projection
  const sx = (x - z) * ISO_SCALE * 0.866 + offsetX; // cos(30°) ≈ 0.866
  const sy = (x + z) * ISO_SCALE * 0.5 - y * ISO_SCALE + offsetY; // sin(30°) = 0.5
  return { sx, sy };
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function renderVoxelGrid(
  ctx: CanvasRenderingContext2D,
  grid: VoxelGrid,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const offsetX = canvasWidth / 2;
  const offsetY = canvasHeight * 0.75;

  // Render back-to-front, bottom-to-top for proper occlusion
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let z = GRID_SIZE - 1; z >= 0; z--) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = grid[y]?.[z]?.[x];
        if (!color) continue;

        const { sx, sy } = isoProject(x, y, z, offsetX, offsetY);
        const s = ISO_SCALE;
        const hs = s * 0.866; // horizontal scale
        const vs = s * 0.5; // vertical scale

        // Top face (brightest)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + hs, sy - s + vs);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx - hs, sy - s + vs);
        ctx.closePath();
        ctx.fill();

        // Left face (medium)
        ctx.fillStyle = darkenColor(color, 30);
        ctx.beginPath();
        ctx.moveTo(sx - hs, sy - s + vs);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx, sy + vs);
        ctx.lineTo(sx - hs, sy - s + 2 * vs);
        ctx.closePath();
        ctx.fill();

        // Right face (darkest)
        ctx.fillStyle = darkenColor(color, 60);
        ctx.beginPath();
        ctx.moveTo(sx + hs, sy - s + vs);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx, sy + vs);
        ctx.lineTo(sx + hs, sy - s + 2 * vs);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

export function VoxelRenderer({
  frames,
  fps = 8,
  width = 200,
  height = 200,
}: VoxelRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef(0);

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas || frames.length === 0) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const interval = 1000 / fps;
      if (timestamp - lastFrameTimeRef.current >= interval) {
        lastFrameTimeRef.current = timestamp;
        const frame = frames[frameIndexRef.current % frames.length];
        renderVoxelGrid(ctx, frame, width, height);
        frameIndexRef.current++;
      }

      animFrameRef.current = requestAnimationFrame(render);
    },
    [frames, fps, width, height]
  );

  useEffect(() => {
    // Render first frame immediately
    const canvas = canvasRef.current;
    if (canvas && frames.length > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        renderVoxelGrid(ctx, frames[0], width, height);
      }
    }

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render, frames, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        imageRendering: "pixelated",
        width: width,
        height: height,
      }}
    />
  );
}
