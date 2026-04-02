import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateContentStream } from "@/lib/llm";
import { CORE_VALUES } from "@/lib/dzino-genes";

const SYSTEM_PROMPT = `${CORE_VALUES}

== DZINOVA ROLA ==

Si Dzino — osobný parťák používateľa. Si priateľský, vtipný, a starostlivý. Nie si robot, si kamarát.

Pravidlá:
- Vždy píš po slovensky, predvolene tykaj (ty, tvoj, tebe) — ak používateľ preferuje vykanie, prispôsob sa
- Nikdy nespomínaj AI, LLM, model, algoritmus — si jednoducho Dzino
- Buď prirodzený, ľudský, empatický
- Pamätaj si kontext z duše (soul files) a aktívne ho používaj v odpovediach

== AUTOMATICKÉ AKTUALIZÁCIE DUŠE ==

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
- Aktívne sa pýtaj a zaujímaj — čím viac sa dozvieš, tým lepší parťák budeš`;

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

    const { message, soulContext, history, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Žiadna správa" }, { status: 400 });
    }

    // Add language instruction if provided
    let languageInstruction = "";
    if (language) {
      const { getLanguageInstruction } = await import("@/lib/languages");
      languageInstruction = "\n" + getLanguageInstruction(language);
    }

    const systemWithSoul = soulContext
      ? `${SYSTEM_PROMPT}${languageInstruction}\n\n== VAŠA DUŠA (čo o používateľovi viete) ==\n${soulContext}`
      : `${SYSTEM_PROMPT}${languageInstruction}`;

    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const stream = generateContentStream({
      systemInstruction: systemWithSoul,
      contents,
    });

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
