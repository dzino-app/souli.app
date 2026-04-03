"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRandomAction, getTypeEmoji, type QuickAction } from "@/lib/quick-actions";
import { getTodayMood } from "@/lib/mood-tracking";

export function TellMeSomething() {
  const [action, setAction] = useState<QuickAction | null>(null);

  function handleClick() {
    const todayMood = getTodayMood();
    setAction(getRandomAction(todayMood?.mood ?? null));
  }

  return (
    <div className="flex flex-col gap-2">
      {!action && (
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleClick}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Povedz mi niečo
        </Button>
      )}

      {action && (
        <Card className="border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0" aria-hidden>
                {getTypeEmoji(action.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary mb-1">
                  {action.label}
                </p>
                <p className="text-sm leading-relaxed">{action.content}</p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClick}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Ďalšie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
