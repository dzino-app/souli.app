"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSoulGraph, type GraphNode } from "@/lib/soul-graph";
import * as d3 from "d3";

const CATEGORY_COLORS: Record<string, string> = {
  jadro: "#a855f7",   // purple
  zaujmy: "#ec4899",  // pink
  vztahy: "#ef4444",  // red
  praca: "#3b82f6",   // blue
  rast: "#22c55e",    // green
  custom: "#f59e0b",  // amber
};

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

export default function GrafPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "sk";
  const [hovered, setHovered] = useState<SimNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { nodes: rawNodes, links: rawLinks } = buildSoulGraph();
    if (rawNodes.length === 0) return;

    const nodes: SimNode[] = rawNodes.map((n) => ({ ...n }));
    const links: SimLink[] = rawLinks.map((l) => ({ ...l }));

    const ctx = canvas.getContext("2d")!;
    let width = canvas.parentElement!.clientWidth;
    let height = canvas.parentElement!.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      width = canvas!.parentElement!.clientWidth;
      height = canvas!.parentElement!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => d.size + 4));

    let transform = d3.zoomIdentity;

    function draw() {
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Links
      ctx.strokeStyle = "rgba(150,150,150,0.3)";
      ctx.lineWidth = 1;
      for (const link of links) {
        const s = link.source as SimNode;
        const t = link.target as SimNode;
        if (s.x == null || t.x == null) continue;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y!);
        ctx.lineTo(t.x, t.y!);
        ctx.stroke();
      }

      // Nodes
      for (const node of nodes) {
        if (node.x == null) continue;
        ctx.beginPath();
        ctx.arc(node.x, node.y!, node.size, 0, Math.PI * 2);
        ctx.fillStyle = CATEGORY_COLORS[node.category] ?? "#888";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Labels
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (const node of nodes) {
        if (node.x == null) continue;
        ctx.fillStyle = "rgba(200,200,200,0.9)";
        ctx.fillText(node.label, node.x, node.y! + node.size + 4);
      }

      ctx.restore();
    }

    simulation.on("tick", draw);

    // Zoom
    const zoomBehavior = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        transform = event.transform;
        draw();
      });

    const canvasSel = d3.select(canvas);
    canvasSel.call(zoomBehavior);

    // Hit test helper
    function findNode(mx: number, my: number): SimNode | null {
      const [x, y] = transform.invert([mx, my]);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (n.x == null) continue;
        const dx = x - n.x;
        const dy = y - n.y!;
        if (dx * dx + dy * dy < (n.size + 4) * (n.size + 4)) return n;
      }
      return null;
    }

    // Hover
    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const node = findNode(e.clientX - rect.left, e.clientY - rect.top);
      canvas!.style.cursor = node ? "pointer" : "grab";
      setHovered(node);
    }

    // Click
    function handleClick(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const node = findNode(e.clientX - rect.left, e.clientY - rect.top);
      if (node) {
        router.push(`/${locale}/dusa/${node.id}`);
      }
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    window.addEventListener("resize", () => {
      resize();
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    });

    // Drag
    let dragNode: SimNode | null = null;

    canvasSel.call(
      d3
        .drag<HTMLCanvasElement, unknown>()
        .subject((event) => {
          const node = findNode(event.x, event.y);
          return node ?? undefined;
        })
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          dragNode = event.subject as SimNode;
          dragNode.fx = dragNode.x;
          dragNode.fy = dragNode.y;
        })
        .on("drag", (event) => {
          if (!dragNode) return;
          const [x, y] = transform.invert([event.sourceEvent.offsetX, event.sourceEvent.offsetY]);
          dragNode.fx = x;
          dragNode.fy = y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          if (dragNode) {
            dragNode.fx = null;
            dragNode.fy = null;
            dragNode = null;
          }
        }),
    );

    return () => {
      simulation.stop();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [locale, router]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <Button size="icon" variant="ghost" onClick={() => router.push(`/${locale}/dusa`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Graf duše</h1>
        {hovered && (
          <span className="text-sm text-muted-foreground ml-auto">
            {hovered.label}
          </span>
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="flex gap-3 px-4 py-2 flex-wrap shrink-0">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}
