import { getIndexBasedContext } from "@/lib/soul-retrieval";
import { getUserLanguage, setUserLanguage, detectLanguage } from "@/lib/languages";
import { isAlreadyTranslated, translateSoulFiles } from "@/lib/soul-translator";
import { getTodayMood } from "@/lib/mood-tracking";
import { getLlmSettings, getUserSettings } from "@/lib/user-settings";

const TIMEOUT_MS = 60_000;

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: GroundingSource[];
}

export async function streamChatResponse(
  message: string,
  history: ChatMessage[] = [],
  onChunk?: (text: string) => void,
  onSources?: (sources: GroundingSource[]) => void,
): Promise<string> {
  // Safety: filter out any ciphertext from history before sending to LLM.
  // If decryption failed somewhere, we never want to send enc:base64... to Gemini.
  const safeHistory = history.filter((m) => !m.content.startsWith("enc:"));

  // Use index-based retrieval (falls back to keyword-based if no _index.md)
  const soulContext = getIndexBasedContext(message);

  // Detect language from every message — fluid switching
  let language = getUserLanguage();
  const detected = detectLanguage(message);
  if (detected && detected !== language) {
    setUserLanguage(detected);
    language = detected;

    // Translate soul files to new language (async, non-blocking for first response)
    if (!isAlreadyTranslated(language)) {
      translateSoulFiles(language).catch(() => {});
    }
  }
  if (!language) {
    language = "en";
  }

  // Include today's mood in context
  const todayMood = getTodayMood();
  const moodContext = todayMood
    ? `\n== DNEŠNÁ NÁLADA ==\nPoužívateľ sa dnes cíti: ${
        todayMood.mood <= 2 ? "zle/smutne" :
        todayMood.mood === 3 ? "neutrálne" :
        "dobre/šťastne"
      }${todayMood.note ? ` (poznámka: "${todayMood.note}")` : ""}\nPrispôsob tón odpovede — ak je smutný, buď empatický a jemný. Ak je šťastný, buď energický a zábavný.`
    : "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Include custom LLM headers if the user has configured their own key
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const llmSettings = getLlmSettings();
    if (llmSettings.customLlmApiKey && llmSettings.customLlmProvider) {
      headers["X-Custom-LLM-Provider"] = llmSettings.customLlmProvider;
      headers["X-Custom-LLM-Key"] = llmSettings.customLlmApiKey;
      if (llmSettings.customLlmModel) {
        headers["X-Custom-LLM-Model"] = llmSettings.customLlmModel;
      }
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({ message, soulContext: soulContext + moodContext, history: safeHistory, language: getUserLanguage(), enableGrounding: getUserSettings().webGrounding }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        throw new Error("Príliš veľa požiadaviek. Skúste to o chvíľu.");
      }
      if (status >= 500) {
        throw new Error("Služba je dočasne nedostupná. Skúste to znova.");
      }
      throw new Error("Niečo sa nepodarilo");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Niečo sa nepodarilo");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.sources && onSources) {
              onSources(parsed.sources);
            }
            if (parsed.text) {
              fullText += parsed.text;
              onChunk?.(fullText);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }
    }

    return fullText;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Odpoveď trvá príliš dlho. Skúste to znova.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
