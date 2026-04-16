// LLM abstraction using @google/genai
// Supports: Google AI Studio (GOOGLE_API_KEY) or Vertex AI (service account)
// Custom providers: Gemini (user key), OpenAI, Anthropic — via request headers
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
    let content = jsonStr;
    // Try parsing as JSON first, if that fails try base64 decode
    try {
      JSON.parse(content);
    } catch {
      try {
        content = Buffer.from(jsonStr, "base64").toString("utf-8");
        JSON.parse(content); // validate it's valid JSON after decode
      } catch {
        content = jsonStr;
      }
    }
    fs.writeFileSync(tmpPath, content);
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

/** Custom LLM config passed from request headers — never stored server-side. */
export interface CustomLlmConfig {
  provider: "gemini" | "openai" | "anthropic";
  apiKey: string;
  model?: string;
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

export interface GroundingSource {
  title: string;
  url: string;
}

export interface StreamChunk {
  text?: string;
  sources?: GroundingSource[];
}

export async function* generateContentStream(
  options: GenerateOptions & { enableGrounding?: boolean },
): AsyncGenerator<StreamChunk> {
  const client = getClient();
  const config: Record<string, unknown> = {};
  if (options.systemInstruction) config.systemInstruction = options.systemInstruction;

  // Google Search grounding — optional, enabled by default
  if (options.enableGrounding !== false) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await client.models.generateContentStream({
    model: options.model || "gemini-2.5-flash",
    contents: options.contents,
    config,
  });

  const collectedSources: GroundingSource[] = [];

  for await (const chunk of response) {
    if (chunk.text) {
      yield { text: chunk.text };
    }

    // Extract grounding metadata from candidates
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const candidates = (chunk as any).candidates;
    if (candidates) {
      for (const candidate of candidates) {
        const meta = candidate.groundingMetadata;
        if (meta?.groundingChunks) {
          for (const gc of meta.groundingChunks) {
            if (gc.web?.uri && gc.web?.title) {
              const exists = collectedSources.some((s) => s.url === gc.web.uri);
              if (!exists) {
                collectedSources.push({
                  title: gc.web.title,
                  url: gc.web.uri,
                });
              }
            }
          }
        }
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  // Yield sources at the end if any were collected
  if (collectedSources.length > 0) {
    yield { sources: collectedSources };
  }
}

// ---- Custom provider streaming ----

function buildMessagesForOpenAI(
  options: GenerateOptions
): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  for (const c of options.contents) {
    messages.push({
      role: c.role === "model" ? "assistant" : "user",
      content: c.parts.map((p) => p.text).join(""),
    });
  }
  return messages;
}

export async function* generateContentStreamCustom(
  config: CustomLlmConfig,
  options: GenerateOptions
) {
  if (config.provider === "gemini") {
    // Use Google AI Studio with user's own API key
    const client = new GoogleGenAI({ apiKey: config.apiKey });
    const genConfig: Record<string, unknown> = {};
    if (options.systemInstruction)
      genConfig.systemInstruction = options.systemInstruction;

    const response = await client.models.generateContentStream({
      model: config.model || "gemini-2.5-flash",
      contents: options.contents,
      config: genConfig,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  } else if (config.provider === "openai") {
    const messages = buildMessagesForOpenAI(options);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || "gpt-4o",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          // skip malformed chunks
        }
      }
    }
  } else if (config.provider === "anthropic") {
    const messages = buildMessagesForOpenAI(options);
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model || "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemMsg?.content || "",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${response.status} ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (
            parsed.type === "content_block_delta" &&
            parsed.delta?.type === "text_delta"
          ) {
            yield parsed.delta.text;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}
