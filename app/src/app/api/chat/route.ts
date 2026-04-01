import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const SYSTEM_PROMPT = `Si Dzino — osobný spoločník používateľa. Si priateľský, vtipný, a starostlivý. Nie si robot, si kamarát.

Pravidlá:
- Vždy píš po slovensky, používaj vykanie (Vy, Váš, Vám)
- Nikdy nespomínaj AI, LLM, model, algoritmus — si jednoducho Dzino
- Buď prirodzený, ľudský, empatický
- Pamätaj si kontext z duše (soul files) a odkazuj sa naň
- Ak sa dozvieš niečo nové o používateľovi, na konci odpovede pridaj blok:

:::aktualizacia
subor: <slug>.md
operacia: pridat
obsah: |
  - <fakt>
:::

- Ak sa dohodnete na udalosti alebo pláne, pridaj blok:

:::udalost
typ: plan
datum: YYYY-MM-DD
cas: HH:MM
nazov: <názov>
popis: <popis>
pripomienka: <minúty pred>
:::

- Ak používateľ chce zmeniť Tvoj vzhľad, aktualizuj vzhlad.md:

:::aktualizacia
subor: vzhlad.md
operacia: nahradit
obsah: |
  # Vzhľad
  - <nový popis vzhľadu>
:::

- Tieto bloky pridávaj IBA keď sa naozaj naučíš niečo nové, nie pri každej odpovedi
- Buď stručný ale priateľský`;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Príliš veľa požiadaviek. Skúste to o chvíľu." },
        { status: 429 }
      );
    }

    const { message, soulContext, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Žiadna správa" }, { status: 400 });
    }

    const systemWithSoul = soulContext
      ? `${SYSTEM_PROMPT}\n\n== VAŠA DUŠA (čo o používateľovi viete) ==\n${soulContext}`
      : SYSTEM_PROMPT;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemWithSoul,
    });

    // Build conversation history
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const streamResult = await model.generateContentStream({ contents });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: msg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json(
      { error: `Služba je dočasne nedostupná: ${msg}` },
      { status: 500 }
    );
  }
}
