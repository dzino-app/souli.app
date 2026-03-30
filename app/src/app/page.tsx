import {
  FileText,
  Search,
  PenLine,
  Shield,
  BookOpen,
  HelpCircle,
  Upload,
  FileImage,
  ScanLine,
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

const sampleDocs = [
  { key: "rental", icon: FileText },
  { key: "insurance", icon: Shield },
  { key: "invoice", icon: FileImage },
  { key: "official", icon: ScanLine },
] as const;

export default function Home() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-8">
      {/* Upload zone */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
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

      {/* Sample documents */}
      <div>
        <p className="text-sm text-muted-foreground text-center mb-3">
          {t("home.trySample")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sampleDocs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{t(`home.sample.${key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("home.orChooseAction")}
          </span>
        </div>
      </div>

      {/* Action buttons grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("home.actionsTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actionKeys.map(({ key, icon: Icon }) => (
            <button
              key={key}
              className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary hover:border-primary/30 min-h-[68px]"
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

      {/* Search-bar style input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("home.searchPlaceholder")}
          className="w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Recent documents placeholder */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t("home.recentTitle")}</h2>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("home.recentEmpty")}
          </p>
        </div>
      </div>
    </div>
  );
}
