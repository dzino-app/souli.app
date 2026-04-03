"use client";

// DEPRECATED: This component will be removed in Phase 6 cleanup.
// The new chat UI is at /chat/page.tsx

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { streamChatResponse } from "@/lib/stream-response";

interface QuestionViewProps {
  question: string;
  onBack: () => void;
}

export function QuestionView({ question, onBack }: QuestionViewProps) {
  const t = useTranslations();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await streamChatResponse(question, [], (chunk) => {
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
  }, [question, t]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-sm">{t("chat.yourQuestion")}</span>
      </div>
      <div className="flex gap-3">
        <div className="rounded-md bg-primary/10 p-1.5 mt-0.5 shrink-0">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm">{question}</p>
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
