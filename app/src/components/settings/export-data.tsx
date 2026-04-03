"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSoulFiles } from "@/lib/soul";
import { getConversations } from "@/lib/conversations";
import { getEvents } from "@/lib/events";
import { getGamification } from "@/lib/gamification";
import { getAvatarData } from "@/lib/avatar";
import { getMoodHistory } from "@/lib/mood-tracking";
import { getUserSettings } from "@/lib/user-settings";

interface Props {
  translations: {
    title: string;
    desc: string;
    button: string;
    loading: string;
  };
}

export function ExportData({ translations: t }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const payload = {
        soulFiles: getSoulFiles(),
        conversations: getConversations(),
        events: getEvents(),
        gamification: getGamification(),
        avatar: getAvatarData(),
        moodHistory: getMoodHistory(),
        settings: getUserSettings(),
      };

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dzino-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail — user sees spinner stop
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm font-medium mb-1">{t.title}</p>
        <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.loading}
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {t.button}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
