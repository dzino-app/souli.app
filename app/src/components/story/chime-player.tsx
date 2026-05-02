"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Volume2, Pause } from "lucide-react";

export function ChimePlayer() {
  const t = useTranslations("story");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4 my-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : t("chimePlay")}
          className="rounded-full bg-primary/15 hover:bg-primary/25 transition-colors p-3 shrink-0"
        >
          {playing ? (
            <Pause className="h-5 w-5 text-primary" />
          ) : (
            <Volume2 className="h-5 w-5 text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-primary/80">{t("chimeTitle")}</p>
          <p className="text-sm text-foreground/90 mt-0.5">{t("chimeDesc")}</p>
        </div>
      </div>
      <audio
        ref={audioRef}
        src="/sounds/chime.wav"
        preload="none"
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
