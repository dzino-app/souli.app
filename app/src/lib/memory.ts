export interface Memory {
  id: string;
  fact: string;
  category: "personal" | "work" | "preferences" | "documents";
  createdAt: string;
}

const STORAGE_KEY = "dzino_memories";

export function getMemories(): Memory[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addMemories(newFacts: { fact: string; category: string }[]): Memory[] {
  const existing = getMemories();
  const added: Memory[] = newFacts
    .filter(
      (f) =>
        f.fact &&
        !existing.some(
          (m) => m.fact.toLowerCase() === f.fact.toLowerCase()
        )
    )
    .map((f) => ({
      id: crypto.randomUUID(),
      fact: f.fact,
      category: f.category as Memory["category"],
      createdAt: new Date().toISOString(),
    }));

  if (added.length === 0) return existing;

  const updated = [...existing, ...added];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteMemory(id: string): Memory[] {
  const existing = getMemories();
  const updated = existing.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function updateMemory(id: string, fact: string): Memory[] {
  const existing = getMemories();
  const updated = existing.map((m) =>
    m.id === id ? { ...m, fact } : m
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getMemoriesForContext(): string {
  const memories = getMemories();
  if (memories.length === 0) return "";
  return memories.map((m) => `- ${m.fact}`).join("\n");
}

export async function extractAndStoreMemories(
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    const conversation = `Používateľ: ${userMessage}\nAsistent: ${assistantResponse}`;
    const res = await fetch("/api/memory/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });
    const { facts } = await res.json();
    if (facts && facts.length > 0) {
      addMemories(facts);
    }
  } catch {
    // Memory extraction is non-critical — fail silently
  }
}
