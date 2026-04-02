import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const text = await generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      jsonMode: true,
    });

    const parsed = JSON.parse(text);

    // Extract translations and display names
    const translations: Record<string, string> = {};
    const displayNames: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        translations[key] = value;
      } else if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, string>;
        if (obj.content) translations[key] = obj.content;
        if (obj.displayName) displayNames[key] = obj.displayName;
      }
    }

    return NextResponse.json({ translations, displayNames });
  } catch {
    return NextResponse.json({ translations: null }, { status: 500 });
  }
}
