"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Check, X, Pencil } from "lucide-react";
import { VoiceInput } from "@/components/chat/voice-input";
import { VoiceOutput } from "@/components/chat/voice-output";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { PixelBackground } from "@/components/avatar/pixel-background";
import { streamChatResponse, type ChatMessage } from "@/lib/stream-response";
import { parseResponse, stripBlocksForDisplay, type SoulUpdate, type EventProposal, type TimerRequest } from "@/lib/parse-soul-updates";
import { TimerStopwatch } from "@/components/tools/timer-stopwatch";
import { appendToSoulFile, updateSoulFile } from "@/lib/soul";
import { processConversationInBackground } from "@/lib/soul-background";
import { createEvent } from "@/lib/events";
import { getAvatarData, saveAvatarData, recordInteraction } from "@/lib/avatar";
import { playAvatarSound } from "@/lib/pixel-sounds";
import { createConversation, addMessage } from "@/lib/conversations";
import { addXp, getGamification, saveGamification } from "@/lib/gamification";
import { checkAchievements, grantAchievement, type Achievement } from "@/lib/achievements";
import { updateChallengeProgress, completeChallengeById } from "@/lib/challenges";

const POSITIVE_WORDS = ["super", "výborne", "splnené", "gratuluj", "skvelé", "paráda", "bravo", "hotovo", "dokonalé", "podarilo"];

