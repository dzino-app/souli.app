"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { VoxelAvatar } from "@/components/avatar/voxel-avatar";
import { Avatar } from "@/components/avatar/avatar";
import { streamChatResponse, type ChatMessage } from "@/lib/stream-response";
import { parseResponse, type SoulUpdate, type EventProposal } from "@/lib/parse-soul-updates";
import { appendToSoulFile, updateSoulFile } from "@/lib/soul";
import { createEvent } from "@/lib/events";
import { getAvatarData, recordInteraction } from "@/lib/avatar";
import { getVoxelAvatar } from "@/lib/voxel";
import { generateVoxelAvatar } from "@/lib/avatar-generator";
import { createConversation, addMessage } from "@/lib/conversations";

export default function ChatPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [pendingUpdates, setPendingUpdates] = useState<SoulUpdate[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventProposal[]>([]);
  const [avatarState, setAvatarState] = useState<"idle" | "thinking" | "talking">("idle");
  const [hasVoxel, setHasVoxel] = useState(false);
  const [avatarData, setAvatarData] = useState<{
    color: string;
    name: string;
    appearance: import("@/lib/avatar").AvatarAppearance;
  }>({
    color: "#4F46E5",
    name: "Dzino",
    appearance: { bodyShape: "round", eyeStyle: "dots", mouthStyle: "smile", accessory: "none" },
  });
  const convIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasVoxel(getVoxelAvatar() !== null);
    const data = getAvatarData();
    setAvatarData({ color: data.color, name: data.name, appearance: data.appearance });
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
      setAvatarState("talking");

      const fullResponse = await streamChatResponse(userMsg, history, (chunk) => {
        setStreamText(chunk);
      });

      // Parse soul updates and events from response
      const parsed = parseResponse(fullResponse);
      setPendingUpdates(parsed.soulUpdates);
      setPendingEvents(parsed.eventProposals);

      setMessages((prev) => [...prev, { role: "assistant", content: parsed.text }]);
      addMessage(convIdRef.current!, "assistant", parsed.text);
      recordInteraction();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("common.error");
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setStreaming(false);
      setStreamText("");
      setAvatarState("idle");
    }
  }

  function approveSoulUpdate(update: SoulUpdate) {
    if (update.operation === "nahradit") {
      updateSoulFile(update.slug, update.content, "dzino");
    } else {
      appendToSoulFile(update.slug, update.content, "dzino");
    }
    setPendingUpdates((prev) => prev.filter((u) => u !== update));

    // If appearance changed, regenerate voxel avatar
    if (update.slug === "vzhlad") {
      generateVoxelAvatar(true).catch(() => {});
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
      {/* Chat header with mini avatar */}
      <div className="flex items-center gap-3 pb-4 border-b mb-4">
        {hasVoxel ? (
          <VoxelAvatar state={avatarState} color={avatarData.color} size="sm" />
        ) : (
          <Avatar state={avatarState} color={avatarData.color} size="sm" appearance={avatarData.appearance} />
        )}
        <div>
          <h1 className="font-semibold">{avatarData.name}</h1>
          <p className="text-xs text-muted-foreground">
            {streaming ? "píše..." : "online"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !streaming && (
          <div className="text-center py-12">
            {hasVoxel ? (
              <VoxelAvatar state="waving" color={avatarData.color} size="md" />
            ) : (
              <Avatar state="waving" color={avatarData.color} size="md" appearance={avatarData.appearance} />
            )}
            <p className="text-sm text-muted-foreground mt-4">
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
