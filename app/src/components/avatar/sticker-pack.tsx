"use client";

import { useState } from "react";
import { Download, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { AvatarAppearance } from "@/lib/avatar";
import type { GeneratedSticker } from "@/lib/sticker-pack";
import { STICKER_SET } from "@/lib/sticker-pack";

interface StickerPackProps {
  name: string;
  appearance: AvatarAppearance;
  level: number;
}

export function StickerPack({ name, appearance, level }: StickerPackProps) {
  const t = useTranslations("stickers");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stickers, setStickers] = useState<GeneratedSticker[]>([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { generateStickerPack } = await import("@/lib/sticker-pack");
      const result = await generateStickerPack(appearance, level);
      setStickers(result);
    } catch (err) {
      console.warn("Sticker generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const { downloadStickerPack } = await import("@/lib/sticker-pack");
      await downloadStickerPack(name, appearance, level);
    } catch (err) {
      console.warn("Sticker download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  function handleWhatsApp() {
    setShowWhatsApp((prev) => !prev);
  }

  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">
          {STICKER_SET.length} {t("stickersCount")}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{t("description")}</p>

      {/* Preview grid — labels only before generation, images after */}
      {stickers.length === 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {STICKER_SET.map((def) => (
            <Card key={def.filename} className="border-dashed">
              <CardContent className="py-3 px-2 text-center">
                <p className="text-lg">{def.label}</p>
                <p className="text-[10px] text-muted-foreground">{def.state}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {stickers.map((sticker, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sticker.url}
                alt={sticker.label}
                className="w-full aspect-square rounded-lg bg-secondary"
                style={{ imageRendering: "pixelated" }}
              />
              <p className="text-[10px] text-muted-foreground truncate w-full text-center">
                {sticker.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={stickers.length > 0 ? "outline" : "default"}
          onClick={handleGenerate}
          disabled={generating}
          className="flex-1 gap-1.5"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          {stickers.length > 0 ? t("regenerate") : t("generate")}
        </Button>

        {stickers.length > 0 && (
          <>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 gap-1.5"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {t("download")}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleWhatsApp}
              className="gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </>
        )}
      </div>

      {/* WhatsApp instructions */}
      {showWhatsApp && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-3 px-4 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {t("whatsappTitle")}
              </p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>{t("whatsappStep1")}</li>
              <li>{t("whatsappStep2")}</li>
              <li>{t("whatsappStep3")}</li>
            </ol>
            {isAndroid && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 gap-1.5 border-green-500/30 text-green-700 dark:text-green-400"
                onClick={() => {
                  window.open(
                    "intent://sticker-maker#Intent;scheme=https;package=com.marsvard.stickermakerforwhatsapp;end",
                  );
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {t("openStickerMaker")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
