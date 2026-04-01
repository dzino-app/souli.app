"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MessageCircle, BookOpen, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "./avatar";
import { useAvatarState } from "./use-avatar-state";
import { getMoodLabel, getMoodEmoji } from "@/lib/avatar-mood";

export function AvatarScene() {
  const t = useTranslations("companion");
  const { state, mood, color, name, appearance } = useAvatarState();

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Avatar + mood */}
      <div className="flex flex-col items-center gap-3 py-8">
        <Avatar state={state} color={color} size="lg" appearance={appearance} />
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-sm text-muted-foreground">
          {getMoodEmoji(mood)} {getMoodLabel(mood)} · {mood}/100
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        <Link href="/chat">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
            <CardContent className="py-4 flex flex-col items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{t("chat")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dusa">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
            <CardContent className="py-4 flex flex-col items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{t("soul")}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/udalosti">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
            <CardContent className="py-4 flex flex-col items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{t("events")}</span>
            </CardContent>
          </Card>
        </Link>
        <Card
          className="hover:bg-secondary transition-colors cursor-pointer"
          onClick={() => {/* feed action - future */}}
        >
          <CardContent className="py-4 flex flex-col items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">{t("interact")}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
