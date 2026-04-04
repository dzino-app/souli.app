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
  ChevronDown,
  ChevronRight,
  History,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSoulFilesByCategory,
  getSoulFile,
  CATEGORY_LABELS,
  isDefaultFile,
  createCustomSoulFile,
  deleteCustomSoulFile,
  type SoulFile,
  type SoulCategory,
} from "@/lib/soul";
import {
  getChangelogGrouped,
  simpleDiff,
  relativeTime,
  type ChangelogGroup,
  type SoulChangeEntry,
} from "@/lib/soul-changelog";

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

// ---- Change type emoji ----
function changeTypeEmoji(type: SoulChangeEntry["type"]): string {
  switch (type) {
    case "add": return "\u2795";
    case "update": return "\u270f\ufe0f";
    case "delete": return "\ud83d\uddd1\ufe0f";
  }
}

// ---- Diff display ----
function DiffView({ before, after }: { before: string; after: string }) {
  const lines = simpleDiff(before, after);
  if (lines.length === 0) return null;

  // Show at most 6 diff lines
  const visible = lines.slice(0, 6);
  const more = lines.length - visible.length;

  return (
    <div className="mt-1.5 text-xs font-mono leading-relaxed space-y-0.5 max-w-full overflow-hidden">
      {visible.map((line, i) => (
        <div
          key={i}
          className={`truncate px-1 rounded-sm ${
            line.type === "add"
              ? "text-green-600 dark:text-green-400 bg-green-500/10"
              : "text-red-600 dark:text-red-400 bg-red-500/10"
          }`}
        >
          {line.type === "add" ? "+ " : "- "}
          {line.text || " "}
        </div>
      ))}
      {more > 0 && (
        <p className="text-muted-foreground">... a {more} dalsich riadkov</p>
      )}
    </div>
  );
}

// ---- Changelog section ----
function ChangelogSection({ changelogGroups }: { changelogGroups: ChangelogGroup[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 0: true });
  const [showAll, setShowAll] = useState(false);
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

  if (changelogGroups.length === 0) return null;

  // Flatten all entries for counting
  const allEntries = changelogGroups.flatMap((g) => g.entries);
  const visibleLimit = 10;
  let shown = 0;

  function toggleGroup(idx: number) {
    setExpandedGroups((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  function toggleDiff(id: string) {
    setExpandedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function getFileName(slug: string): string {
    const file = getSoulFile(slug);
    return file?.displayName ?? slug;
  }

  function summarizeChange(entry: SoulChangeEntry): string {
    if (entry.type === "delete") return `Subor ${entry.slug}.md bol odstraneny`;
    if (entry.type === "add" && !entry.before) return `Novy subor ${entry.slug}.md`;

    const diff = simpleDiff(entry.before, entry.after);
    const adds = diff.filter((d) => d.type === "add").length;
    const removes = diff.filter((d) => d.type === "remove").length;

    const parts: string[] = [];
    if (adds > 0) parts.push(`+${adds}`);
    if (removes > 0) parts.push(`-${removes}`);
    return parts.length > 0 ? `${parts.join(", ")} riadkov` : "Zmena obsahu";
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Posledne zmeny
        </h2>
      </div>

      <div className="space-y-2">
        {changelogGroups.map((group, groupIdx) => {
          const isExpanded = !!expandedGroups[groupIdx];
          const entries = showAll ? group.entries : group.entries.slice(0, Math.max(0, visibleLimit - shown));

          if (!showAll && shown >= visibleLimit) return null;

          const element = (
            <div key={groupIdx}>
              <button
                onClick={() => toggleGroup(groupIdx)}
                className="flex items-center gap-1.5 w-full text-left py-1"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {group.label} ({group.entries.length})
                </span>
              </button>

              {isExpanded && (
                <div className="ml-5 space-y-1.5">
                  {entries.map((entry) => {
                    const isDiffOpen = !!expandedDiffs[entry.id];
                    return (
                      <button
                        key={entry.id}
                        onClick={() => toggleDiff(entry.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-2 py-1 px-2 rounded-md hover:bg-secondary/50 transition-colors">
                          <span className="text-sm shrink-0">{changeTypeEmoji(entry.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {getFileName(entry.slug)}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {entry.source === "dzino" ? "Dzino" : "Vy"}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">
                                {relativeTime(entry.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {summarizeChange(entry)}
                            </p>
                            {isDiffOpen && entry.type !== "delete" && (
                              <DiffView before={entry.before} after={entry.after} />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );

          shown += entries.length;
          return element;
        })}
      </div>

      {!showAll && allEntries.length > visibleLimit && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-xs"
          onClick={() => setShowAll(true)}
        >
          Zobrazit viac ({allEntries.length - visibleLimit} dalsich)
        </Button>
      )}
    </div>
  );
}

export default function SoulPage() {
  const [groups, setGroups] = useState<Record<string, SoulFile[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SoulCategory>("custom");
  const [changelogGroups, setChangelogGroups] = useState<ChangelogGroup[]>([]);

  const refreshGroups = useCallback(() => {
    setGroups(getSoulFilesByCategory());
    setChangelogGroups(getChangelogGrouped());
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

      {/* Changelog section */}
      <ChangelogSection changelogGroups={changelogGroups} />

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
