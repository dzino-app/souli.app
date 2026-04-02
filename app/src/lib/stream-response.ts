import { getDecayedSoulContext } from "@/lib/soul-retrieval";
import { getUserLanguage } from "@/lib/languages";

const TIMEOUT_MS = 60_000;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChatResponse(
  message: string,
  history: ChatMessage[] = [],
  onChunk?: (text: string) => void
): Promise<string> {
  const soulContext = getDecayedSoulContext(message);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, soulContext, history, language: getUserLanguage() }),
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
            if (parsed.text) {
              fullText += parsed.text;
              onChunk?.(fullText);
            }
          } catch {
            // skip parse errors
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
