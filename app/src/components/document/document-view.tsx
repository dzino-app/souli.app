"use client";

import { useEffect, useState } from "react";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { streamChatResponse } from "@/lib/stream-response";

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

async function readFileAsText(file: File): Promise<string> {
  // For text-based files, read directly
  // For images, we'll send a placeholder (real OCR would be needed)
  if (file.type.startsWith("image/")) {
    return `[Obrázok: ${file.name}]`;
  }
  return file.text();
}

export function DocumentView({ file, action, onBack }: DocumentViewProps) {
  const t = useTranslations();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const text = await readFileAsText(file);
        await streamChatResponse(text, action, undefined, (chunk) => {
          if (!cancelled) setResponse(chunk);
        });
      } catch {
        if (!cancelled) setError(t("common.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [file, action, t]);

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim()) return;

    setSendingFollowUp(true);
    setResponse("");
    setLoading(true);

    try {
      const text = await readFileAsText(file);
      await streamChatResponse(text, "ask", followUp, (chunk) => {
        setResponse(chunk);
      });
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
      setSendingFollowUp(false);
      setFollowUp("");
    }
  }

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
        <CardContent className="py-6">
          {error ? (
            <div className="text-center">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={onBack}>
                {t("common.back")}
              </Button>
            </div>
          ) : loading && !response ? (
            <div className="flex flex-col items-center text-center gap-3">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">
                {t("document.processing")}
              </p>
            </div>
          ) : (
            <div>
              <MarkdownResponse content={response} />
              {loading && (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin mt-2" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Follow-up question input */}
      <form onSubmit={handleFollowUp} className="relative">
        <input
          type="text"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder={t("document.followUpPlaceholder")}
          disabled={sendingFollowUp}
          className="w-full rounded-lg border bg-background py-3 pl-4 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          type="submit"
          size="sm"
          disabled={sendingFollowUp || !followUp.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
        >
          {t("common.send")}
        </Button>
      </form>
    </div>
  );
}
