"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Sticker } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAvatarData, type AvatarData } from "@/lib/avatar";
import { getGamification } from "@/lib/gamification";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { StickerPack } from "@/components/avatar/sticker-pack";

export default function StickersPage() {
  const t = useTranslations("stickers");
  const [data, setData] = useState<AvatarData | null>(null);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    setData(getAvatarData());
    setLevel(getGamification().level);
  }, []);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-full p-1 hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="rounded-full bg-primary/10 p-2">
          <Sticker className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold">{t("pageTitle")}</h1>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center py-2">
        <PixelAvatar
          state="happy"
          appearance={data.appearance}
          level={level}
          size="lg"
        />
      </div>

      {/* Sticker pack */}
      <StickerPack
        name={data.name}
        appearance={data.appearance}
        level={level}
      />
    </div>
  );
}
