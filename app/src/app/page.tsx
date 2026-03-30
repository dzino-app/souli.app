import {
  FileText,
  Search,
  PenLine,
  Shield,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const actionKeys = [
  { key: "summarize", icon: FileText },
  { key: "explain", icon: Search },
  { key: "risks", icon: Shield },
  { key: "keyPoints", icon: BookOpen },
  { key: "write", icon: PenLine },
  { key: "ask", icon: HelpCircle },
] as const;

export default function Home() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-8">
      {/* Upload zone */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">{t("home.uploadTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t("home.uploadDescription")}
          </p>
          <Button size="lg">{t("home.uploadButton")}</Button>
          <p className="text-xs text-muted-foreground mt-3">
            {t("home.uploadFormats")}
          </p>
        </CardContent>
      </Card>

      {/* Action buttons grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("home.actionsTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actionKeys.map(({ key, icon: Icon }) => (
            <button
              key={key}
              className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary min-h-[64px]"
            >
              <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-sm">
                  {t(`actions.${key}`)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t(`actions.${key}Desc`)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search-bar style input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("home.searchPlaceholder")}
          className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
