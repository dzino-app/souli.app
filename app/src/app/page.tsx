"use client";

import { useState } from "react";
import {
  FileText,
  Shield,
  FileImage,
  ScanLine,
  Search,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { UploadZone } from "@/components/document/upload-zone";
import { DocumentActions } from "@/components/document/document-actions";
import { DocumentView, type ActionKey } from "@/components/document/document-view";
import { QuestionView } from "@/components/chat/question-view";
import { Button } from "@/components/ui/button";

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
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");

  // Question view mode
  if (submittedQuestion) {
    return (
      <QuestionView
        question={submittedQuestion}
        onBack={() => setSubmittedQuestion("")}
      />
    );
  }

  // Document action view mode
  if (file && activeAction) {
    return (
      <DocumentView
        file={file}
        action={activeAction}
        onBack={() => setActiveAction(null)}
      />
    );
  }

  function handleQuestionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmittedQuestion(question.trim());
    setQuestion("");
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
      <form onSubmit={handleQuestionSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className="w-full rounded-lg border bg-background py-3 pl-10 pr-14 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!question.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

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
