/**
 * Vertex AI Veo — generate short Souli video clips.
 *
 * Uses the Google GenAI SDK with Veo 2 model to generate
 * 2-4 second animation clips of Soulis.
 */

import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (_client) return _client;

  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    _client = new GoogleGenAI({ apiKey });
    return _client;
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "europe-west3";
  if (project) {
    _client = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
    return _client;
  }

  throw new Error("Set GOOGLE_API_KEY or GOOGLE_CLOUD_PROJECT for Veo");
}

export interface VeoRequest {
  species: string;
  bodyColor: string;
  personality?: string;
  action?: string;
}

/**
 * Generate a short Souli video clip using Veo 2.
 * Returns base64-encoded MP4 video data.
 *
 * Veo generation is async — we poll until the operation completes.
 */
export async function generateVideo(req: VeoRequest): Promise<string> {
  const client = getClient();

  const prompt = buildVideoPrompt(req);

  const operation = await client.models.generateVideos({
    model: "veo-2.0-generate-001",
    prompt,
    config: {
      numberOfVideos: 1,
      durationSeconds: 4,
      aspectRatio: "1:1",
    },
  });

  // Poll for completion (Veo is async)
  let result = operation;
  while (!result.done) {
    await new Promise((r) => setTimeout(r, 5000));
    result = await client.operations.getVideosOperation({
      operation: result,
    });
  }

  const video = result.response?.generatedVideos?.[0];
  if (!video?.video?.videoBytes) {
    throw new Error("Veo returned no video data");
  }

  return video.video.videoBytes;
}

function buildVideoPrompt(req: VeoRequest): string {
  const species = req.species === "human" ? "humanoid character" : `${req.species} creature`;
  const action = req.action || "waving and smiling";
  const personality = req.personality || "friendly";

  return [
    `A cute pixel art style ${species} with ${req.bodyColor} color,`,
    `${action} in a playful ${personality} way.`,
    `Clean white background, centered, looping animation.`,
    `Studio Ghibli pixel art aesthetic. No text.`,
  ].join(" ");
}
