"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { streamChatResponse } from "@/lib/stream-response";
import { extractAndStoreMemories } from "@/lib/memory";

interface QuestionViewProps {
  question: string;
  documentText?: string;
  onBack: () => void;
}

export function QuestionView({ question, documentText, onBack }: QuestionViewProps) {
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
        const fullResponse = await streamChatResponse(
          documentText || "",
          "ask",
          question,
          (chunk) => {
            if (!cancelled) setResponse(chunk);
          }
        );
        if (!cancelled) {
          extractAndStoreMemories(question, fullResponse);
        }
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
  }, [question, documentText, t]);

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim()) return;

    setSendingFollowUp(true);
    setResponse("");
    setLoading(true);

    try {
      await streamChatResponse(documentText || "", "ask", followUp, (chunk) => {
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
        <span className="font-medium text-sm">{t("chat.yourQuestion")}</span>
      </div>

      {/* Original question */}
      <div className="flex gap-3">
        <div className="rounded-md bg-primary/10 p-1.5 mt-0.5 shrink-0">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm">{question}</p>
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
                {t("chat.thinking")}
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
          placeholder={t("chat.followUpPlaceholder")}
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
