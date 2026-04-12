/**
 * Vertex AI Imagen — generate unique Souli portraits.
 *
 * Uses the Google GenAI SDK (same as llm.ts) with Imagen 3 model.
 * Generates a single portrait image from a text prompt describing
 * the Souli's species, personality, and colors.
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

  throw new Error("Set GOOGLE_API_KEY or GOOGLE_CLOUD_PROJECT for Imagen");
}

export interface ImagenRequest {
  species: string;
  bodyColor: string;
  personality?: string;
  accessories?: string;
}

/**
 * Generate a Souli portrait using Imagen 3.
 * Returns base64-encoded PNG image data.
 */
export async function generatePortrait(req: ImagenRequest): Promise<string> {
  const client = getClient();

  const prompt = buildPrompt(req);

  const response = await client.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "1:1",
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    throw new Error("Imagen returned no image data");
  }

  return image.image.imageBytes;
}

function buildPrompt(req: ImagenRequest): string {
  const species = req.species === "human" ? "humanoid character" : `${req.species} character`;
  const color = req.bodyColor;
  const personality = req.personality || "friendly and curious";
  const accessories = req.accessories ? `, wearing ${req.accessories}` : "";

  return [
    `Cute pixel art style portrait of a ${species}`,
    `with ${color} as the main color${accessories}.`,
    `The character looks ${personality}.`,
    `Clean white background, centered composition,`,
    `Studio Ghibli meets pixel art aesthetic,`,
    `soft lighting, charming and expressive.`,
    `No text, no watermark.`,
  ].join(" ");
}
