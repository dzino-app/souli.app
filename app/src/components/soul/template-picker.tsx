"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SOUL_TEMPLATES, type SoulTemplate } from "@/lib/soul-templates";

interface TemplatePickerProps {
  existingSlugs: string[];
  onAdd: (template: SoulTemplate) => void;
}

export function TemplatePicker({ existingSlugs, onAdd }: TemplatePickerProps) {
  const [added, setAdded] = useState<Set<string>>(new Set());

  const available = SOUL_TEMPLATES.filter(
    (t) => !existingSlugs.includes(t.slug) && !added.has(t.slug),
  );

  if (available.length === 0) return null;

  function handleAdd(template: SoulTemplate) {
    onAdd(template);
    setAdded((prev) => new Set(prev).add(template.slug));
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        Pridať novú stránku duše
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {available.map((t) => (
          <Card
            key={t.slug}
            className="cursor-pointer hover:border-primary/40 transition-colors"
          >
            <CardContent className="py-3 px-3">
              <button
                type="button"
                onClick={() => handleAdd(t)}
                className="w-full text-left space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t.emoji} {t.displayName}
                  </span>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                  {t.description}
                </p>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
