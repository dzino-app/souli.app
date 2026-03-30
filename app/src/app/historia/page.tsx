"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getConversationsGroupedByDate,
  deleteConversation,
  type Conversation,
} from "@/lib/conversations";

export default function HistoryPage() {
  const t = useTranslations("history");
  const [groups, setGroups] = useState<Record<string, Conversation[]>>({});

  useEffect(() => {
    setGroups(getConversationsGroupedByDate());
  }, []);

  function handleDelete(id: string) {
    deleteConversation(id);
    setGroups(getConversationsGroupedByDate());
  }

  const dateKeys = Object.keys(groups);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">{t("title")}</h1>
      </div>

      {dateKeys.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      )}

      {dateKeys.map((dateKey) => (
        <div key={dateKey}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            {dateKey}
          </h2>
          <div className="flex flex-col gap-2">
            {groups[dateKey].map((conv) => (
              <Card key={conv.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conv.messages.length}{" "}
                          {conv.messages.length === 1 ? "správa" : "správ"}
                        </p>
                      </div>
                    </div>
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
  );
}
