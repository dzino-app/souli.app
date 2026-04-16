"use client";

import { useState, useRef, useEffect } from "react";
import type { CreditState } from "@/lib/credits";

interface CreditDisplayProps {
  credits: CreditState;
  onUpgradeClick: () => void;
}

export function CreditDisplay({ credits, onUpgradeClick }: CreditDisplayProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isLow = credits.remaining <= 3 && credits.remaining > 0;
  const isEmpty = credits.remaining <= 0;

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const tierLabel: Record<string, string> = {
    free: "Zadarmo",
    credits: "Kredity",
    monthly: "Mesacny",
    yearly: "Rocny",
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          isEmpty
            ? "bg-destructive/15 text-destructive border border-destructive/30"
            : isLow
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            : "bg-muted text-muted-foreground border border-border"
        }`}
      >
        <span aria-hidden="true">&#128172;</span>
        <span>
          {credits.remaining}/{credits.total}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border bg-card shadow-lg p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{tierLabel[credits.tier] || credits.tier}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Zostava</span>
              <span className="font-medium">
                {credits.remaining} z {credits.total}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Obnova</span>
              <span className="font-medium">
                {new Date(credits.resetDate).toLocaleDateString("sk-SK")}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isEmpty
                    ? "bg-destructive"
                    : isLow
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{
                  width: `${credits.total > 0 ? Math.round((credits.remaining / credits.total) * 100) : 0}%`,
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onUpgradeClick();
              }}
              className="w-full mt-1 rounded-md bg-primary text-primary-foreground text-xs font-medium py-1.5 hover:bg-primary/90 transition-colors"
            >
              {isEmpty ? "Dokup kredity" : "Viac sprav"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
