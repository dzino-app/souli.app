import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

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

The grid format is grid[y][z][x] where y=height, z=depth, x=width.
null = empty, "#RRGGBB" = colored voxel.

Base character grid:
{baseGrid}

Generate animation frames for this activity: {activity}
Description: {activityDesc}

Create {frameCount} frames. Each frame should be a complete 16×16×16 grid.
Modify the base grid to create the animation — move limbs, shift body, change expressions.
Frame 1 and the last frame should be close to the base pose for seamless looping.

Return ONLY a JSON object:
{
  "frames": [array of {frameCount} complete 16×16×16 grids]
}`;

const ACTIVITIES = [
  { key: "idle", desc: "Gentle breathing — subtle body bob up and down", frames: 4 },
  { key: "walk", desc: "Walking in place — legs alternate, body sways", frames: 6 },
  { key: "talk", desc: "Talking — mouth opens/closes, slight body movement", frames: 4 },
  { key: "happy", desc: "Jumping with joy — bounces up high, arms up", frames: 4 },
  { key: "sad", desc: "Slouching sadly — head down, slow sway", frames: 4 },
  { key: "wave", desc: "Waving hello — one arm goes up and waves", frames: 4 },
  { key: "think", desc: "Thinking — tilts head, looks up", frames: 4 },
  { key: "eat", desc: "Eating — brings hands to mouth, chewing motion", frames: 6 },
  { key: "sleep", desc: "Sleeping — eyes closed, slow breathing, very subtle", frames: 2 },
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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // Step 1: Generate base character
    const baseResult = await model.generateContent(
      BASE_PROMPT.replace("{description}", description)
    );
    const baseData = JSON.parse(baseResult.response.text());

    if (!baseData.grid || !Array.isArray(baseData.grid)) {
      return NextResponse.json({ error: "Nepodarilo sa vygenerovať postavu" }, { status: 500 });
    }

    const result: {
      baseGrid: unknown;
      animations: Record<string, unknown[]>;
      description: string;
    } = {
      baseGrid: baseData.grid,
      animations: {},
      description,
    };

    // Step 2: Generate animations (if requested)
    if (generateAnimations) {
      const baseGridStr = JSON.stringify(baseData.grid).slice(0, 6000);

      const generateAnim = async (
        activity: (typeof ACTIVITIES)[0]
      ): Promise<{ key: string; frames: unknown[] }> => {
        try {
          const prompt = ANIMATION_PROMPT.replace("{baseGrid}", baseGridStr)
            .replace("{activity}", activity.key)
            .replace("{activityDesc}", activity.desc)
            .replace("{frameCount}", String(activity.frames));

          const animResult = await model.generateContent(prompt);
          const animData = JSON.parse(animResult.response.text());
          return { key: activity.key, frames: animData.frames || [] };
        } catch {
          return { key: activity.key, frames: [] };
        }
      };

      // Generate priority animations first (idle + talk)
      for (const activity of ACTIVITIES.filter((a) => a.key === "idle" || a.key === "talk")) {
        const { key, frames } = await generateAnim(activity);
        result.animations[key] = frames;
      }

      // Rest in parallel batches of 3
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
