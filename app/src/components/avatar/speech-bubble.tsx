"use client";

import { useEffect, useState } from "react";
import { getAvatarBubble } from "@/lib/avatar-bubble";

interface SpeechBubbleProps {
  size?: "sm" | "md";
}

export function SpeechBubble({ size = "md" }: SpeechBubbleProps) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it appears after the avatar renders
    const timer = setTimeout(() => {
      setText(getAvatarBubble());
      setVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !text) return null;

  return (
    <div
      className={`relative bg-card border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 ${
        size === "sm" ? "px-3 py-1.5 max-w-[200px]" : "px-4 py-2 max-w-[260px]"
      }`}
    >
      <p className={`${size === "sm" ? "text-xs" : "text-sm"} text-center`}>
        {text}
      </p>
      {/* Triangle pointer pointing up to avatar */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "8px solid hsl(var(--border))",
        }}
      />
      <div
        className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: "7px solid hsl(var(--card))",
        }}
      />
    </div>
  );
}
