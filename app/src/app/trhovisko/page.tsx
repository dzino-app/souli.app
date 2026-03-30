"use client";

import { useEffect, useState } from "react";
import { Store, Sparkles, Download, Check, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSkills, createSkill, getSkills, type Skill } from "@/lib/skills";
import { FEATURED_SKILLS } from "@/lib/featured-skills";

export default function MarketplacePage() {
  const t = useTranslations("skills");
  const [communitySkills, setCommunitySkills] = useState<Skill[]>([]);
  const [ownSkillIds, setOwnSkillIds] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCommunitySkills(getPublicSkills());
    setOwnSkillIds(new Set(getSkills().map((s) => s.name)));
  }, []);

  function handleApply(skill: Skill) {
    createSkill(skill.name, skill.description, skill.systemPrompt);
    setApplied((prev) => new Set(Array.from(prev).concat(skill.id)));
    setOwnSkillIds(new Set(getSkills().map((s) => s.name)));
  }

  function renderSkillCard(skill: Skill, isFeatured: boolean) {
    const alreadyHave = ownSkillIds.has(skill.name) || applied.has(skill.id);
    return (
      <Card key={skill.id}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{skill.name}</h3>
                {isFeatured && (
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {skill.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {skill.usageCount} {t("uses")}
              </p>
            </div>
            <Button
              variant={alreadyHave ? "outline" : "default"}
              size="sm"
              disabled={alreadyHave}
              onClick={() => handleApply(skill)}
            >
              {alreadyHave ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t("applied")}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  {t("apply")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("marketplace")}</h1>
          <p className="text-sm text-muted-foreground">{t("marketplaceDesc")}</p>
        </div>
      </div>

      {/* Featured skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("featured")}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {FEATURED_SKILLS.map((skill) => renderSkillCard(skill, true))}
        </div>
      </div>

      {/* Community skills */}
      {communitySkills.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t("community")}
          </h2>
          <div className="flex flex-col gap-2">
            {communitySkills.map((skill) => renderSkillCard(skill, false))}
          </div>
        </div>
      )}
    </div>
  );
}
