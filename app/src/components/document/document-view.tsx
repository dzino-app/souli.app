"use client";

// DEPRECATED: This component will be removed in Phase 6 cleanup.

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

export function DocumentView({ file, action, onBack }: DocumentViewProps) {
  const t = useTranslations();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const text = await file.text();
        await streamChatResponse(`${action}: ${text}`, [], (chunk) => {
          if (!cancelled) setResponse(chunk);
        });
      } catch {
        if (!cancelled) setError(t("common.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [file, action, t]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm truncate">{file.name}</span>
      </div>
      <Card>
        <CardContent className="py-6">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : loading && !response ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mx-auto" />
          ) : (
            <MarkdownResponse content={response} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
