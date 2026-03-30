"use client";

import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type ActionKey =
  | "summarize"
  | "explain"
  | "risks"
  | "keyPoints"
  | "write"
  | "ask";

interface DocumentViewProps {
  file: File;
  action: ActionKey;
  onBack: () => void;
}

export function DocumentView({ file, action, onBack }: DocumentViewProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="font-medium text-sm truncate">{file.name}</span>
        </div>
      </div>

      {/* Selected action badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {t(`actions.${action}`)}
        </span>
        <span className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(0)} KB
        </span>
      </div>

      {/* Response area */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center gap-3">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">
              {t("document.processing")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Question input for follow-up */}
      <div className="relative">
        <input
          type="text"
          placeholder={t("document.followUpPlaceholder")}
          className="w-full rounded-lg border bg-background py-3 pl-4 pr-20 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          size="sm"
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
        >
          {t("common.send")}
        </Button>
      </div>
    </div>
  );
}
