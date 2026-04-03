"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  generateWeeklyReview,
  shouldShowWeeklyReview,
  saveWeeklyReview,
  dismissWeeklyReview,
} from "@/lib/weekly-review";
import { getUserSettings } from "@/lib/user-settings";
import { X } from "lucide-react";

export function WeeklyReviewCard() {
  const [visible, setVisible] = useState(false);
  const [review, setReview] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = getUserSettings();
    if (!settings.weeklyReview) return;

    if (shouldShowWeeklyReview()) {
      const text = generateWeeklyReview();
      setReview(text);
      setVisible(true);
    }
  }, []);

  function handleSave() {
    saveWeeklyReview(review);
    setSaved(true);
    setTimeout(() => setVisible(false), 2000);
  }

  function handleDismiss() {
    dismissWeeklyReview();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold">
            {"\ud83d\udcca"} Tyzdenny prehlad
          </h3>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-sm text-muted-foreground whitespace-pre-line mb-4">
          {review
            .replace(/^## .*\n\n/, "")
            .replace(/\*\*/g, "")
            .replace(/^> /gm, "")}
        </div>

        {saved ? (
          <p className="text-sm text-success">
            {"\u2713"} Ulozene do dennika
          </p>
        ) : (
          <Button size="sm" onClick={handleSave}>
            Ulozit do dennika
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
