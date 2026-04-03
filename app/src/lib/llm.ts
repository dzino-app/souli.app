// LLM abstraction using @google/genai
// Supports: Google AI Studio (GOOGLE_API_KEY) or Vertex AI (service account)
// For Vercel: pass GOOGLE_CLOUD_CREDENTIALS_JSON env var (JSON string)

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

let credentialsWritten = false;

// Ensure GOOGLE_APPLICATION_CREDENTIALS points to a file
// On Vercel, we get the JSON as an env var and write it to a temp file
function ensureCredentials() {
  if (credentialsWritten) return;

  const jsonStr = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (jsonStr && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const tmpPath = path.join(os.tmpdir(), "gcp-credentials.json");
    fs.writeFileSync(tmpPath, jsonStr);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  }

  credentialsWritten = true;
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  // Vertex AI
  ensureCredentials();
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "europe-west3";
  if (project) {
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }

  throw new Error("Set GOOGLE_API_KEY or GOOGLE_CLOUD_PROJECT");
}

export interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  jsonMode?: boolean;
}

export async function generateContent(options: GenerateOptions): Promise<string> {
  const client = getClient();
  const config: Record<string, unknown> = {};
  if (options.jsonMode) config.responseMimeType = "application/json";
  if (options.systemInstruction) config.systemInstruction = options.systemInstruction;

  const response = await client.models.generateContent({
    model: options.model || "gemini-2.5-flash",
    contents: options.contents,
    config,
  });

  return response.text || "";
}

export async function* generateContentStream(options: GenerateOptions) {
  const client = getClient();
  const config: Record<string, unknown> = {};
  if (options.systemInstruction) config.systemInstruction = options.systemInstruction;

  const response = await client.models.generateContentStream({
    model: options.model || "gemini-2.5-flash",
    contents: options.contents,
    config,
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}
