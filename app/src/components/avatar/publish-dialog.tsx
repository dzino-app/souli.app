"use client";

import { useState } from "react";
import { X, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AvatarRow } from "@/lib/supabase/avatars-db";

interface PublishDialogProps {
  avatar: AvatarRow;
  onClose: () => void;
  onPublished: () => void;
}

const DEFAULT_SOUL_SLUGS = [
  "osobnost",
  "zaujmy",
  "humor",
  "preferencie",
];

export function PublishDialog({ avatar, onClose, onPublished }: PublishDialogProps) {
  const [isPublic, setIsPublic] = useState(avatar.is_public);
  const [description, setDescription] = useState(avatar.public_description ?? "");
  const [tagsInput, setTagsInput] = useState((avatar.tags ?? []).join(", "));
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(DEFAULT_SOUL_SLUGS);
  const [saving, setSaving] = useState(false);

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  }

  async function handleSave() {
    setSaving(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await fetch(`/api/avatars/${avatar.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublic,
          description: description || undefined,
          tags,
          publicSoulSlugs: isPublic ? selectedSlugs : [],
        }),
      });
      onPublished();
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-background border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Zdieľať avatara</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Visibility toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isPublic
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border"
              }`}
            >
              {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isPublic ? "Verejný" : "Súkromný"}
            </button>
          </div>

          {isPublic && (
            <>
              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1 block">Popis</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Napíš krátky popis avatara..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
                  maxLength={500}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-1 block">Štítky</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="vtipný, priateľský, mačka"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Oddelené čiarkou
                </p>
              </div>

              {/* Soul files to share */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Zdieľané duše
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Vyber, ktoré súbory duše budú viditeľné pre ostatných
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SOUL_SLUGS.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleSlug(slug)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        selectedSlugs.includes(slug)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border"
                      }`}
                    >
                      {slug}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Zrušiť
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Ukladám..." : "Uložiť"}
          </Button>
        </div>
      </div>
    </div>
  );
}
