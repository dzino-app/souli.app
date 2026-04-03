"use client";

import { useState } from "react";
import { Share2, X, Copy, Check } from "lucide-react";
import { getGamification } from "@/lib/gamification";

interface ShareCompletionProps {
  challengeText: string;
}

const SHARE_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: "💬", urlFn: (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}` },
  { id: "telegram", label: "Telegram", icon: "✈️", urlFn: (text: string) => `https://t.me/share/url?text=${encodeURIComponent(text)}` },
  { id: "facebook", label: "Facebook", icon: "📘", urlFn: (_text: string, url: string) => `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(_text)}&u=${encodeURIComponent(url)}` },
  { id: "x", label: "X", icon: "𝕏", urlFn: (text: string) => `https://x.com/intent/tweet?text=${encodeURIComponent(text)}` },
  { id: "instagram", label: "Instagram", icon: "📷", urlFn: () => null }, // Instagram doesn't support share URLs — copy instead
  { id: "email", label: "Email", icon: "📧", urlFn: (text: string) => `mailto:?subject=${encodeURIComponent("Dzino výzva!")}&body=${encodeURIComponent(text)}` },
] as const;

export function ShareCompletion({ challengeText }: ShareCompletionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const streak = getGamification().streak;
  const url = typeof window !== "undefined" ? window.location.origin : "https://dzino.app";
  const shareText = `🔥 Splnil som výzvu na Dzino: ${challengeText}! Už ${streak} dní v rade. Skús aj ty → ${url}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleChannel(channel: typeof SHARE_CHANNELS[number]) {
    const channelUrl = channel.urlFn(shareText, url);
    if (channelUrl) {
      window.open(channelUrl, "_blank", "noopener,noreferrer");
    } else {
      // Instagram — just copy
      handleCopy();
    }
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        title="Zdieľať"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
      <div
        className="bg-background rounded-t-xl sm:rounded-xl w-full max-w-sm p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Zdieľať výzvu</h3>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground bg-muted rounded p-2">{shareText}</p>

        <div className="grid grid-cols-3 gap-2">
          {SHARE_CHANNELS.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannel(channel)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-xl">{channel.icon}</span>
              <span className="text-[10px]">{channel.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Skopírované!" : "Kopírovať text"}
        </button>
      </div>
    </div>
  );
}
