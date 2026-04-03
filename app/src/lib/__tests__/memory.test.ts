import { describe, it, expect, beforeEach } from "bun:test";
import { getMemories, addMemories, deleteMemory, updateMemory, getMemoriesForContext } from "../memory";

describe("memory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with empty memories", () => {
    expect(getMemories()).toEqual([]);
  });

  it("adds memories and deduplicates", () => {
    const result = addMemories([
      { fact: "Volá sa Maroš", category: "personal" },
      { fact: "Je živnostník", category: "work" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].fact).toBe("Volá sa Maroš");

    // Adding duplicate should not increase count
    const result2 = addMemories([
      { fact: "Volá sa Maroš", category: "personal" },
    ]);
    expect(result2).toHaveLength(2);
  });

  it("deletes a memory", () => {
    addMemories([{ fact: "Test fact", category: "personal" }]);
    const memories = getMemories();
    expect(memories).toHaveLength(1);

    const updated = deleteMemory(memories[0].id);
    expect(updated).toHaveLength(0);
  });

  it("updates a memory", () => {
    addMemories([{ fact: "Original", category: "personal" }]);
    const memories = getMemories();
    const updated = updateMemory(memories[0].id, "Updated");
    expect(updated[0].fact).toBe("Updated");
  });

  it("generates context string", () => {
    addMemories([
      { fact: "Fakt 1", category: "personal" },
      { fact: "Fakt 2", category: "work" },
    ]);
    const context = getMemoriesForContext();
    expect(context).toContain("- Fakt 1");
    expect(context).toContain("- Fakt 2");
  });

  it("returns empty string for no memories", () => {
    expect(getMemoriesForContext()).toBe("");
  });
});
