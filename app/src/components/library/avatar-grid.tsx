"use client";

import { AvatarCard } from "./avatar-card";
import type { AvatarRow } from "@/lib/supabase/avatars-db";

interface AvatarGridProps {
  avatars: AvatarRow[];
  locale: string;
}

export function AvatarGrid({ avatars, locale }: AvatarGridProps) {
  if (avatars.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Zatiaľ tu nie sú žiadne avatary.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {avatars.map((avatar) => (
        <AvatarCard key={avatar.id} avatar={avatar} locale={locale} />
      ))}
    </div>
  );
}
