"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StoryCard() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "sk";
  const t = useTranslations("story");
  return (
    <Link href={`/${locale}/pribeh`} className="group">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-colors">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="rounded-lg bg-primary/15 p-2.5 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-primary/80">{t("cardKicker")}</p>
            <h3 className="text-base font-semibold mt-0.5">{t("indexTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("cardSubtitle")}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
