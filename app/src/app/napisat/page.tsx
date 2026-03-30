"use client";

import { useState } from "react";
import { PenLine, Copy, Check, RefreshCw, Loader2, AlertTriangle, FileQuestion, FileX, Receipt, Download, Pencil, Eye } from "lucide-react";
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
  const [editing, setEditing] = useState(false);

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

  function handleDownload() {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dzino-text.txt";
    a.click();
    URL.revokeObjectURL(url);
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

      {/* Templates */}
      {!result && !loading && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">{t("templatesTitle")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "complaint", icon: AlertTriangle },
              { key: "request", icon: FileQuestion },
              { key: "termination", icon: FileX },
              { key: "claim", icon: Receipt },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setInput(t(`templates.${key}Prompt`))}
                className="flex items-start gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{t(`templates.${key}`)}</div>
                  <div className="text-xs text-muted-foreground">{t(`templates.${key}Desc`)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? (
                    <Eye className="h-4 w-4 mr-1" />
                  ) : (
                    <Pencil className="h-4 w-4 mr-1" />
                  )}
                  {editing ? t("preview") : t("edit")}
                </Button>
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
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {tc("download")}
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
              ) : editing ? (
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full min-h-[300px] rounded-md border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
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
