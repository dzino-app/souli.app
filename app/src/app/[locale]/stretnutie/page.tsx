"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { getAvatarData } from "@/lib/avatar";
import { getSoulFilesByCategory } from "@/lib/soul";
import { getSouliPersonality, generateMeeting, type MeetingMessage } from "@/lib/souli-meeting";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { AvatarAppearance } from "@/lib/avatar";

type Step = "pick-guest" | "generating" | "result";

export default function MeetingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick-guest");
  const [guests, setGuests] = useState<AvatarRow[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<AvatarRow | null>(null);
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  const avatarData = typeof window !== "undefined" ? getAvatarData() : null;
  const soulFiles = typeof window !== "undefined" ? Object.values(getSoulFilesByCategory()).flat() : [];
  const myPersonality = avatarData ? getSouliPersonality(avatarData.name, soulFiles) : "";

  useEffect(() => {
    fetch("/api/library?sort=popular&page=0")
      .then((r) => r.json())
      .then((d) => setGuests(d.avatars?.slice(0, 12) ?? []))
      .catch(() => {});
  }, []);

  async function handleMeet(guest: AvatarRow) {
    if (!avatarData) return;
    setSelectedGuest(guest);
    setStep("generating");

    try {
      const result = await generateMeeting(
        { name: avatarData.name, personality: myPersonality },
        { name: guest.name, personality: guest.public_description || `${guest.name} je tajomný Souli.` },
      );
      setMessages(result.messages);
      setStep("result");

      // Reveal messages one by one
      for (let i = 1; i <= result.messages.length; i++) {
        await new Promise((r) => setTimeout(r, 800));
        setVisibleCount(i);
      }
    } catch {
      setStep("pick-guest");
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Stretnutie Soulis</h1>
          <p className="text-sm text-muted-foreground">Zoznám svojho Souliho s niekým novým</p>
        </div>
      </div>

      {step === "pick-guest" && (
        <>
          {avatarData && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <PixelAvatar state="happy" appearance={avatarData.appearance} size="sm" />
              <div>
                <p className="text-sm font-semibold">{avatarData.name}</p>
                <p className="text-xs text-muted-foreground">Tvoj Souli</p>
              </div>
            </div>
          )}

          <h3 className="text-sm font-semibold text-muted-foreground">Vyber hosťa z Pixoci</h3>

          <div className="grid grid-cols-3 gap-2">
            {guests.map((g) => (
              <Card
                key={g.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => handleMeet(g)}
              >
                <CardContent className="py-3 px-2 flex flex-col items-center gap-1">
                  <PixelAvatar
                    state="idle"
                    appearance={g.appearance as AvatarAppearance}
                    size="sm"
                  />
                  <p className="text-xs font-medium truncate w-full text-center">{g.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {guests.length === 0 && (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="flex items-center gap-4">
            {avatarData && <PixelAvatar state="waving" appearance={avatarData.appearance} size="sm" />}
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            {selectedGuest && <PixelAvatar state="waving" appearance={selectedGuest.appearance as AvatarAppearance} size="sm" />}
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            {avatarData?.name} a {selectedGuest?.name} sa zoznamujú...
          </p>
        </div>
      )}

      {step === "result" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center gap-4 py-2">
            {avatarData && <PixelAvatar state="happy" appearance={avatarData.appearance} size="sm" />}
            <Users className="h-5 w-5 text-primary" />
            {selectedGuest && <PixelAvatar state="happy" appearance={selectedGuest.appearance as AvatarAppearance} size="sm" />}
          </div>

          <div className="flex flex-col gap-2">
            {messages.slice(0, visibleCount).map((msg, i) => {
              const isMine = msg.speaker === avatarData?.name;
              return (
                <div
                  key={i}
                  className={`flex ${isMine ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? "bg-primary/10 border border-primary/20 rounded-bl-md"
                      : "bg-secondary border rounded-br-md"
                  }`}>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{msg.speaker}</p>
                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount >= messages.length && (
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setStep("pick-guest"); setMessages([]); setVisibleCount(0); }}>
                Ďalšie stretnutie
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={() => {
                  const text = messages.map((m) => `${m.speaker}: ${m.text}`).join("\n");
                  navigator.clipboard?.writeText(text);
                }}
              >
                <Share2 className="h-3.5 w-3.5" /> Kopírovať
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
