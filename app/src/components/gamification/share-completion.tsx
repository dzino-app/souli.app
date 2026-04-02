"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { getGamification } from "@/lib/gamification";

interface ShareCompletionProps {
  challengeText: string;
}

export function ShareCompletion({ challengeText }: ShareCompletionProps) {
  const [copied, setCopied] = useState(false);

  const streak = getGamification().streak;
  const url = typeof window !== "undefined" ? window.location.origin : "https://dzino.app";
  const shareText = `\ud83d\udd25 Splnil som vyzvu na Dzino: ${challengeText}! Uz ${streak} dni v rade. Skus aj ty \u2192 ${url}`;

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      title={copied ? "Skopirovane!" : "Zdielat"}
    >
      <Share2 className="h-3.5 w-3.5" />
      {copied && <span>Skopirovane!</span>}
    </button>
  );
}
