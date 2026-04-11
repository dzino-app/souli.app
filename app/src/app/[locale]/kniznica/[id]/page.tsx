"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Flag, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoredAvatar } from "@/components/avatar/stored-avatar";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { getAvatarResolution } from "@/lib/avatar-resolution";
import { Link } from "@/i18n/routing";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarAppearance, AvatarState, SoundDNA } from "@/lib/avatar";
import { ShareGif } from "@/components/avatar/share-gif";

const SPECIES_EMOJI: Record<string, string> = {
  human: "\ud83e\uddd1",
  cat: "\ud83d\udc31",
  dog: "\ud83d\udc36",
  bunny: "\ud83d\udc30",
  bear: "\ud83d\udc3b",
  fox: "\ud83e\udd8a",
};

const SPECIES_LABELS: Record<string, string> = {
  human: "Človek",
  cat: "Mačka",
  dog: "Pes",
  bunny: "Zajac",
  bear: "Medveď",
  fox: "Líška",
};

const ANIMATION_STATES: Array<{ state: AvatarState; emoji: string; label: string }> = [
  { state: "idle", emoji: "\ud83d\ude0c", label: "Pokojný" },
  { state: "happy", emoji: "\ud83d\ude04", label: "Šťastný" },
  { state: "sad", emoji: "\ud83d\ude22", label: "Smutný" },
  { state: "walking", emoji: "\ud83d\udeb6", label: "Kráča" },
  { state: "talking", emoji: "\ud83d\udde3\ufe0f", label: "Rozpráva" },
  { state: "thinking", emoji: "\ud83e\udd14", label: "Premýšľa" },
  { state: "waving", emoji: "\ud83d\udc4b", label: "Máva" },
  { state: "eating", emoji: "\ud83c\udf7d\ufe0f", label: "Je" },
  { state: "sleeping", emoji: "\ud83d\ude34", label: "Spí" },
];

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

  // Animation gallery state
  const [activeAnimation, setActiveAnimation] = useState<AvatarState>("idle");

  // Soul files expanded by default
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set(["osobnost", "zaujmy", "humor", "ciele", "filozofia", "vztahy", "praca", "vyzvy"]));

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

  function toggleSoulExpanded(slug: string) {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
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
        <p className="text-muted-foreground">Souli nebol nájdený</p>
        <Link href="/kniznica">
          <Button variant="outline">Späť do Pixoci</Button>
        </Link>
      </div>
    );
  }

  const appearance = avatar.appearance as AvatarAppearance;
  const speciesEmoji = SPECIES_EMOJI[appearance.species] ?? "";
  const speciesLabel = SPECIES_LABELS[appearance.species] ?? appearance.species;
  const resolution = getAvatarResolution(avatar.level);

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-lg mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted-foreground">Späť</span>
      </div>

      {/* Hero: Avatar + info */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <div
          className="relative"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          <StoredAvatar
            previewUrl={avatar.preview_url}
            animationUrls={avatar.animation_urls}
            state={activeAnimation}
            size="lg"
            fallbackAppearance={appearance}
            fallbackLevel={avatar.level}
          />
        </div>

        <h1 className="text-2xl font-bold">{avatar.name}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {speciesEmoji} {speciesLabel}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>Úr. {avatar.level}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{resolution.label}</span>
        </div>

        {/* Bio */}
        {avatar.public_description && (
          <p className="text-sm text-center text-muted-foreground max-w-xs leading-relaxed">
            {avatar.public_description}
          </p>
        )}

        {/* Tags */}
        {avatar.tags && avatar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {avatar.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-secondary rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Times loaded */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          Načítaný {avatar.times_loaded}×
        </div>
      </div>

      {/* Animation gallery */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Animácie
        </h3>
        <div className="flex flex-wrap gap-2">
          {ANIMATION_STATES.map(({ state, emoji, label }) => (
            <button
              key={state}
              type="button"
              onClick={() => setActiveAnimation(state)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                activeAnimation === state
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 border-border hover:bg-secondary"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Public soul files — collapsible */}
      {soulFiles.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Souli
          </h3>
          {soulFiles.map((sf) => {
            const expanded = expandedSlugs.has(sf.slug);
            return (
              <div
                key={sf.slug}
                className="rounded-lg border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSoulExpanded(sf.slug)}
                  className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {sf.display_name}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expanded && sf.content && (
                  <div className="px-4 pb-4 border-t">
                    <div className="pt-3 text-sm prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownResponse content={sf.content} />
                    </div>
                  </div>
                )}
                {expanded && !sf.content && (
                  <div className="px-4 pb-4 border-t">
                    <p className="pt-3 text-xs text-muted-foreground italic">
                      Obsah nie je dostupný
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
            Načítaný do Soulis!
          </>
        ) : loadingAction ? (
          "Načítavam..."
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Načítať do mojich Soulis
          </>
        )}
      </Button>

      {/* Share GIF */}
      {avatar && (
        <ShareGif
          name={avatar.name}
          appearance={avatar.appearance}
          level={avatar.level}
          soundDNA={avatar.sound_dna as unknown as SoundDNA | undefined}
          avatarId={avatar.id}
        />
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReporting(false)}
              >
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
