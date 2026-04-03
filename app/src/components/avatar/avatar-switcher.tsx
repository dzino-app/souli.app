"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { PixelAvatar } from "./pixel-avatar";
import { getActiveAvatarId, setActiveAvatarId } from "@/lib/avatars";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarAppearance } from "@/lib/avatar";

interface AvatarSwitcherProps {
  onSwitch?: (avatarId: string) => void;
}

export function AvatarSwitcher({ onSwitch }: AvatarSwitcherProps) {
  const [avatars, setAvatars] = useState<AvatarRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getActiveAvatarId();
    setActiveId(stored);

    fetch("/api/avatars")
      .then((r) => r.json())
      .then((data) => {
        if (data.avatars) {
          setAvatars(data.avatars);
          // If no active id yet, use the one from the DB
          if (!stored) {
            const active = data.avatars.find((a: AvatarRow) => a.is_active);
            if (active) {
              setActiveId(active.id);
              setActiveAvatarId(active.id);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Don't show if only 1 avatar or none
  if (loading || avatars.length <= 1) return null;

  const active = avatars.find((a) => a.id === activeId) ?? avatars[0];

  async function handleSwitch(avatarId: string) {
    setOpen(false);
    setActiveId(avatarId);
    setActiveAvatarId(avatarId);

    try {
      await fetch(`/api/avatars/${avatarId}/activate`, { method: "POST" });
    } catch {
      // Optimistic update already done
    }

    onSwitch?.(avatarId);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors text-sm"
      >
        <div className="shrink-0">
          <PixelAvatar
            state="idle"
            appearance={active.appearance as AvatarAppearance}
            level={active.level}
            size="sm"
          />
        </div>
        <span className="font-medium truncate max-w-[100px]">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border bg-background shadow-lg z-50 py-1">
          {avatars.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSwitch(a.id)}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-secondary/60 transition-colors text-left"
            >
              <div className="shrink-0">
                <PixelAvatar
                  state="idle"
                  appearance={a.appearance as AvatarAppearance}
                  level={a.level}
                  size="sm"
                />
              </div>
              <span className="text-sm font-medium truncate flex-1">{a.name}</span>
              {a.id === activeId && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
