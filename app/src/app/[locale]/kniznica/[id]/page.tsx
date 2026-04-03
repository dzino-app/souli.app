"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Flag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { Link } from "@/i18n/routing";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarAppearance } from "@/lib/avatar";

const SPECIES_LABELS: Record<string, string> = {
  human: "Človek",
  cat: "Mačka",
  dog: "Pes",
  bunny: "Zajac",
  bear: "Medveď",
  fox: "Líška",
};

interface SoulFileInfo {
  slug: string;
  display_name: string;
  category: string;
  content?: string;
}

export default function AvatarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [avatar, setAvatar] = useState<AvatarRow | null>(null);
  const [soulFiles, setSoulFiles] = useState<SoulFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/library/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAvatar(data.avatar ?? null);
        setSoulFiles(data.soulFiles ?? []);
      })
      .catch(() => setAvatar(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleLoad() {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/library/${id}/load`, { method: "POST" });
      if (res.ok) {
        setLoaded(true);
        // Increment the counter locally for UI feedback
        if (avatar) {
          setAvatar({ ...avatar, times_loaded: avatar.times_loaded + 1 });
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleReport() {
    if (!reportReason.trim()) return;
    try {
      await fetch(`/api/library/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      setReportSent(true);
      setReporting(false);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-muted-foreground">Avatar nebol nájdený</p>
        <Link href="/kniznica">
          <Button variant="outline">Späť do knižnice</Button>
        </Link>
      </div>
    );
  }

  const speciesLabel = SPECIES_LABELS[avatar.appearance.species] ?? avatar.appearance.species;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{avatar.name}</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ animation: "float 3s ease-in-out infinite" }}>
          <PixelAvatar
            state="idle"
            appearance={avatar.appearance as AvatarAppearance}
            level={avatar.level}
            size="lg"
          />
        </div>
        <h2 className="text-xl font-bold">{avatar.name}</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{speciesLabel}</span>
          <span>Lv. {avatar.level}</span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {avatar.times_loaded}x načítaný
          </span>
        </div>

        {/* Tags */}
        {avatar.tags && avatar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {avatar.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-secondary rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {avatar.public_description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm">{avatar.public_description}</p>
          </CardContent>
        </Card>
      )}

      {/* Load button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleLoad}
        disabled={loadingAction || loaded}
      >
        {loaded ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Načítaný!
          </>
        ) : loadingAction ? (
          "Načítavam..."
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Načítať avatara
          </>
        )}
      </Button>

      {/* Public soul files */}
      {soulFiles.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Súbory duše
          </h3>
          {soulFiles.map((sf) => (
            <Card key={sf.slug}>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-2">{sf.display_name}</h4>
                {sf.content ? (
                  <MarkdownResponse content={sf.content} />
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {sf.slug}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report */}
      <div className="pt-4 border-t">
        {reportSent ? (
          <p className="text-xs text-muted-foreground text-center">
            Nahlásenie bolo odoslané. Ďakujeme.
          </p>
        ) : reporting ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Dôvod nahlásenia..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleReport}>
                Odoslať
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReporting(false)}>
                Zrušiť
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors mx-auto"
          >
            <Flag className="h-3 w-3" />
            Nahlásiť
          </button>
        )}
      </div>
    </div>
  );
}
