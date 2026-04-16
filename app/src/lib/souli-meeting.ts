"use client";

import type { SoulFile } from "./soul";

export interface MeetingMessage {
  speaker: string;
  text: string;
}

export interface MeetingResult {
  messages: MeetingMessage[];
}

export function getSouliPersonality(name: string, soulFiles: SoulFile[]): string {
  const keys = ["osobnost", "zaujmy", "humor"];
  const parts: string[] = [];
  for (const key of keys) {
    const file = soulFiles.find((f) => f.slug === key);
    if (file) parts.push(file.content.slice(0, 200));
  }
  return parts.length > 0 ? parts.join("\n") : `${name} je priateľský a zvedavý Souli.`;
}

export async function generateMeeting(
  souli1: { name: string; personality: string },
  souli2: { name: string; personality: string },
): Promise<MeetingResult> {
  const res = await fetch("/api/meeting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ souli1, souli2 }),
  });
  if (!res.ok) throw new Error("Meeting generation failed");
  const data = await res.json();
  return { messages: data.messages ?? [] };
}
