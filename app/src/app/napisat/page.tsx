"use client";

import { useState } from "react";
import { PenLine, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { streamChatResponse } from "@/lib/stream-response";

export default function WritePage() {
  const t = useTranslations("write");
  const tc = useTranslations("common");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      await streamChatResponse("", "write", input.trim(), (chunk) => {
        setResult(chunk);
      });
    } catch {
      setError(tc("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <PenLine className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          rows={4}
          className="w-full rounded-lg border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          size="lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <PenLine className="h-4 w-4 mr-2" />
          )}
          {t("generate")}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Result */}
      {(result || loading) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t("result")}</h2>
            {result && !loading && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? t("copySuccess") : tc("copy")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t("regenerate")}
                </Button>
              </div>
            )}
          </div>
          <Card>
            <CardContent className="py-6">
              {loading && !result ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div>
                  <MarkdownResponse content={result} />
                  {loading && (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin mt-2" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
