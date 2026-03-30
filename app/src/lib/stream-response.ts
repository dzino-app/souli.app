export async function streamChatResponse(
  documentText: string,
  action: string,
  question?: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText, action, question }),
  });

  if (!response.ok) {
    throw new Error("Niečo sa nepodarilo");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No stream");

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
}
