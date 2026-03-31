import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `Analyzujte nasledujúcu konverzáciu a extrahujte fakty o používateľovi.

Vráťte JSON pole faktov. Každý fakt má:
- "fact": krátky popis faktu v slovenčine (napr. "Volá sa Maroš")
- "category": kategória — "personal", "work", "preferences", "documents"

Ak žiadne fakty nie sú, vráťte prázdne pole [].

DÔLEŽITÉ:
- Extrahujte IBA fakty o používateľovi, nie o dokumente
- Fakty musia byť konkrétne a užitočné pre budúce konverzácie
- Neuvádzajte všeobecné veci (napr. "používateľ nahral dokument")

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

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: EXTRACTION_PROMPT.replace("{conversation}", conversation),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const facts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ facts });
  } catch {
    return NextResponse.json({ facts: [] });
  }
}
