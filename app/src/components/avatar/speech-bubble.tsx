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
      className={`relative bg-card border-2 border-border rounded-2xl shadow-sm ${
        size === "sm" ? "px-3 py-1.5 max-w-[200px]" : "px-4 py-2.5 max-w-[260px]"
      }`}
      style={{ animation: "bounce-in 0.4s ease-out" }}
    >
      <p className={`${size === "sm" ? "text-xs" : "text-sm"} text-center`}>
        {text}
      </p>
      {/* Triangle pointer pointing up to avatar */}
      <div
        className="absolute -top-2 left-1/3 w-0 h-0"
        style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "8px solid hsl(var(--border))",
        }}
      />
      <div
        className="absolute -top-[5px] left-1/3 w-0 h-0"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: "7px solid hsl(var(--card))",
          marginLeft: "1px",
        }}
      />
    </div>
  );
}
