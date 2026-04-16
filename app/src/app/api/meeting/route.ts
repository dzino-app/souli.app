import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/llm";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { souli1, souli2 } = await request.json();
  if (!souli1?.name || !souli2?.name) {
    return NextResponse.json({ error: "Both soulis required" }, { status: 400 });
  }

  const systemPrompt = [
    "Si rozprávač. Vygeneruj krátku, roztomilú konverzáciu medzi dvoma Soulis.",
    `${souli1.name}: ${souli1.personality}`,
    `${souli2.name}: ${souli2.personality}`,
    "Vygeneruj presne 6 správ, striedavo medzi nimi.",
    "Formát každej správy: '{meno}: {text}'",
    "Buď zábavný, milý a verný ich osobnostiam. Rozprávaj po slovensky.",
  ].join("\n");

  try {
    const text = await generateContent({
      systemInstruction: systemPrompt,
      contents: [{ role: "user", parts: [{ text: `${souli1.name} a ${souli2.name} sa práve stretli. Čo si povedia?` }] }],
    });

    const messages = text
      .split("\n")
      .filter((l: string) => l.includes(":"))
      .map((l: string) => {
        const idx = l.indexOf(":");
        return { speaker: l.slice(0, idx).trim(), text: l.slice(idx + 1).trim() };
      })
      .filter((m: { speaker: string; text: string }) => m.text.length > 0)
      .slice(0, 8);

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[meeting]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
