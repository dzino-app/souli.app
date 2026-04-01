"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SoulPage() {
  const t = useTranslations("companion");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t("soul")}</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Duša sa pripravuje...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
