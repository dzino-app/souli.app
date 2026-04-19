import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, locale } = (await request.json()) as { topic: string; locale: string };
  if (!topic || topic.length < 3) {
    return NextResponse.json({ error: "Topic too short" }, { status: 400 });
  }
  if (topic.length > 200) {
    return NextResponse.json({ error: "Topic too long" }, { status: 400 });
  }

  const langName =
    { sk: "Slovak", en: "English", cs: "Czech", de: "German", es: "Spanish", fr: "French", hi: "Hindi", hu: "Hungarian", pl: "Polish" }[locale || "en"] || "English";

  const systemPrompt = [
    "You are a thoughtful coach designing a 30-day personal growth journey.",
    "The user will give you a topic. Design 30 daily activities that gradually build on each other.",
    "Each day should have:",
    "- A specific, actionable prompt (1-3 sentences)",
    "- A short focus word/phrase (2-4 words)",
    "Days 1-10: foundation and easy wins",
    "Days 11-20: deepening practice",
    "Days 21-30: integration and challenge",
    "Keep it warm, fairytale-tinged, never preachy.",
    `Return ONLY valid JSON in this exact shape, in ${langName} language:`,
    `{"title":"...","description":"1-2 sentence overview","days":[{"day":1,"prompt":"...","focus":"..."},... 30 items]}`,
  ].join("\n");

  try {
    const text = await generateContent({
      systemInstruction: systemPrompt,
      contents: [{ role: "user", parts: [{ text: `Topic: ${topic}` }] }],
    });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid LLM response" }, { status: 502 });
    }

    let parsed: { title: string; description: string; days: { day: number; prompt: string; focus: string }[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Failed to parse LLM response" }, { status: 502 });
    }

    if (!parsed.title || !Array.isArray(parsed.days) || parsed.days.length < 20) {
      return NextResponse.json({ error: "Incomplete program from LLM" }, { status: 502 });
    }

    // Trim/pad to exactly 30 days
    const days = parsed.days.slice(0, 30).map((d, i) => ({
      day: i + 1,
      prompt: d.prompt || "",
      focus: d.focus || "",
    }));
    while (days.length < 30) {
      days.push({ day: days.length + 1, prompt: "Reflect on your journey.", focus: "reflection" });
    }

    // Insert into DB
    const { data: program, error } = await supabase
      .from("programs")
      .insert({
        title: parsed.title.slice(0, 100),
        description: parsed.description?.slice(0, 300) ?? null,
        days,
        total_days: 30,
        locale,
        creator_id: user.id,
        is_official: false,
        is_public: false, // user's own custom, not shared by default
        category: "custom",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ program });
  } catch (err) {
    console.error("[programs/generate]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
