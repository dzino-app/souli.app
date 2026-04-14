"use client";

import { useState } from "react";
import { Download, Loader2, MessageCircle, Smartphone, Send, Share2 } from "lucide-react";
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

const STICKER_EMOJI: Record<string, string> = {
  waving: "\u{1F44B}",
  happy: "\u{1F60A}",
  sad: "\u{1F61E}",
  thinking: "\u{1F914}",
  talking: "\u{1F4AC}",
  eating: "\u{1F35C}",
  sleeping: "\u{1F634}",
  walking: "\u{1F6B6}",
  idle: "\u{1F642}",
  dancing: "\u{1F57A}",
};

export function StickerPack({ name, appearance, level }: StickerPackProps) {
  const t = useTranslations("stickers");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stickers, setStickers] = useState<GeneratedSticker[]>([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [telegramUserId, setTelegramUserId] = useState("");
  const [telegramStatus, setTelegramStatus] = useState<string>("");
  const [telegramLoading, setTelegramLoading] = useState(false);

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

  /** Share a single sticker via Web Share API (works in any installed messenger). */
  async function handleShareOne(s: GeneratedSticker) {
    const file = new File([s.blob], `${name}-${s.state}.webp`, { type: "image/webp" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${name} — ${s.label}` });
      } catch {
        // user cancelled
      }
    } else {
      // Fallback: download
      const a = document.createElement("a");
      a.href = s.url;
      a.download = file.name;
      a.click();
    }
  }

  /** Share all stickers via Web Share API. */
  async function handleShareAll() {
    const files = stickers.map(
      (s) => new File([s.blob], `${name}-${s.state}.webp`, { type: "image/webp" }),
    );
    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({
          files,
          title: `${name} stickers`,
          text: `Nálepky Souliho z dzino.app`,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleDownload();
    }
  }

  /** Create a Telegram sticker pack via our Bot API endpoint. */
  async function handleTelegramCreate() {
    const userId = parseInt(telegramUserId.trim(), 10);
    if (!userId) {
      setTelegramStatus(t("telegramInvalidId"));
      return;
    }
    setTelegramLoading(true);
    setTelegramStatus("");
    try {
      // Convert blobs to base64
      const payload = await Promise.all(
        stickers.map(async (s) => ({
          data: await blobToBase64(s.blob),
          emoji: STICKER_EMOJI[s.state] || "\u2728",
        })),
      );

      const res = await fetch("/api/stickers/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId: userId,
          packTitle: `${name} — Souli`,
          stickers: payload,
        }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setTelegramStatus(`\u2713 ${json.url}`);
        window.open(json.url, "_blank");
      } else {
        setTelegramStatus(json.error || t("telegramFailed"));
      }
    } catch {
      setTelegramStatus(t("telegramFailed"));
    } finally {
      setTelegramLoading(false);
    }
  }

  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const canWebShare =
    typeof navigator !== "undefined" && "share" in navigator;

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

      {/* Preview grid */}
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
            <button
              key={i}
              type="button"
              onClick={() => handleShareOne(sticker)}
              className="flex flex-col items-center gap-1 group cursor-pointer"
              title={t("shareOne")}
            >
              <div className="relative w-full aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sticker.url}
                  alt={sticker.label}
                  className="w-full h-full rounded-lg bg-secondary"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/40 transition-colors">
                  <Share2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground truncate w-full text-center">
                {sticker.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={stickers.length > 0 ? "outline" : "default"}
          onClick={handleGenerate}
          disabled={generating}
          className="flex-1 gap-1.5 min-w-[120px]"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {stickers.length > 0 ? t("regenerate") : t("generate")}
        </Button>

        {stickers.length > 0 && (
          <>
            <Button size="sm" onClick={handleDownload} disabled={downloading} className="flex-1 gap-1.5 min-w-[120px]">
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {t("download")}
            </Button>

            {canWebShare && (
              <Button size="sm" variant="outline" onClick={handleShareAll} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                {t("shareAll")}
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={() => setShowWhatsApp((p) => !p)} className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>

            <Button size="sm" variant="outline" onClick={() => setShowTelegram((p) => !p)} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Telegram
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
            <p className="text-[11px] text-muted-foreground italic">
              {t("tipShareOne")}
            </p>
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

      {/* Telegram flow */}
      {showTelegram && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="py-3 px-4 space-y-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {t("telegramTitle")}
              </p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>{t("telegramStep1")} <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">@userinfobot</a></li>
              <li>{t("telegramStep2")}</li>
              <li>{t("telegramStep3")}</li>
            </ol>
            <div className="flex gap-2">
              <input
                type="text"
                value={telegramUserId}
                onChange={(e) => setTelegramUserId(e.target.value)}
                placeholder="123456789"
                inputMode="numeric"
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
              />
              <Button
                size="sm"
                onClick={handleTelegramCreate}
                disabled={telegramLoading || !telegramUserId}
                className="gap-1.5"
              >
                {telegramLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {t("telegramCreate")}
              </Button>
            </div>
            {telegramStatus && (
              <p className="text-xs text-muted-foreground break-all">{telegramStatus}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
