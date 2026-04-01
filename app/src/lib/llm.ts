// LLM abstraction — uses Google AI Studio (API key) or Vertex AI (gcloud auth)
// Falls back automatically based on which env vars are set

import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";

export type LLMProvider = "google-ai" | "vertex-ai";

function getProvider(): LLMProvider {
  if (process.env.GOOGLE_API_KEY) return "google-ai";
  if (process.env.GOOGLE_CLOUD_PROJECT) return "vertex-ai";
  return "google-ai"; // default, will fail with clear error
}

// Google AI Studio client
function getGoogleAI() {
  return new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
}

// Vertex AI client
function getVertexAI() {
  return new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "global",
  });
}

export interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  stream?: boolean;
  jsonMode?: boolean;
}

export async function generateContent(options: GenerateOptions) {
  const provider = getProvider();
  const modelName = options.model || "gemini-2.5-flash";

  if (provider === "google-ai") {
    const genAI = getGoogleAI();
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
  } else {
    const vertexAI = getVertexAI();
    const model = vertexAI.getGenerativeModel({
      model: modelName,
      ...(options.jsonMode
        ? { generationConfig: { responseMimeType: "application/json" } }
        : {}),
    });
    const result = await model.generateContent({
      ...(options.systemInstruction
        ? {
            systemInstruction: {
              role: "system" as const,
              parts: [{ text: options.systemInstruction }],
            },
          }
        : {}),
      contents: options.contents,
    });
    return result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

export async function* generateContentStream(options: GenerateOptions) {
  const provider = getProvider();
  const modelName = options.model || "gemini-2.5-flash";

  if (provider === "google-ai") {
    const genAI = getGoogleAI();
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
  } else {
    const vertexAI = getVertexAI();
    const model = vertexAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContentStream({
      ...(options.systemInstruction
        ? {
            systemInstruction: {
              role: "system" as const,
              parts: [{ text: options.systemInstruction }],
            },
          }
        : {}),
      contents: options.contents,
    });
    for await (const chunk of result.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) yield text;
    }
  }
}
