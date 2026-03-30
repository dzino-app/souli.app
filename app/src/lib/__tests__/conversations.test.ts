import { describe, it, expect, beforeEach } from "bun:test";
import {
  getConversations,
  createConversation,
  addMessage,
  getConversation,
  deleteConversation,
} from "../conversations";

describe("conversations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with no conversations", () => {
    expect(getConversations()).toEqual([]);
  });

  it("creates a conversation", () => {
    const conv = createConversation("Ahoj, ako sa máte?");
    expect(conv.title).toContain("Ahoj");
    expect(getConversations()).toHaveLength(1);
  });

  it("adds messages to conversation", () => {
    const conv = createConversation("Test");
    addMessage(conv.id, "user", "Otázka");
    addMessage(conv.id, "assistant", "Odpoveď");

    const updated = getConversation(conv.id);
    expect(updated?.messages).toHaveLength(2);
    expect(updated?.messages[0].role).toBe("user");
    expect(updated?.messages[1].role).toBe("assistant");
  });

  it("deletes a conversation", () => {
    const conv = createConversation("Test");
    deleteConversation(conv.id);
    expect(getConversations()).toHaveLength(0);
  });

  it("truncates long titles", () => {
    const longMessage = "A".repeat(100);
    const conv = createConversation(longMessage);
    expect(conv.title.length).toBeLessThan(70);
    expect(conv.title).toContain("...");
  });
});
