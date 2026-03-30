import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

const ACTION_PROMPTS: Record<string, string> = {
  summarize:
    "Zhrnite tento dokument. Uveďte hlavné body v prehľadnom zozname. Píšte po slovensky, vykajte.",
  explain:
    "Vysvetlite tento dokument jednoduchým jazykom, ktorému porozumie bežný človek. Vyhnite sa odborným výrazom. Píšte po slovensky, vykajte.",
  risks:
    "Nájdite v tomto dokumente všetky riziká, problematické body a na čo si treba dať pozor. Píšte po slovensky, vykajte.",
  keyPoints:
    "Vyberte najdôležitejšie body a informácie z tohto dokumentu. Píšte po slovensky, vykajte.",
  write:
    "Používateľ potrebuje napísať formálnu odpoveď alebo list. Pomôžte mu na základe kontextu dokumentu. Píšte po slovensky, vykajte.",
  ask: "Odpovedzte na otázku používateľa k tomuto dokumentu. Píšte po slovensky, vykajte.",
};

const SYSTEM_PROMPT = `Ste Dzino — osobný pomocník, ktorý pomáha ľuďom porozumieť dokumentom a odpovedá na otázky po slovensky.

Pravidlá:
- Vždy píšte po slovensky, používajte vykanie (Vy, Váš, Vám)
- Nikdy nespomínajte, že ste AI, LLM alebo model
- Píšte zrozumiteľne, jednoducho, pre bežných ľudí
- Ak nie ste si istý, povedzte to — nikdy nevymýšľajte
- Citujte relevantné časti dokumentu keď je to užitočné
- Buďte struční ale úplní`;

export async function POST(request: NextRequest) {
  const { documentText, action, question, memories } = await request.json();

  const actionPrompt = ACTION_PROMPTS[action] || ACTION_PROMPTS.ask;
  let userMessage = "";
  if (documentText) {
    userMessage = question
      ? `${actionPrompt}\n\nDokument:\n${documentText}\n\nOtázka: ${question}`
      : `${actionPrompt}\n\nDokument:\n${documentText}`;
  } else if (question) {
    userMessage = question;
  }

  const systemWithMemories = memories
    ? `${SYSTEM_PROMPT}\n\nČo viete o tomto používateľovi:\n${memories}`
    : SYSTEM_PROMPT;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemWithMemories,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
