"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserSettings, updateSetting } from "@/lib/user-settings";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getUserSettings().soundEnabled);
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    updateSetting("soundEnabled", next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={enabled ? "Vypnúť zvuk" : "Zapnúť zvuk"}
      title={enabled ? "Vypnúť zvuk" : "Zapnúť zvuk"}
    >
      {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </Button>
  );
}
