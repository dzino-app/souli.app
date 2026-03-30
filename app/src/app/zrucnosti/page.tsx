"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Globe, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getSkills,
  createSkill,
  toggleSkillPublic,
  deleteSkill,
  type Skill,
} from "@/lib/skills";

export default function SkillsPage() {
  const t = useTranslations("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setSkills(getSkills());
  }, []);

  function handleCreate() {
    if (!name.trim() || !prompt.trim()) return;
    createSkill(name.trim(), description.trim(), prompt.trim());
    setSkills(getSkills());
    setCreating(false);
    setName("");
    setDescription("");
    setPrompt("");
  }

  function handleTogglePublic(id: string) {
    const updated = toggleSkillPublic(id);
    setSkills(updated);
  }

  function handleDelete(id: string) {
    const updated = deleteSkill(id);
    setSkills(updated);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("create")}
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <Card>
          <CardContent className="py-4 flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium">{t("name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("descriptionLabel")}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("prompt")}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("promptPlaceholder")}
                rows={3}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
                {t("cancel")}
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!name.trim() || !prompt.trim()}>
                {t("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {skills.length === 0 && !creating && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills list */}
      {skills.map((skill) => (
        <Card key={skill.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{skill.name}</h3>
                  {skill.isPublic ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <Globe className="h-3 w-3" />
                      {t("public")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" />
                      {t("private")}
                    </span>
                  )}
                </div>
                {skill.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {skill.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {skill.usageCount} {t("uses")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePublic(skill.id)}
                >
                  {skill.isPublic ? t("togglePrivate") : t("togglePublic")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(skill.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
