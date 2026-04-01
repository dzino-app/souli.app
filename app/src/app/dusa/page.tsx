"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Pencil, User, Briefcase, Heart, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSoulFilesByCategory, CATEGORY_LABELS, type SoulFile } from "@/lib/soul";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  jadro: User,
  zaujmy: Heart,
  vztahy: Heart,
  praca: Briefcase,
};

export default function SoulPage() {
  const [groups, setGroups] = useState<Record<string, SoulFile[]>>({});

  useEffect(() => {
    setGroups(getSoulFilesByCategory());
  }, []);

  const categories = Object.keys(groups);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Moja duša</h1>
          <p className="text-sm text-muted-foreground">
            Všetko, čo o Vás Dzino vie. Môžete čokoľvek upraviť.
          </p>
        </div>
      </div>

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
                <Link key={file.slug} href={`/dusa/${file.slug}`}>
                  <Card className="hover:bg-secondary transition-colors cursor-pointer">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {file.content.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("_")).slice(0, 1).join("") || "Prázdny súbor"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {file.updatedBy === "dzino" ? "Dzino" : "Vy"}
                          </span>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
