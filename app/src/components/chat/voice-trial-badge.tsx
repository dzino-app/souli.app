"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface TTSStatus {
  authenticated: boolean;
  tier?: "free" | "credits" | "monthly" | "yearly";
  allowed?: boolean;
  reason?: "paid" | "trial" | "trial_exhausted" | "no_credits";
  remainingCalls?: number;
  daysLeft?: number;
  trialLimit?: number;
  trialDays?: number;
}

export function VoiceTrialBadge() {
  const [status, setStatus] = useState<TTSStatus | null>(null);

  useEffect(() => {
    fetch("/api/voice/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status || !status.authenticated) return null;

  // Paid tier — no badge needed, they have unlimited
  if (status.reason === "paid") return null;

  // Trial exhausted — quiet indicator
  if (!status.allowed) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground"
        title="Premium hlas vypršal. Pre neural hlas si kúp kredity alebo predplatné."
      >
        <MicOff className="h-2.5 w-2.5" />
        Základný hlas
      </div>
    );
  }

  // Active trial
  const calls = status.remainingCalls ?? 0;
  const days = status.daysLeft ?? 0;
  const low = calls <= 5 || days <= 1;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
        low
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-primary/10 text-primary"
      }`}
      title={`Neural hlas — ${calls} správ alebo ${days} dní`}
    >
      <Mic className="h-2.5 w-2.5" />
      Neural {calls}/{status.trialLimit ?? 50}
    </div>
  );
}