export default function ChatPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [pendingUpdates, setPendingUpdates] = useState<SoulUpdate[]>([]);
  const [pendingEvents, setPendingEvents] = useState<EventProposal[]>([]);
  const [activeTimers, setActiveTimers] = useState<TimerRequest[]>([]);
  const [avatarState, setAvatarState] = useState<import("@/lib/avatar").AvatarState>("idle");
  const [avatarData, setAvatarData] = useState<{
    name: string;
    appearance: import("@/lib/avatar").AvatarAppearance;
    soundDNA?: import("@/lib/avatar").SoundDNA;
  }>({
    name: "Dzino",
    appearance: { species: "human", bodyShape: "round", eyeStyle: "dots", mouthStyle: "smile", earStyle: "none", accessory: "none", hairStyle: "none", skinColor: "#FDDCB5", bodyColor: "#4F46E5" },
  });
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [soulToast, setSoulToast] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const convIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const challengeSentRef = useRef(false);
  const challengeIdRef = useRef<string | null>(null);

  function showAchievementToasts(newAchievements: Achievement[]) {
    if (newAchievements.length === 0) return;
    let delay = 0;
    for (const ach of newAchievements) {
      setTimeout(() => {
        setAchievementToast(ach);
        setTimeout(() => setAchievementToast(null), 3000);
      }, delay);
      delay += 3500;
    }
  }

  function processGamificationOnMessage() {
    addXp(5, "message");
    updateChallengeProgress("chat");

    const hour = new Date().getHours();
    const data = getGamification();
    const allNew: Achievement[] = [];
    if (hour >= 0 && hour < 5) {
      const a = grantAchievement(data, "night_owl");
      if (a) allNew.push(a);
    }
    if (hour >= 5 && hour < 7) {
      const a = grantAchievement(data, "early_bird");
      if (a) allNew.push(a);
    }

    const dataNew = checkAchievements(data);
    allNew.push(...dataNew);
    if (allNew.length > 0) {
      saveGamification(data);
      showAchievementToasts(allNew);
    }
  }

  useEffect(() => {
    const data = getAvatarData();
    setAvatarData({ name: data.name, appearance: data.appearance, soundDNA: data.soundDNA });

    // Load existing conversation if ID provided
    const convId = searchParams.get("id");
    if (convId) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getConversation } = require("@/lib/conversations") as typeof import("@/lib/conversations");
      const conv = getConversation(convId);
      if (conv && conv.messages.length > 0) {
        convIdRef.current = convId;
        setMessages(conv.messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // Send a message programmatically (used for both form submit and auto-send)
  const sendMessage = useCallback(async (userMsg: string) => {
    if (!userMsg.trim() || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    setStreamText("");
    setAvatarState("thinking");

    if (!convIdRef.current) {
      const conv = createConversation(userMsg);
      convIdRef.current = conv.id;
    }
    addMessage(convIdRef.current, "user", userMsg);

    try {
      const fullResponse = await streamChatResponse(userMsg, messages.slice(-10), (chunk) => {
        setAvatarState("talking");
        setStreamText(chunk);
      });

      const parsed = parseResponse(fullResponse);
      setPendingUpdates(parsed.soulUpdates);
      setPendingEvents(parsed.eventProposals);
      if (parsed.timerRequests.length > 0) {
        setActiveTimers(parsed.timerRequests);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: parsed.text }]);
      addMessage(convIdRef.current!, "assistant", parsed.text);
      recordInteraction();
      processGamificationOnMessage();

      setStreaming(false);
      setStreamText("");
      setAvatarState(parsed.mood);
      setTimeout(() => setAvatarState("idle"), 3000);

      processConversationInBackground(userMsg, parsed.text);

      // Auto-complete challenge if response seems positive
      if (challengeIdRef.current) {
        const responseLower = parsed.text.toLowerCase();
        const isPositive = POSITIVE_WORDS.some((w) => responseLower.includes(w));
        if (isPositive) {
          const proof = `${userMsg} — Dzino: ${parsed.text.slice(0, 100)}`;
          completeChallengeById(challengeIdRef.current, proof);
          addXp(20, "challenge");
          challengeIdRef.current = null;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("common.error");
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
      setStreaming(false);
      setStreamText("");
      setAvatarState("sad");
      setTimeout(() => setAvatarState("idle"), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, messages, t]);

  // Auto-send message from URL params (challenge or plain text)
  useEffect(() => {
    if (challengeSentRef.current) return;
    const challengeId = searchParams.get("challenge");
    const text = searchParams.get("text");

    if (challengeId && text) {
      // Challenge flow
      challengeSentRef.current = true;
      challengeIdRef.current = challengeId;
      const timer = setTimeout(() => {
        sendMessage(`Chcem splniť výzvu: ${text}`);
      }, 300);
      return () => clearTimeout(timer);
    } else if (text && !challengeId) {
      // Plain text (from "Povedz mi niečo" or other sources)
      challengeSentRef.current = true;
      const timer = setTimeout(() => {
        sendMessage(text);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, sendMessage]);

  // Voice input: receive transcript and auto-send
  const handleVoiceTranscript = useCallback((text: string) => {
    if (text.trim()) {
      sendMessage(text.trim());
    }
  }, [sendMessage]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    await sendMessage(input.trim());
  }

  function approveSoulUpdate(update: SoulUpdate) {
    if (update.operation === "nahradit") {
      updateSoulFile(update.slug, update.content, "dzino");
    } else {
      appendToSoulFile(update.slug, update.content, "dzino");
    }
    addXp(10, "soul_update");
    updateChallengeProgress("soul");
    setPendingUpdates((prev) => prev.filter((u) => u !== update));

    // Avatar sparkle reaction + toast
    setAvatarState("happy");
    if (avatarData.soundDNA) playAvatarSound("happy", avatarData.soundDNA);
    setSoulToast(true);
    setTimeout(() => {
      setAvatarState("idle");
      setSoulToast(false);
    }, 2000);

    if (update.slug === "vzhlad") {
      // Appearance change — pixel avatar auto-updates from soul
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
    addXp(5, "event");
    updateChallengeProgress("event");
    setPendingEvents((prev) => prev.filter((e) => e !== proposal));
  }

  function rejectEvent(proposal: EventProposal) {
    setPendingEvents((prev) => prev.filter((e) => e !== proposal));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
      {/* Avatar -- prominent, centered, animated */}
      <div className="flex flex-col items-center gap-1 pb-3 border-b mb-3">
        <button
          type="button"
          className="relative cursor-pointer w-full max-w-lg mx-auto rounded-xl overflow-visible"
          onClick={() => {
            if (streaming) return;
            const reactions: import("@/lib/avatar").AvatarState[] = ["waving", "happy", "waving", "happy", "eating", "walking"];
            const pick = reactions[Math.floor(Math.random() * reactions.length)];
            setAvatarState(pick);
            if (avatarData.soundDNA) playAvatarSound(pick, avatarData.soundDNA);
            setTimeout(() => setAvatarState("idle"), 2500);
          }}
        >
          <div className="overflow-hidden rounded-xl">
            <PixelBackground />
          </div>
          <div
            className="absolute inset-0 flex items-end justify-center pb-1 z-[60]"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            <PixelAvatar state={avatarState} appearance={avatarData.appearance} size="md" />
          </div>
        </button>
        {renaming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = renameValue.trim();
              if (name) {
                const data = getAvatarData();
                data.name = name;
                saveAvatarData(data);
                setAvatarData((prev) => ({ ...prev, name }));
              }
              setRenaming(false);
            }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="text-sm font-semibold text-center border-b border-primary bg-transparent outline-none w-28"
              autoFocus
              maxLength={20}
              onKeyDown={(e) => { if (e.key === "Escape") setRenaming(false); }}
              onBlur={() => setRenaming(false)}
            />
          </form>
        ) : (
          <button
            onClick={() => { setRenameValue(avatarData.name); setRenaming(true); }}
            className="flex items-center gap-1 group"
          >
            <h1 className="text-sm font-semibold">{avatarData.name}</h1>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
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
                  : "bg-card border-2 border-border shadow-sm rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <>
                  <MarkdownResponse content={msg.content} />
                  <div className="flex justify-end mt-1">
                    <VoiceOutput text={msg.content} />
                  </div>
                </>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {streaming && streamText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-secondary border-2 border-border px-4 py-2.5 text-sm">
              <MarkdownResponse content={stripBlocksForDisplay(streamText)} />
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin mt-1" />
            </div>
          </div>
        )}

        {streaming && !streamText && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-card border-2 border-border shadow-sm px-5 py-3.5">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
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

        {/* Active timers */}
        {activeTimers.map((timer, i) => (
          <TimerStopwatch
            key={`timer-${i}`}
            initialSeconds={timer.seconds}
            label={timer.label}
            onComplete={() => addXp(10, "timer")}
            onDismiss={() => setActiveTimers((prev) => prev.filter((_, j) => j !== i))}
          />
        ))}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t">
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={streaming} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napíš správu..."
          disabled={streaming}
          className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 shadow-sm shadow-border/50"
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
      <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
        {t("chat.disclaimer")}{" "}
        <a href="/ochrana-sukromia" className="underline hover:text-muted-foreground">{t("chat.privacy")}</a>
        {" · "}
        <a href="/podmienky" className="underline hover:text-muted-foreground">{t("chat.terms")}</a>
      </p>

      {/* Soul update toast */}
      {soulToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="rounded-full bg-primary/15 border border-primary/30 shadow-lg px-4 py-2 flex items-center gap-2">
            <span className="text-base animate-pulse">&#10024;</span>
            <span className="text-sm font-medium">Zapam&#228;tan&#233; &#10024;</span>
          </div>
        </div>
      )}

      {/* Achievement toast */}
      {achievementToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <Card className="border-primary/50 bg-primary/10 shadow-lg">
            <CardContent className="py-3 px-5 flex items-center gap-3">
              <span className="text-2xl">{achievementToast.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground">Nový úspech!</p>
                <p className="text-sm font-semibold">{achievementToast.name}</p>
                <p className="text-xs text-muted-foreground">{achievementToast.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
