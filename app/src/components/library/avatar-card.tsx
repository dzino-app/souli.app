"use client";

import Link from "next/link";
import { StoredAvatar } from "@/components/avatar/stored-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import type { AvatarRow } from "@/lib/supabase/avatars-db";

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

export function AvatarCard({ avatar, locale }: AvatarCardProps) {
  const speciesLabel = SPECIES_LABELS[avatar.appearance.species] ?? avatar.appearance.species;

  return (
    <Link href={`/${locale}/kniznica/${avatar.id}`}>
      <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center gap-2">
          <div className="py-2">
            <StoredAvatar
              previewUrl={avatar.preview_url}
              state="idle"
              size="sm"
              staticOnly
              fallbackAppearance={avatar.appearance}
              fallbackLevel={avatar.level}
            />
          </div>
          <h3 className="text-sm font-semibold truncate w-full text-center">
            {avatar.name}
          </h3>
          <p className="text-xs text-muted-foreground">{speciesLabel}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="h-3 w-3" />
            <span>{avatar.times_loaded}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
