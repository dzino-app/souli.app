"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Brain, Pencil, Trash2, Check, X, User, Briefcase, Settings2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMemories, deleteMemory, updateMemory, type Memory } from "@/lib/memory";

const CATEGORY_ICONS = {
  personal: User,
  work: Briefcase,
  preferences: Settings2,
  documents: FileText,
};

const CATEGORY_KEYS = {
  personal: "categoryPersonal",
  work: "categoryWork",
  preferences: "categoryPreferences",
  documents: "categoryDocuments",
} as const;

export default function MemoryPage() {
  const t = useTranslations("memory");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setMemories(getMemories());
  }, []);

  function handleDelete(id: string) {
    const updated = deleteMemory(id);
    setMemories(updated);
  }

  function handleStartEdit(memory: Memory) {
    setEditingId(memory.id);
    setEditText(memory.fact);
  }

  function handleSaveEdit(id: string) {
    if (editText.trim()) {
      const updated = updateMemory(id, editText.trim());
      setMemories(updated);
    }
    setEditingId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  // Group memories by category
  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    const cat = m.category || "personal";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const categories = Object.keys(grouped) as Array<keyof typeof CATEGORY_ICONS>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Empty state */}
      {memories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      )}

      {/* Memory categories */}
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category] || User;
        const catKey = CATEGORY_KEYS[category] || "categoryPersonal";
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(catKey)}
              </h2>
              <span className="text-xs text-muted-foreground">
                ({grouped[category].length})
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {grouped[category].map((memory) => (
                <Card key={memory.id}>
                  <CardContent className="py-3 px-4">
                    {editingId === memory.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(memory.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSaveEdit(memory.id)}
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm flex-1">{memory.fact}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(memory)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(memory.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
