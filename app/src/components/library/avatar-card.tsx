"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StoredAvatar } from "@/components/avatar/stored-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarState } from "@/lib/avatar";

interface AvatarCardProps {
  avatar: AvatarRow;
  locale: string;
}

const SPECIES_LABELS: Record<string, string> = {
  human: "Človek",
  cat: "Mačka",
  dog: "Pes",
  bunny: "Zajac",
  bear: "Medveď",
  fox: "Líška",
};

const ACTIVITY_STATES: AvatarState[] = [
  "idle", "happy", "waving", "walking", "talking", "thinking", "eating", "sad",
];

export function AvatarCard({ avatar, locale }: AvatarCardProps) {
  const speciesLabel = SPECIES_LABELS[avatar.appearance.species] ?? avatar.appearance.species;
  const [currentState, setCurrentState] = useState<AvatarState>("idle");

  // Randomly cycle through activities
  useEffect(() => {
    // Start with a random offset so all cards don't sync
    const initialDelay = Math.random() * 3000;
    let intervalId: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        const nextState = ACTIVITY_STATES[Math.floor(Math.random() * ACTIVITY_STATES.length)];
        setCurrentState(nextState);
      }, 3000 + Math.random() * 2000); // switch every 3-5 seconds
    }, initialDelay);

    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <Link href={`/${locale}/kniznica/${avatar.id}`}>
      <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center gap-2">
          <div className="py-2">
            <StoredAvatar
              previewUrl={avatar.preview_url}
              animationUrls={avatar.animation_urls}
              state={currentState}
              size="sm"
              fallbackAppearance={avatar.appearance}
              fallbackLevel={avatar.level}
            />
          </div>
          <h3 className="text-sm font-semibold truncate w-full text-center">
            {avatar.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{speciesLabel}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">Úr. {avatar.level}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3 w-3" />
            <span>{avatar.times_loaded}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
