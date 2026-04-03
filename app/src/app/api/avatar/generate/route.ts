import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateContent } from "@/lib/llm";

const BASE_PROMPT = `You are a voxel artist. Generate a 16×16×16 voxel character as a 3D array.

The grid is grid[y][z][x] where:
- y = height (0=feet, 15=top of head)
- z = depth (0=front, 15=back)
- x = width (0=left, 15=right)
- null = empty/air
- "#RRGGBB" = colored voxel

Character description: {description}

Design a cute, friendly voxel character that fits in 16×16×16. Include:
- Head (upper portion, ~6 voxels tall)
- Body (middle, ~4 voxels tall)
- Legs (bottom, ~3 voxels)
- Eyes (2 dark voxels on front face of head)
- Mouth (1-2 voxels below eyes)
- Any accessories mentioned in the description

Use vibrant colors. The character should look charming and blocky (Minecraft-style).

Return ONLY a JSON object with this exact structure:
{
  "grid": [16 layers, each is 16×16 array of null or "#RRGGBB"]
}`;

const ANIMATION_PROMPT = `You are a voxel animator. Given a base 16×16×16 voxel character grid, generate animation frames.

Base character grid:
{baseGrid}

Generate {frameCount} frames for: {activity} ({activityDesc})
Each frame is a complete 16×16×16 grid. Frame 1 and last frame should be close to base pose.

Return ONLY: { "frames": [array of grids] }`;

const ACTIVITIES = [
  { key: "idle", desc: "Gentle breathing — subtle body bob", frames: 4 },
  { key: "walk", desc: "Walking in place — legs alternate", frames: 6 },
  { key: "talk", desc: "Talking — mouth opens/closes", frames: 4 },
  { key: "happy", desc: "Jumping with joy", frames: 4 },
  { key: "sad", desc: "Slouching sadly", frames: 4 },
  { key: "wave", desc: "Waving hello", frames: 4 },
  { key: "think", desc: "Thinking — tilts head", frames: 4 },
  { key: "eat", desc: "Eating — chewing motion", frames: 6 },
  { key: "sleep", desc: "Sleeping — slow breathing", frames: 2 },
];

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Príliš veľa požiadaviek" }, { status: 429 });
  }

  try {
    const { description, generateAnimations } = await request.json();
    if (!description) {
      return NextResponse.json({ error: "Chýba popis postavy" }, { status: 400 });
    }

    // Generate base character
    const baseText = await generateContent({
      contents: [{ role: "user", parts: [{ text: BASE_PROMPT.replace("{description}", description) }] }],
      jsonMode: true,
    });
    const baseData = JSON.parse(baseText);

    if (!baseData.grid || !Array.isArray(baseData.grid)) {
      return NextResponse.json({ error: "Nepodarilo sa vygenerovať postavu" }, { status: 500 });
    }

    const result: { baseGrid: unknown; animations: Record<string, unknown[]>; description: string } = {
      baseGrid: baseData.grid,
      animations: {},
      description,
    };

    if (generateAnimations) {
      const baseGridStr = JSON.stringify(baseData.grid).slice(0, 6000);

      const generateAnim = async (a: (typeof ACTIVITIES)[0]) => {
        try {
          const prompt = ANIMATION_PROMPT
            .replace("{baseGrid}", baseGridStr)
            .replace("{activity}", a.key)
            .replace("{activityDesc}", a.desc)
            .replace("{frameCount}", String(a.frames));
          const text = await generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            jsonMode: true,
          });
          const data = JSON.parse(text);
          return { key: a.key, frames: data.frames || [] };
        } catch {
          return { key: a.key, frames: [] };
        }
      };

      // Priority: idle + talk first
      for (const a of ACTIVITIES.filter((a) => a.key === "idle" || a.key === "talk")) {
        const { key, frames } = await generateAnim(a);
        result.animations[key] = frames;
      }

      // Rest in parallel batches
      const rest = ACTIVITIES.filter((a) => a.key !== "idle" && a.key !== "talk");
      for (let i = 0; i < rest.length; i += 3) {
        const batch = rest.slice(i, i + 3);
        const results = await Promise.all(batch.map(generateAnim));
        for (const { key, frames } of results) {
          result.animations[key] = frames;
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Generovanie zlyhalo: ${message}` }, { status: 500 });
  }
}
