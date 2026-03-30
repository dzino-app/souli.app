"use client";

import { useState } from "react";
import {
  FileText,
  Shield,
  FileImage,
  ScanLine,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadZone } from "@/components/document/upload-zone";
import { DocumentActions } from "@/components/document/document-actions";
import { DocumentView, type ActionKey } from "@/components/document/document-view";

const sampleDocs = [
  { key: "rental", icon: FileText },
  { key: "insurance", icon: Shield },
  { key: "invoice", icon: FileImage },
  { key: "official", icon: ScanLine },
] as const;

export default function Home() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);

  // When in document view mode, show the analysis UI
  if (file && activeAction) {
    return (
      <DocumentView
        file={file}
        action={activeAction}
        onBack={() => setActiveAction(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Upload zone */}
      <UploadZone onFileSelect={setFile} />

      {/* Sample documents */}
      {!file && (
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
      )}

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
      <DocumentActions hasDocument={!!file} onAction={setActiveAction} />

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
      {!file && (
        <div>
          <h2 className="text-lg font-semibold mb-3">{t("home.recentTitle")}</h2>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("home.recentEmpty")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
