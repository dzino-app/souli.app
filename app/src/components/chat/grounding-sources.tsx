"use client";

import { ExternalLink, Globe } from "lucide-react";
import type { GroundingSource } from "@/lib/stream-response";

interface GroundingSourcesProps {
  sources: GroundingSource[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function GroundingSources({ sources }: GroundingSourcesProps) {
  if (!sources.length) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Globe className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Zdroje
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.slice(0, 5).map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-[11px] text-muted-foreground hover:text-foreground transition-colors max-w-[200px]"
            title={source.title}
          >
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">
              {source.title || getDomain(source.url)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
