import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/llm";

const FORMATS = [
  "fact",       // Quick "did you know?" with quiz
  "concept",    // Explain a concept in 3 steps
  "debate",     // Present two sides, ask user what they think
  "experiment", // Try this today — a small real-world experiment
  "story",      // A short fascinating story from history/science
] as const;

type Format = (typeof FORMATS)[number];

const FORMAT_PROMPTS: Record<Format, string> = {
  fact: `Generate a "Did you know?" micro-lesson.
Return JSON:
{
  "emoji": "relevant emoji",
  "category": "short category name",
  "title": "catchy title (max 6 words)",
  "fact": "one surprising sentence",
  "explanation": "2-3 sentences explaining why it's interesting",
  "quiz": {
    "question": "test question about the fact",
    "options": ["wrong", "correct", "wrong"],
    "correctIndex": 1
  }
}`,
  concept: `Generate a mini-lesson that explains one concept in 3 simple steps.
Return JSON:
{
  "emoji": "relevant emoji",
  "category": "short category name",
  "title": "concept name (max 5 words)",
  "steps": [
    { "title": "step title", "content": "1-2 sentences" },
    { "title": "step title", "content": "1-2 sentences" },
    { "title": "step title", "content": "1-2 sentences" }
  ],
  "tryThis": "one practical thing the user can try today",
  "quiz": {
    "question": "test question",
    "options": ["wrong", "correct", "wrong"],
    "correctIndex": 1
  }
}`,
  debate: `Generate a fun "what do you think?" dilemma or thought experiment.
Return JSON:
{
  "emoji": "relevant emoji",
  "category": "short category name",
  "title": "dilemma title (max 6 words)",
  "setup": "1-2 sentences describing the dilemma",
  "sideA": { "label": "short label", "argument": "1-2 sentences" },
  "sideB": { "label": "short label", "argument": "1-2 sentences" },
  "funFact": "interesting related fact"
}`,
  experiment: `Generate a small real-world experiment or challenge the user can try in 5-10 minutes.
Return JSON:
{
  "emoji": "relevant emoji",
  "category": "short category name",
  "title": "experiment name (max 6 words)",
  "why": "1 sentence — why this is interesting",
  "steps": ["step 1", "step 2", "step 3"],
  "whatToNotice": "what should they observe or feel",
  "science": "1-2 sentences explaining the science behind it"
}`,
  story: `Generate a short fascinating true story (from history, science, nature, or people).
Return JSON:
{
  "emoji": "relevant emoji",
  "category": "short category name",
  "title": "story title (max 6 words)",
  "hook": "1 sentence that hooks the reader",
  "story": "3-4 sentences telling the story",
  "twist": "surprising ending or takeaway",
  "quiz": {
    "question": "test question about the story",
    "options": ["wrong", "correct", "wrong"],
    "correctIndex": 1
  }
}`,
};

export async function POST(request: NextRequest) {
  try {
    const { topic, format: requestedFormat, language } = await request.json();

    // Pick format: user-requested or random
    const format: Format = requestedFormat && FORMATS.includes(requestedFormat)
      ? requestedFormat
      : FORMATS[Math.floor(Math.random() * FORMATS.length)];

    const lang = language || "sk";
    const topicInstruction = topic
      ? `Topic/area: "${topic}". Generate something related to this.`
      : "Pick any interesting topic from: psychology, nature, space, biology, philosophy, history, physics, creativity, habits, relationships, health, technology.";

    const prompt = `${FORMAT_PROMPTS[format]}

${topicInstruction}

IMPORTANT:
- Write in ${lang === "sk" ? "Slovak" : lang === "cs" ? "Czech" : "English"}
- Be accurate — no made-up facts
- Make it genuinely interesting, not obvious
- Target curious adults, not children
- Return ONLY valid JSON, no markdown`;

    const result = await generateContent({
      systemInstruction: "You are an educational content generator. Return only valid JSON.",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const jsonStr = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      format,
      content: parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
