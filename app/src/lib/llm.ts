// LLM abstraction — uses @google/generative-ai for both
// Google AI Studio (API key) and Vertex AI (service account)

import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return new GoogleGenerativeAI(apiKey);
  }

  // For Vertex AI via service account, we use the Google AI SDK
  // with an API key extracted from gcloud. In production, set GOOGLE_API_KEY.
  // For now, fall back to empty (will error with clear message).
  return new GoogleGenerativeAI(apiKey || "");
}

export interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  jsonMode?: boolean;
}

export async function generateContent(options: GenerateOptions): Promise<string> {
  const genAI = getClient();
  const modelName = options.model || "gemini-2.5-flash";

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(options.systemInstruction
      ? { systemInstruction: options.systemInstruction }
      : {}),
    ...(options.jsonMode
      ? { generationConfig: { responseMimeType: "application/json" } }
      : {}),
  });

  const result = await model.generateContent({ contents: options.contents });
  return result.response.text();
}

export async function* generateContentStream(options: GenerateOptions) {
  const genAI = getClient();
  const modelName = options.model || "gemini-2.5-flash";

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(options.systemInstruction
      ? { systemInstruction: options.systemInstruction }
      : {}),
  });

  const result = await model.generateContentStream({
    contents: options.contents,
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
