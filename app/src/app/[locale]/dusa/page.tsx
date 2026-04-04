"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Pencil,
  User,
  Briefcase,
  Heart,
  Target,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSoulFilesByCategory,
  CATEGORY_LABELS,
  isDefaultFile,
  createCustomSoulFile,
  deleteCustomSoulFile,
  type SoulFile,
  type SoulCategory,
} from "@/lib/soul";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  jadro: User,
  zaujmy: Heart,
  vztahy: Heart,
  praca: Briefcase,
  rast: Target,
  custom: Target,
};

const CATEGORY_OPTIONS: { value: SoulCategory; label: string }[] = [
  { value: "jadro", label: "Jadro" },
  { value: "zaujmy", label: "Záujmy" },
  { value: "vztahy", label: "Vzťahy" },
  { value: "praca", label: "Práca" },
  { value: "rast", label: "Rast" },
  { value: "custom", label: "Vlastné" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SoulPage() {
  const [groups, setGroups] = useState<Record<string, SoulFile[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SoulCategory>("custom");

  const refreshGroups = useCallback(() => {
    setGroups(getSoulFilesByCategory());
  }, []);

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  const slug = slugify(newName);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !slug) return;

    createCustomSoulFile(slug, newName.trim(), newCategory);
    setNewName("");
    setNewCategory("custom");
    setShowForm(false);
    refreshGroups();
  }

  function handleDelete(fileSlug: string) {
    if (isDefaultFile(fileSlug)) return;
    deleteCustomSoulFile(fileSlug);
    refreshGroups();
  }

  const categories = Object.keys(groups);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Môj Souli</h1>
            <p className="text-sm text-muted-foreground">
              Všetko, čo o Vás Dzino vie. Môžete čokoľvek upraviť.
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant={showForm ? "secondary" : "outline"}
          onClick={() => setShowForm(!showForm)}
          aria-label="Pridať súbor"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="py-4 px-4">
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Názov
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="napr. Jedlo, Cestovanie..."
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                {slug && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Slug: <span className="font-mono">{slug}.md</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Kategória
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SoulCategory)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" disabled={!newName.trim() || !slug}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Vytvoriť
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* File tree by category */}
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category] || Target;
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[category] || category}
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {groups[category].map((file) => (
                <div key={file.slug} className="flex items-center gap-1">
                  <Link href={`/dusa/${file.slug}`} className="flex-1 min-w-0">
                    <Card className="hover:bg-secondary transition-colors cursor-pointer">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{file.displayName}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {file.content
                                  .split("\n")
                                  .filter(
                                    (l) =>
                                      l.trim() &&
                                      !l.startsWith("#") &&
                                      !l.startsWith("_")
                                  )
                                  .slice(0, 1)
                                  .join("") || "Prázdny súbor"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground">
                              {file.updatedBy === "dzino" ? "Dzino" : "Vy"}
                            </span>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {!isDefaultFile(file.slug) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(file.slug)}
                      aria-label={`Odstrániť ${file.displayName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
