"use client";

import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EventsPage() {
  const t = useTranslations("companion");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t("events")}</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Udalosti sa pripravujú...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
