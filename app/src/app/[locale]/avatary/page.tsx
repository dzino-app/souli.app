"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Plus, Check, Trash2, Globe, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { PublishDialog } from "@/components/avatar/publish-dialog";
import { Link } from "@/i18n/routing";
import { setActiveAvatarId } from "@/lib/avatars";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarAppearance } from "@/lib/avatar";

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<AvatarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishTarget, setPublishTarget] = useState<AvatarRow | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch("/api/avatars");
      const data = await res.json();
      setAvatars(data.avatars ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  async function handleActivate(id: string) {
    // Optimistic update
    setAvatars((prev) =>
      prev.map((a) => ({ ...a, is_active: a.id === id }))
    );
    setActiveAvatarId(id);

    try {
      await fetch(`/api/avatars/${id}/activate`, { method: "POST" });
    } catch {
      // revert on error
      fetchAvatars();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Naozaj chceš vymazať tohto avatara?")) return;

    try {
      const res = await fetch(`/api/avatars/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAvatars((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Nepodarilo sa vymazať");
      }
    } catch {
      // ignore
    }
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }

    try {
      await fetch(`/api/avatars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      setAvatars((prev) =>
        prev.map((a) => (a.id === id ? { ...a, name: renameValue.trim() } : a))
      );
    } catch {
      // ignore
    } finally {
      setRenamingId(null);
    }
  }

  async function handleCreateNew() {
    // Create with random appearance
    const speciesList = ["human", "cat", "dog", "bunny", "bear", "fox"];
    const bodyColors = ["#4F46E5", "#E11D48", "#16A34A", "#F59E0B", "#8B5CF6", "#06B6D4"];
    const skinColors = ["#FDDCB5", "#F5C6A0", "#FFE4C9", "#FFD6E0", "#E0D4FF", "#D4F0FF"];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const species = pick(speciesList);
    const earMap: Record<string, string> = { human: "none", cat: "pointy", dog: "floppy", bunny: "pointy", bear: "bear", fox: "pointy" };

    const appearance: AvatarAppearance = {
      species: species as AvatarAppearance["species"],
      bodyShape: pick(["round", "square", "tall"]) as AvatarAppearance["bodyShape"],
      eyeStyle: pick(["dots", "wide", "sleepy", "anime"]) as AvatarAppearance["eyeStyle"],
      mouthStyle: pick(["smile", "line", "open"]) as AvatarAppearance["mouthStyle"],
      earStyle: (earMap[species] ?? "none") as AvatarAppearance["earStyle"],
      accessory: pick(["none", "crown", "cap", "bow", "glasses"]) as AvatarAppearance["accessory"],
      hairStyle: (species === "human" ? pick(["none", "spiky", "tuft", "bangs"]) : "none") as AvatarAppearance["hairStyle"],
      skinColor: pick(skinColors),
      bodyColor: pick(bodyColors),
    };

    const name = `Dzino ${avatars.length + 1}`;
    const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;

    try {
      const res = await fetch("/api/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, appearance }),
      });
      if (res.ok) {
        fetchAvatars();
      }
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

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Moji avatary</h1>
          <p className="text-sm text-muted-foreground">
            {avatars.length} {avatars.length === 1 ? "avatar" : "avatarov"}
          </p>
        </div>
        <Button size="sm" onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-1" />
          Nový
        </Button>
      </div>

      {/* Avatar list */}
      <div className="flex flex-col gap-3">
        {avatars.map((a) => (
          <Card
            key={a.id}
            className={`transition-all ${
              a.is_active ? "border-primary shadow-sm shadow-primary/10" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Pixel preview */}
                <div className="shrink-0">
                  <PixelAvatar
                    state="idle"
                    appearance={a.appearance as AvatarAppearance}
                    level={a.level}
                    size="sm"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {renamingId === a.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(a.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="text-sm font-semibold bg-transparent border-b border-primary outline-none w-full"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => handleRename(a.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{a.name}</h3>
                      {a.is_active && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full shrink-0">
                          Aktívny
                        </span>
                      )}
                      {a.is_public && (
                        <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lv. {a.level} &middot; {a.xp} XP
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!a.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivate(a.id)}
                    >
                      Aktivovať
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setRenamingId(a.id);
                      setRenameValue(a.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setPublishTarget(a)}
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </Button>
                  {!a.is_active && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {avatars.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Zatiaľ nemáš žiadne avatary.</p>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-1" />
            Vytvoriť prvého
          </Button>
        </div>
      )}

      {/* Publish dialog */}
      {publishTarget && (
        <PublishDialog
          avatar={publishTarget}
          onClose={() => setPublishTarget(null)}
          onPublished={() => fetchAvatars()}
        />
      )}
    </div>
  );
}
