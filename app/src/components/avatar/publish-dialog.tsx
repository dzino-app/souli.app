"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Tag,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { getAvatarResolution } from "@/lib/avatar-resolution";
import { getSoulFiles, DEFAULT_SLUGS } from "@/lib/soul";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarAppearance } from "@/lib/avatar";

interface PublishDialogProps {
  avatar: AvatarRow;
  onClose: () => void;
  onPublished: () => void;
}

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

/** Slugs included by default for publishing */
const DEFAULT_INCLUDED: string[] = [
  "osobnost",
  "zaujmy",
  "humor",
  "preferencie",
];

const TOTAL_STEPS = 4;

export function PublishDialog({
  avatar,
  onClose,
  onPublished,
}: PublishDialogProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 — soul files
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(DEFAULT_INCLUDED);
  const [publicSoulContents, setPublicSoulContents] = useState<
    Record<string, string>
  >({});

  // Step 3 — bio + tags
  const [bio, setBio] = useState(avatar.public_description ?? "");
  const [tagsInput, setTagsInput] = useState(
    (avatar.tags ?? []).join(", ")
  );

  // Load soul files into editable state on mount
  useEffect(() => {
    const files = getSoulFiles();
    const contents: Record<string, string> = {};
    for (const f of files) {
      contents[f.slug] = f.content;
    }
    setPublicSoulContents(contents);
  }, []);

  const allSlugs = Object.keys(publicSoulContents).length > 0
    ? Object.keys(publicSoulContents)
    : (DEFAULT_SLUGS as unknown as string[]);

  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  }

  function updatePublicContent(slug: string, content: string) {
    setPublicSoulContents((prev) => ({ ...prev, [slug]: content }));
  }

  const handlePublish = useCallback(async () => {
    setSaving(true);
    try {
      const filteredContents: Record<string, string> = {};
      for (const slug of selectedSlugs) {
        if (publicSoulContents[slug] !== undefined) {
          filteredContents[slug] = publicSoulContents[slug];
        }
      }

      await fetch(`/api/avatars/${avatar.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublic: true,
          description: bio || undefined,
          tags: parsedTags,
          publicSoulSlugs: selectedSlugs,
          publicSoulContents: filteredContents,
        }),
      });
      onPublished();
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [
    avatar.id,
    bio,
    parsedTags,
    selectedSlugs,
    publicSoulContents,
    onPublished,
    onClose,
  ]);

  const resolution = getAvatarResolution(avatar.level);
  const speciesEmoji =
    SPECIES_EMOJI[(avatar.appearance as AvatarAppearance).species] ?? "";
  const speciesLabel =
    SPECIES_LABELS[(avatar.appearance as AvatarAppearance).species] ??
    (avatar.appearance as AvatarAppearance).species;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="p-1 hover:bg-secondary rounded"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold">Publikovať avatara</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Krok {step} z {TOTAL_STEPS}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 mx-auto w-full max-w-lg px-4 py-6">
        {step === 1 && <StepWarning onContinue={() => setStep(2)} onCancel={onClose} />}

        {step === 2 && (
          <StepEditSouls
            allSlugs={allSlugs}
            selectedSlugs={selectedSlugs}
            publicSoulContents={publicSoulContents}
            onToggle={toggleSlug}
            onUpdateContent={updatePublicContent}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepBioTags
            bio={bio}
            setBio={setBio}
            tagsInput={tagsInput}
            setTagsInput={setTagsInput}
            parsedTags={parsedTags}
            speciesLabel={speciesLabel}
            onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepPreview
            avatar={avatar}
            bio={bio}
            parsedTags={parsedTags}
            selectedSlugs={selectedSlugs}
            speciesEmoji={speciesEmoji}
            speciesLabel={speciesLabel}
            resolution={resolution}
            saving={saving}
            onPublish={handlePublish}
          />
        )}
      </div>
    </div>
  );
}

/* ---- Step 1: Warning ---- */

function StepWarning({
  onContinue,
  onCancel,
}: {
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-6 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold">
          Pozor: Tieto údaje budú verejné
        </h3>
        <p className="text-sm text-muted-foreground">
          Bude zdieľané: meno, vzhľad, úroveň a vybrané časti duše
        </p>
      </div>

      <div className="rounded-lg border bg-secondary/30 p-4">
        <p className="text-sm leading-relaxed">
          Skontroluj, či duša neobsahuje osobné údaje (mená, adresy,
          telefónne čísla). V ďalšom kroku budeš môcť upraviť verejnú
          verziu každého súboru duše.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button size="lg" className="w-full" onClick={onContinue}>
          Pokračovať
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={onCancel}
        >
          Zrušiť
        </Button>
      </div>
    </div>
  );
}

/* ---- Step 2: Edit public soul copies ---- */

function StepEditSouls({
  allSlugs,
  selectedSlugs,
  publicSoulContents,
  onToggle,
  onUpdateContent,
  onContinue,
}: {
  allSlugs: string[];
  selectedSlugs: string[];
  publicSoulContents: Record<string, string>;
  onToggle: (slug: string) => void;
  onUpdateContent: (slug: string, content: string) => void;
  onContinue: () => void;
}) {
  const soulFileNames = getSoulFiles();
  const displayNameMap: Record<string, string> = {};
  for (const f of soulFileNames) {
    displayNameMap[f.slug] = f.displayName;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-semibold mb-1">Vyber a uprav súbory duše</h3>
        <p className="text-sm text-muted-foreground">
          Verejná verzia (úpravy sa neprenesú do tvojej duše)
        </p>
      </div>

      {allSlugs.map((slug) => {
        const included = selectedSlugs.includes(slug);
        const displayName = displayNameMap[slug] ?? slug;

        return (
          <div key={slug} className="rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => onToggle(slug)}
              className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                included
                  ? "bg-primary/5 border-b"
                  : "bg-secondary/30"
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  included
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {included && <Check className="h-3 w-3" />}
              </div>
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {slug}
              </span>
            </button>

            {included && (
              <div className="p-3">
                <textarea
                  value={publicSoulContents[slug] ?? ""}
                  onChange={(e) => onUpdateContent(slug, e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono min-h-[120px] resize-y"
                />
              </div>
            )}
          </div>
        );
      })}

      <Button size="lg" className="w-full mt-2" onClick={onContinue}>
        Pokračovať
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/* ---- Step 3: Bio + tags ---- */

function StepBioTags({
  bio,
  setBio,
  tagsInput,
  setTagsInput,
  parsedTags,
  speciesLabel,
  onContinue,
}: {
  bio: string;
  setBio: (v: string) => void;
  tagsInput: string;
  setTagsInput: (v: string) => void;
  parsedTags: string[];
  speciesLabel: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Bio a štítky</h3>
        <p className="text-sm text-muted-foreground">
          Doplň krátky popis a štítky pre lepšie vyhľadávanie
        </p>
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Krátky popis tvojho Dzina
        </label>
        <textarea
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= 200) setBio(e.target.value);
          }}
          placeholder="Napr.: Veselý mačací parťák, ktorý miluje prírodu"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {bio.length}/200
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          <Tag className="h-3.5 w-3.5 inline mr-1" />
          Štítky (oddelené čiarkou)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={`${speciesLabel.toLowerCase()}, priateľský, vtipný`}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />

        {/* Tag pills preview */}
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Button size="lg" className="w-full mt-2" onClick={onContinue}>
        Pokračovať
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/* ---- Step 4: Preview + publish ---- */

function StepPreview({
  avatar,
  bio,
  parsedTags,
  selectedSlugs,
  speciesEmoji,
  speciesLabel,
  resolution,
  saving,
  onPublish,
}: {
  avatar: AvatarRow;
  bio: string;
  parsedTags: string[];
  selectedSlugs: string[];
  speciesEmoji: string;
  speciesLabel: string;
  resolution: ReturnType<typeof getAvatarResolution>;
  saving: boolean;
  onPublish: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Náhľad</h3>
        <p className="text-sm text-muted-foreground">
          Takto bude tvoj avatar vyzerať v knižnici
        </p>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border-2 p-6 flex flex-col items-center gap-4">
        <div
          className="relative"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          <PixelAvatar
            state="idle"
            appearance={avatar.appearance as AvatarAppearance}
            level={avatar.level}
            size="lg"
          />
        </div>

        <h4 className="text-xl font-bold">{avatar.name}</h4>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {speciesEmoji} {speciesLabel}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>Úr. {avatar.level}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{resolution.label}</span>
        </div>

        {bio && (
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            {bio}
          </p>
        )}

        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-secondary rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {selectedSlugs.length}{" "}
          {selectedSlugs.length === 1
            ? "súbor duše"
            : selectedSlugs.length < 5
              ? "súbory duše"
              : "súborov duše"}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={onPublish}
        disabled={saving}
      >
        {saving ? "Publikujem..." : "Publikovať"}
      </Button>
    </div>
  );
}
