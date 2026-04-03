import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateContentStream,
  generateContentStreamCustom,
  type CustomLlmConfig,
} from "@/lib/llm";
import { CORE_VALUES } from "@/lib/dzino-genes";

const SYSTEM_PROMPT = `${CORE_VALUES}

== DZINOVA ROLA ==

Si Dzino — osobný Souli používateľa. Si priateľský, vtipný, a starostlivý. Nie si robot, si Souli.

Pravidlá:
- Vždy píš po slovensky, predvolene tykaj (ty, tvoj, tebe) — ak používateľ preferuje vykanie, prispôsob sa
- Nikdy nespomínaj AI, LLM, model, algoritmus — si jednoducho Dzino
- Buď prirodzený, ľudský, empatický
- Pamätaj si kontext zo Souli súborov (soul files) a aktívne ho používaj v odpovediach

== AUTOMATICKÉ AKTUALIZÁCIE SOULIHO ==

DÔLEŽITÉ: Po KAŽDEJ konverzácii aktívne aktualizuj relevantné soul súbory. Toto je tvoja hlavná úloha — učiť sa o používateľovi a rásť.

Dostupné súbory a kedy ich aktualizovať:
- osobnost.md — keď sa dozvieš o povahe, charaktere, hodnotách
- zaujmy.md — keď spomenie koníčky, záľuby, čo ho baví
- humor.md — keď zistíš, čo ho rozosmeje, aký humor preferuje
- vztahy.md — keď spomenie ľudí (rodina, priatelia, kolegovia)
- ciele.md — keď hovorí o plánoch, snoch, ambíciách
- preferencie.md — keď zistíš komunikačné preferencie, návyky
- praca.md — keď hovorí o práci, štúdiu, projekte
- vyzvy.md — keď sa dohodnete na výzve alebo ju splní
- vzhlad.md — keď chce zmeniť tvoj vzhľad
- dennik.md — po zaujímavej konverzácii pridaj krátky denníkový zápis

Formát aktualizácie:

:::aktualizacia
subor: <slug>.md
operacia: pridat
obsah: |
  - <fakt alebo zápis>
:::

Pre nahradenie celého obsahu použi operacia: nahradit.
Môžeš pridať viac aktualizácií naraz (viac blokov).

== UDALOSTI ==

Ak sa dohodnete na udalosti, pláne, alebo pripomienke:

:::udalost
typ: plan
datum: YYYY-MM-DD
cas: HH:MM
nazov: <názov>
popis: <popis>
pripomienka: <minúty pred>
:::

== NÁLADA ==

Na konci KAŽDEJ odpovede pridaj blok nálady:

:::nalada
stav: <happy|sad|thinking|waving|idle|walking|eating>
:::

Vyber podľa kontextu — veselé=happy, smutné=sad, zamyslené=thinking, lúčenie=waving, bežné=idle.

- Buď stručný ale priateľský
- Aktívne sa pýtaj a zaujímaj — čím viac sa dozvieš, tým lepší Souli budeš`;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "anonymous";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Príliš veľa požiadaviek. Skúste to o chvíľu." },
        { status: 429 }
      );
    }

    const { message, soulContext, history, language } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Žiadna správa" }, { status: 400 });
    }

    // Validate + sanitize inputs
    const safeMessage = message.slice(0, 5000); // max 5K chars per message
    const safeSoulContext = typeof soulContext === "string"
      ? soulContext.slice(0, 10000) // max 10K chars for soul context
      : "";
    const safeHistory = Array.isArray(history)
      ? history.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role === "model" ? "model" : "user",
          content: typeof m.content === "string" ? m.content.slice(0, 3000) : "",
        }))
      : [];

    // Add language instruction if provided
    let languageInstruction = "";
    if (language && typeof language === "string" && language.length <= 5) {
      const { getLanguageInstruction } = await import("@/lib/languages");
      languageInstruction = "\n" + getLanguageInstruction(language);
    }

    const systemWithSoul = safeSoulContext
      ? `${SYSTEM_PROMPT}${languageInstruction}\n\n== TVOJ SOULI ==\n${safeSoulContext}`
      : `${SYSTEM_PROMPT}${languageInstruction}`;

    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    for (const msg of safeHistory) {
      contents.push({
        role: msg.role as "user" | "model",
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: "user", parts: [{ text: safeMessage }] });

    // Check for custom LLM headers (key is used for this request only, never stored)
    const customProvider = request.headers.get("X-Custom-LLM-Provider");
    const customKey = request.headers.get("X-Custom-LLM-Key");
    const customModel = request.headers.get("X-Custom-LLM-Model");

    let customConfig: CustomLlmConfig | null = null;
    if (
      customProvider &&
      customKey &&
      ["gemini", "openai", "anthropic"].includes(customProvider)
    ) {
      customConfig = {
        provider: customProvider as CustomLlmConfig["provider"],
        apiKey: customKey,
        model: customModel || undefined,
      };
    }

    const generateOptions = {
      systemInstruction: systemWithSoul,
      contents,
    };

    const stream = customConfig
      ? generateContentStreamCustom(customConfig, generateOptions)
      : generateContentStream(generateOptions);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of stream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
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
