"use client";

import { useState } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AvatarAppearance, AvatarState } from "@/lib/avatar";

const ACTIVITIES: { value: AvatarState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
  { value: "waving", label: "Waving" },
  { value: "walking", label: "Walking" },
  { value: "talking", label: "Talking" },
  { value: "thinking", label: "Thinking" },
  { value: "eating", label: "Eating" },
  { value: "sleeping", label: "Sleeping" },
];

interface ShareGifProps {
  name: string;
  appearance: AvatarAppearance;
  level: number;
  avatarId?: string;
}

export function ShareGif({ name, appearance, level, avatarId }: ShareGifProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<AvatarState>("happy");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setPreviewUrl(null);
    try {
      const { generateAvatarGif } = await import("@/lib/gif-generator");
      const blob = await generateAvatarGif(appearance, level, selectedActivity);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.warn("GIF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleShare() {
    const { shareAvatarGif } = await import("@/lib/gif-generator");
    await shareAvatarGif(name, appearance, level, selectedActivity);
  }

  async function handleDownload() {
    const { downloadAvatarGif } = await import("@/lib/gif-generator");
    await downloadAvatarGif(name, appearance, level, selectedActivity);
  }

  async function handleUpload() {
    if (!avatarId) return;
    setGenerating(true);
    const { uploadAvatarGif } = await import("@/lib/gif-generator");
    const url = await uploadAvatarGif(avatarId, appearance, level, selectedActivity);
    if (url) setPreviewUrl(url);
    setGenerating(false);
  }

  return (
    <Card className="border-muted">
      <CardContent className="py-4 px-4 space-y-3">
        <p className="text-sm font-medium">GIF</p>

        {/* Activity picker */}
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITIES.map((a) => (
            <button
              key={a.value}
              onClick={() => { setSelectedActivity(a.value); setPreviewUrl(null); }}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                selectedActivity === a.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="flex justify-center py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${name} ${selectedActivity}`}
              className="w-32 h-32 rounded-lg bg-secondary"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 gap-1"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {previewUrl ? "Znova" : "Vygenerovať"}
          </Button>
          {previewUrl && (
            <>
              <Button size="sm" onClick={handleShare} className="gap-1">
                <Share2 className="h-3.5 w-3.5" /> Zdieľať
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {previewUrl && avatarId && (
            <Button size="sm" variant="ghost" onClick={handleUpload} disabled={generating} className="text-xs">
              Nahrať
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
