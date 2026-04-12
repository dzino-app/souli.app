"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  getSoulFiles,
  CATEGORY_LABELS,
  isSystemFile,
  type SoulFile,
} from "@/lib/soul";

const CATEGORY_COLORS: Record<string, string> = {
  jadro: "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/40",
  zaujmy: "border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/40",
  vztahy: "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40",
  praca: "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40",
  rast: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40",
  custom: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
};

const BADGE_COLORS: Record<string, string> = {
  jadro: "bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200",
  zaujmy: "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200",
  vztahy: "bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200",
  praca: "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
  rast: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
  custom: "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200",
};

function initPositions(files: SoulFile[]): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const cols = 4;
  const gapX = 240;
  const gapY = 200;
  files.forEach((f, i) => {
    map.set(f.slug, { x: 60 + (i % cols) * gapX, y: 60 + Math.floor(i / cols) * gapY });
  });
  return map;
}

function preview(content: string): string {
  return content
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("_"))
    .join(" ")
    .slice(0, 100);
}

export default function CanvasPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) ?? "sk";

  const [files, setFiles] = useState<SoulFile[]>([]);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragging = useRef<string | null>(null);
  const panning = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = getSoulFiles().filter((f) => !isSystemFile(f.slug));
    setFiles(all);
    setPositions(initPositions(all));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, slug: string) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = slug;
      const pos = positions.get(slug) ?? { x: 0, y: 0 };
      dragOffset.current = {
        x: e.clientX / zoom - pos.x - pan.x / zoom,
        y: e.clientY / zoom - pos.y - pan.y / zoom,
      };
    },
    [positions, zoom, pan],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) {
        const slug = dragging.current;
        setPositions((prev) => {
          const next = new Map(prev);
          next.set(slug, {
            x: e.clientX / zoom - dragOffset.current.x - pan.x / zoom,
            y: e.clientY / zoom - dragOffset.current.y - pan.y / zoom,
          });
          return next;
        });
      } else if (panning.current) {
        setPan((prev) => ({
          x: prev.x + e.clientX - lastPointer.current.x,
          y: prev.y + e.clientY - lastPointer.current.y,
        }));
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }
    },
    [zoom, pan],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
    panning.current = false;
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvas) {
      panning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.25, z - e.deltaY * 0.001)));
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm z-10">
        <button
          onClick={() => router.push(`/${locale}/dusa`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Spat
        </button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="p-1.5 rounded-md hover:bg-secondary" title="Priblizit">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.2))} className="p-1.5 rounded-md hover:bg-secondary" title="Oddalit">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={resetView} className="p-1.5 rounded-md hover:bg-secondary" title="Resetovat pohlad">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)",
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        data-canvas="true"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {files.map((file) => {
            const pos = positions.get(file.slug) ?? { x: 0, y: 0 };
            const cardColor = CATEGORY_COLORS[file.category] ?? CATEGORY_COLORS.custom;
            const badgeColor = BADGE_COLORS[file.category] ?? BADGE_COLORS.custom;
            const text = preview(file.content);
            return (
              <div
                key={file.slug}
                className={`absolute w-[200px] rounded-xl border shadow-sm p-3 cursor-grab active:cursor-grabbing touch-none ${cardColor}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  willChange: "transform",
                }}
                onPointerDown={(e) => handlePointerDown(e, file.slug)}
                onDoubleClick={() => router.push(`/${locale}/dusa/${file.slug}`)}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-sm font-semibold leading-tight truncate">
                    {file.displayName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${badgeColor}`}>
                    {CATEGORY_LABELS[file.category] ?? file.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {text || "Prazdny subor"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
