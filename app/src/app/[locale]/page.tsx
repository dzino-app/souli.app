"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoxelAvatar } from "@/components/avatar/voxel-avatar";
import { Avatar } from "@/components/avatar/avatar";
import { useAvatarState } from "@/components/avatar/use-avatar-state";
import { getMoodLabel, getMoodEmoji } from "@/lib/avatar-mood";
import { migrateMemoriesToSoul } from "@/lib/migrate-memories-to-soul";
import { getVoxelAvatar } from "@/lib/voxel";
import { generateVoxelAvatar, needsGeneration } from "@/lib/avatar-generator";
import {
  getConversationsGroupedByDate,
  deleteConversation,
  type Conversation,
} from "@/lib/conversations";

export default function Home() {
  const { mounted, state, mood, color, name, appearance } = useAvatarState();
  const [groups, setGroups] = useState<Record<string, Conversation[]>>({});
  const [hasVoxel, setHasVoxel] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    migrateMemoriesToSoul();
    setGroups(getConversationsGroupedByDate());
    setHasVoxel(getVoxelAvatar() !== null);

    // Auto-generate voxel avatar on first load
    if (needsGeneration()) {
      setGenerating(true);
      generateVoxelAvatar(true)
        .then((data) => {
          if (data) setHasVoxel(true);
        })
        .catch(() => {})
        .finally(() => setGenerating(false));
    }
  }, []);

  function handleDelete(id: string) {
    deleteConversation(id);
    setGroups(getConversationsGroupedByDate());
  }

  const dateKeys = Object.keys(groups);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar — compact, centered */}
      <div className="flex flex-col items-center gap-2 py-4">
        {generating && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Generujem Dzina...</p>
          </div>
        )}
        {!generating && hasVoxel && (
          <VoxelAvatar state={state} color={color} size="md" />
        )}
        {!generating && !hasVoxel && (
          <Avatar state={state} color={color} size="md" appearance={appearance} />
        )}
        <h1 className="text-lg font-bold">{name}</h1>
        <p className="text-xs text-muted-foreground">
          {getMoodEmoji(mood)} {getMoodLabel(mood)}
        </p>
      </div>

      {/* New chat button */}
      <Link href="/chat">
        <Button size="lg" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Nová konverzácia
        </Button>
      </Link>

      {/* Chat sessions */}
      {dateKeys.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Predchádzajúce konverzácie
          </h2>
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              <p className="text-xs text-muted-foreground mb-2">{dateKey}</p>
              <div className="flex flex-col gap-2">
                {groups[dateKey].map((conv) => (
                  <Card key={conv.id} className="hover:bg-secondary transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <Link href="/chat" className="flex items-center gap-3 flex-1 min-w-0">
                          <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {conv.messages.length} {conv.messages.length === 1 ? "správa" : "správ"}
                            </p>
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleDelete(conv.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {dateKeys.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Začnite konverzáciu — Dzino sa teší!
        </p>
      )}
    </div>
  );
}
