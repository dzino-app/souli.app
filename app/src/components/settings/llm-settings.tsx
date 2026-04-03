"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLlmSettings,
  saveLlmSettings,
  type LlmProvider,
  type CustomLlmSettings,
} from "@/lib/user-settings";

const PROVIDERS: { value: LlmProvider; label: string }[] = [
  { value: "gemini", label: "Gemini (Google AI Studio)" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
};

interface Props {
  translations: {
    title: string;
    desc: string;
    provider: string;
    apiKey: string;
    model: string;
    test: string;
    testSuccess: string;
    testFail: string;
    keyWarning: string;
  };
}

export function LlmSettings({ translations: t }: Props) {
  const [settings, setSettings] = useState<CustomLlmSettings>({});
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  useEffect(() => {
    setSettings(getLlmSettings());
  }, []);

  function handleProviderChange(provider: LlmProvider) {
    const updated: CustomLlmSettings = {
      ...settings,
      customLlmProvider: provider,
      customLlmModel: DEFAULT_MODELS[provider],
    };
    setSettings(updated);
    saveLlmSettings(updated);
    setTestStatus("idle");
  }

  function handleKeyChange(key: string) {
    const updated = { ...settings, customLlmApiKey: key || undefined };
    setSettings(updated);
    saveLlmSettings(updated);
    setTestStatus("idle");
  }

  function handleModelChange(model: string) {
    const updated = { ...settings, customLlmModel: model || undefined };
    setSettings(updated);
    saveLlmSettings(updated);
    setTestStatus("idle");
  }

  function handleClear() {
    const cleared: CustomLlmSettings = {};
    setSettings(cleared);
    saveLlmSettings(cleared);
    setTestStatus("idle");
  }

  async function handleTest() {
    if (!settings.customLlmApiKey || !settings.customLlmProvider) return;

    setTestStatus("loading");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-LLM-Provider": settings.customLlmProvider,
          "X-Custom-LLM-Key": settings.customLlmApiKey,
          "X-Custom-LLM-Model": settings.customLlmModel || "",
        },
        body: JSON.stringify({
          message: "Povedz len: OK",
          soulContext: "",
          history: [],
        }),
      });

      if (!response.ok) {
        setTestStatus("error");
        return;
      }

      // Read enough of the stream to confirm it works
      const reader = response.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        reader.cancel();
        if (value && value.length > 0) {
          setTestStatus("success");
          return;
        }
      }
      setTestStatus("error");
    } catch {
      setTestStatus("error");
    }
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">{t.title}</p>
          <p className="text-xs text-muted-foreground">{t.desc}</p>
        </div>

        {/* Provider */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t.provider}
          </label>
          <select
            value={settings.customLlmProvider || "gemini"}
            onChange={(e) =>
              handleProviderChange(e.target.value as LlmProvider)
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t.apiKey}
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={settings.customLlmApiKey || ""}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="sk-... / AIza..."
              className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t.model}
          </label>
          <input
            type="text"
            value={
              settings.customLlmModel ||
              DEFAULT_MODELS[settings.customLlmProvider || "gemini"]
            }
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Warning */}
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {t.keyWarning}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={!settings.customLlmApiKey || testStatus === "loading"}
          >
            {testStatus === "loading" ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : null}
            {t.test}
          </Button>

          {settings.customLlmApiKey && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Reset
            </Button>
          )}

          {testStatus === "success" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              {t.testSuccess}
            </span>
          )}
          {testStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              {t.testFail}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
