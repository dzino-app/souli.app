// LLM abstraction using @google/genai — supports both Google AI Studio and Vertex AI
// Vertex AI: uses GOOGLE_CLOUD_PROJECT + GOOGLE_APPLICATION_CREDENTIALS
// Google AI Studio: uses GOOGLE_API_KEY

import { GoogleGenAI } from "@google/genai";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  // Vertex AI — uses application default credentials
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "europe-west1";
  if (project) {
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }

  throw new Error("Set GOOGLE_API_KEY or GOOGLE_CLOUD_PROJECT in .env.local");
}

export interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  jsonMode?: boolean;
}

export async function generateContent(options: GenerateOptions): Promise<string> {
  const client = getClient();
  const modelName = options.model || "gemini-2.5-flash";

  const config: Record<string, unknown> = {};
  if (options.jsonMode) {
    config.responseMimeType = "application/json";
  }
  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  const response = await client.models.generateContent({
    model: modelName,
    contents: options.contents,
    config,
  });

  return response.text || "";
}

export async function* generateContentStream(options: GenerateOptions) {
  const client = getClient();
  const modelName = options.model || "gemini-2.5-flash";

  const config: Record<string, unknown> = {};
  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  const response = await client.models.generateContentStream({
    model: modelName,
    contents: options.contents,
    config,
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}
