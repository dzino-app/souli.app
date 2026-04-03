import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/llm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ translations: null }, { status: 429 });
  }

  try {
    const { prompt, langCode } = await request.json();

    // Validate — only accept translation requests, not arbitrary prompts
    if (!langCode || typeof langCode !== "string" || langCode.length > 5) {
      return NextResponse.json({ translations: null }, { status: 400 });
    }
    if (!prompt || typeof prompt !== "string" || !prompt.includes("Translate these soul files")) {
      return NextResponse.json({ translations: null }, { status: 400 });
    }

    const text = await generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      jsonMode: true,
    });

    const parsed = JSON.parse(text);
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
