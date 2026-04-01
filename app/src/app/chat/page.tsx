"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ChatPage() {
  const t = useTranslations("companion");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t("chat")}</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Chat sa pripravuje...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
