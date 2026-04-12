"use client";

import { useState, useRef, type FormEvent } from "react";
import { Brain, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getConversations } from "@/lib/conversations";
import { getLlmSettings } from "@/lib/user-settings";

interface SmartQueryProps {
  soulContent: string;
}

const SMART_QUERY_SYSTEM_SUFFIX = `

== ŠPECIÁLNY REŽIM: OTÁZKA NA PAMÄŤ ==

Používateľ sa ťa pýta otázku o tom, čo vieš. Odpovedaj VÝLUČNE na základe informácií zo Souli súborov a histórie konverzácií uvedených vyššie.

Pravidlá:
- Ak odpoveď nájdeš v súboroch alebo histórii, odpovedz konkrétne a stručne
- Ak informáciu nemáš, povedz úprimne že si to nepamätáš alebo že ti to ešte nepovedali
- Nikdy si nevymýšľaj fakty, ktoré nie sú v kontexte
- Buď priateľský a stručný — toto nie je bežný rozhovor, ale odpoveď na otázku`;

export function SmartQuery({ soulContent }: SmartQueryProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function getRecentConversationContext(): string {
    const conversations = getConversations();
    const recent = conversations.slice(0, 5);
    if (recent.length === 0) return "";

    const snippets = recent.map((conv) => {
      const msgs = conv.messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "Ja" : "Dzino"}: ${m.content.slice(0, 500)}`)
        .join("\n");
      return `--- Rozhovor: ${conv.title} (${conv.updatedAt.slice(0, 10)}) ---\n${msgs}`;
    });

    return "\n\n== POSLEDNÉ ROZHOVORY ==\n" + snippets.join("\n\n");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setResponse("");

    abortRef.current = new AbortController();

    try {
      const conversationContext = getRecentConversationContext();
      const fullSoulContext = soulContent + conversationContext + SMART_QUERY_SYSTEM_SUFFIX;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const llmSettings = getLlmSettings();
      if (llmSettings.customLlmApiKey && llmSettings.customLlmProvider) {
        headers["X-Custom-LLM-Provider"] = llmSettings.customLlmProvider;
        headers["X-Custom-LLM-Key"] = llmSettings.customLlmApiKey;
        if (llmSettings.customLlmModel) {
          headers["X-Custom-LLM-Model"] = llmSettings.customLlmModel;
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: trimmed,
          soulContext: fullSoulContext,
          history: [],
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Prilis vela poziadaviek. Skuste to o chvilu.");
        }
        throw new Error("Nieco sa nepodarilo.");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Nieco sa nepodarilo.");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                fullText += parsed.text;
                setResponse(fullText);
              }
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== "Unexpected end of JSON input"
              ) {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled
        return;
      }
      setError(
        err instanceof Error ? err.message : "Nieco sa nepodarilo."
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleClear() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setResponse("");
    setError("");
    setQuery("");
  }

  // Strip any :::nalada, :::aktualizacia, or :::udalost blocks from display
  const cleanResponse = response.replace(/:::[\s\S]*?:::/g, "").trim();

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Brain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Opytaj sa Souliho na cokoľvek..."
            disabled={loading}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>
        {(response || error) && !loading ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClear}
            aria-label="Zrusit"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="sm" disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
          </Button>
        )}
      </form>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {cleanResponse && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Dzino hovori</h3>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {cleanResponse}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
