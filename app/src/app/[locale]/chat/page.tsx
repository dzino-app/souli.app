"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { CachedAvatar } from "@/components/avatar/cached-avatar";
import { streamChatResponse, type ChatMessage } from "@/lib/stream-response";
import { parseResponse, type SoulUpdate, type EventProposal } from "@/lib/parse-soul-updates";
import { appendToSoulFile, updateSoulFile } from "@/lib/soul";
import { processConversationInBackground } from "@/lib/soul-background";
import { createEvent } from "@/lib/events";
import { getAvatarData, recordInteraction } from "@/lib/avatar";
import { clearFrameCache } from "@/lib/avatar-cache";
import { createConversation, addMessage } from "@/lib/conversations";

export default function ChatPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [pendingUpdates, setPendingUpdates] = useState<SoulUpdate[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventProposal[]>([]);
  const [avatarState, setAvatarState] = useState<import("@/lib/avatar").AvatarState>("idle");
  const [avatarData, setAvatarData] = useState<{
    name: string;
    appearance: import("@/lib/avatar").AvatarAppearance;
  }>({
    name: "Dzino",
    appearance: { species: "human", bodyShape: "round", eyeStyle: "dots", mouthStyle: "smile", earStyle: "none", accessory: "none", hairStyle: "none", skinColor: "#FDDCB5", bodyColor: "#4F46E5" },
  });
  const convIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = getAvatarData();
    setAvatarData({ name: data.name, appearance: data.appearance });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    setStreamText("");
    setAvatarState("thinking");

    // Create conversation on first message
    if (!convIdRef.current) {
      const conv = createConversation(userMsg);
      convIdRef.current = conv.id;
    }
    addMessage(convIdRef.current, "user", userMsg);

    try {
      const history = messages.slice(-10);

      const fullResponse = await streamChatResponse(userMsg, history, (chunk) => {
        setAvatarState("talking"); // switch to talking once first chunk arrives
        setStreamText(chunk);
      });

      // Parse soul updates, events, and mood from response
      const parsed = parseResponse(fullResponse);
      setPendingUpdates(parsed.soulUpdates);
      setPendingEvents(parsed.eventProposals);

      setMessages((prev) => [...prev, { role: "assistant", content: parsed.text }]);
      addMessage(convIdRef.current!, "assistant", parsed.text);
      recordInteraction();

      // Set avatar mood from LLM response, then fade to idle
      setStreaming(false);
      setStreamText("");
      setAvatarState(parsed.mood);
      setTimeout(() => setAvatarState("idle"), 3000);

      // Background memory processing (non-blocking heuristics)
      processConversationInBackground(userMsg, parsed.text);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("common.error");
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
      setStreaming(false);
      setStreamText("");
      setAvatarState("sad");
      setTimeout(() => setAvatarState("idle"), 3000);
    }
  }

  function approveSoulUpdate(update: SoulUpdate) {
    if (update.operation === "nahradit") {
      updateSoulFile(update.slug, update.content, "dzino");
    } else {
      appendToSoulFile(update.slug, update.content, "dzino");
    }
    setPendingUpdates((prev) => prev.filter((u) => u !== update));

    // If appearance changed, clear frame cache so it regenerates
    if (update.slug === "vzhlad") {
      clearFrameCache();
    }
  }

  function rejectSoulUpdate(update: SoulUpdate) {
    setPendingUpdates((prev) => prev.filter((u) => u !== update));
  }

  function approveEvent(proposal: EventProposal) {
    createEvent({
      title: proposal.title,
      description: proposal.description,
      date: proposal.date,
      time: proposal.time,
      type: proposal.type,
      status: "upcoming",
      remindBefore: proposal.remindBefore,
      createdBy: "dzino",
    });
    setPendingEvents((prev) => prev.filter((e) => e !== proposal));
  }

  function rejectEvent(proposal: EventProposal) {
    setPendingEvents((prev) => prev.filter((e) => e !== proposal));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
      {/* Avatar — prominent, centered, animated */}
      <div className="flex flex-col items-center gap-1 pb-3 border-b mb-3">
        <div className="py-2">
          <CachedAvatar state={avatarState} appearance={avatarData.appearance} size="md" />
        </div>
        <h1 className="text-sm font-semibold">{avatarData.name}</h1>
        <p className={`text-xs ${
          avatarState === "thinking" ? "text-primary animate-pulse" :
          avatarState === "talking" ? "text-accent" :
          avatarState === "happy" ? "text-success" :
          avatarState === "sad" ? "text-destructive" :
          "text-muted-foreground"
        }`}>
          {{
            thinking: "premýšľa...",
            talking: "píše...",
            happy: "šťastný",
            sad: "smutný",
            waving: "máva",
            walking: "prechádza sa",
            eating: "je",
            sleeping: "spí",
            idle: "online",
          }[avatarState] || "online"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {t("companion.greeting")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownResponse content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streaming && streamText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-card border px-4 py-2.5 text-sm">
              <MarkdownResponse content={streamText} />
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin mt-1" />
            </div>
          </div>
        )}

        {streaming && !streamText && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-card border px-4 py-3">
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}

        {/* Pending soul updates */}
        {pendingUpdates.map((update, i) => (
          <Card key={`soul-${i}`} className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground mb-1">
                Dzino sa chce niečo zapamätať ({update.slug}.md):
              </p>
              <p className="text-sm mb-2">{update.content}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={() => approveSoulUpdate(update)}>
                  <Check className="h-3 w-3 mr-1" /> Povoliť
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectSoulUpdate(update)}>
                  <X className="h-3 w-3 mr-1" /> Odmietnuť
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Pending events */}
        {pendingEvents.map((event, i) => (
          <Card key={`event-${i}`} className="border-accent/30 bg-accent/5">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground mb-1">
                Dzino navrhuje udalosť:
              </p>
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.date} {event.time || ""}</p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="default" onClick={() => approveEvent(event)}>
                  <Check className="h-3 w-3 mr-1" /> Pridať
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectEvent(event)}>
                  <X className="h-3 w-3 mr-1" /> Odmietnuť
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napíšte správu..."
          disabled={streaming}
          className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          autoFocus
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full h-10 w-10"
          disabled={streaming || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
