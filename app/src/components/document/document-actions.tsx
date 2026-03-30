"use client";

import {
  FileText,
  Search,
  PenLine,
  Shield,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

const actionKeys = [
  { key: "summarize", icon: FileText },
  { key: "explain", icon: Search },
  { key: "risks", icon: Shield },
  { key: "keyPoints", icon: BookOpen },
  { key: "write", icon: PenLine },
  { key: "ask", icon: HelpCircle },
] as const;

interface DocumentActionsProps {
  hasDocument: boolean;
}

export function DocumentActions({ hasDocument }: DocumentActionsProps) {
  const t = useTranslations();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{t("home.actionsTitle")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actionKeys.map(({ key, icon: Icon }) => (
          <button
            key={key}
            disabled={!hasDocument && key !== "write" && key !== "ask"}
            className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary hover:border-primary/30 min-h-[68px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border"
          >
            <div className="rounded-md bg-primary/10 p-1.5 mt-0.5">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {t(`actions.${key}`)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t(`actions.${key}Desc`)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
