"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getDailyGreeting,
  shouldShowGreeting,
  markGreetingShown,
} from "@/lib/daily-greeting";

export function DailyGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldShowGreeting()) {
      const text = getDailyGreeting();
      setGreeting(text);
      setVisible(true);
      markGreetingShown();
    }
  }, []);

  function handleDismiss() {
    setVisible(false);
  }

  if (!visible || !greeting) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0" aria-hidden>
            {"\u{1F44B}"}
          </span>
          <p className="text-sm flex-1 leading-relaxed">{greeting}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 -mt-0.5"
            onClick={handleDismiss}
            aria-label="Zavrieť"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
