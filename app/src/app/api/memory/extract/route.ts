import { VertexAI } from "@google-cloud/vertexai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || "",
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    maxOutputTokens: 512,
    temperature: 0.3,
    // thinkingConfig: { thinkingBudget: 0 }, // enable when SDK supports it
  },
});

const EXTRACTION_PROMPT = `Analyzujte nasledujúcu konverzáciu a extrahujte fakty o používateľovi.

Vráťte JSON pole faktov. Každý fakt má:
- "fact": krátky popis faktu v slovenčine
- "category": kategória — "personal", "work", "preferences", "documents"

Ak žiadne fakty nie sú, vráťte prázdne pole [].

Konverzácia:
{conversation}

Vráťte IBA validný JSON (pole objektov), nič iné.`;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ facts: [] });
  }

  const { conversation } = await request.json();

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: EXTRACTION_PROMPT.replace("{conversation}", conversation) }],
        },
      ],
    });

    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const facts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ facts });
  } catch {
    return NextResponse.json({ facts: [] });
  }
}
