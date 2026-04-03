export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "dzino_conversations";

export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function createConversation(firstMessage: string): Conversation {
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "..." : ""),
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getConversations();
  all.unshift(conversation);
  saveConversations(all);

  // Async sync to Supabase
  import("./supabase/sync")
    .then(({ syncSingleConversationToSupabase }) =>
      syncSingleConversationToSupabase(conversation)
    )
    .catch(() => {});

  return conversation;
}

export function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Conversation | null {
  const all = getConversations();
  const conv = all.find((c) => c.id === conversationId);
  if (!conv) return null;

  const message: Message = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  conv.messages.push(message);
  conv.updatedAt = new Date().toISOString();

  // Update title from first user message if needed
  if (conv.messages.length === 1 && role === "user") {
    conv.title = content.slice(0, 60) + (content.length > 60 ? "..." : "");
  }

  saveConversations(all);

  // Async sync message + conversation update to Supabase
  import("./supabase/sync")
    .then(({ syncMessageToSupabase, syncSingleConversationToSupabase }) => {
      syncMessageToSupabase(conversationId, message).catch(() => {});
      syncSingleConversationToSupabase(conv).catch(() => {});
    })
    .catch(() => {});

  return conv;
}

export function getConversation(id: string): Conversation | null {
  const all = getConversations();
  return all.find((c) => c.id === id) || null;
}

export function deleteConversation(id: string) {
  const all = getConversations();
  const filtered = all.filter((c) => c.id !== id);
  saveConversations(filtered);

  // Async delete from Supabase
  import("./supabase/sync")
    .then(({ deleteConversationFromSupabase }) =>
      deleteConversationFromSupabase(id)
    )
    .catch(() => {});
}

export function getConversationsGroupedByDate(): Record<string, Conversation[]> {
  const all = getConversations();
  const groups: Record<string, Conversation[]> = {};

  for (const conv of all) {
    const date = new Date(conv.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Dnes";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Včera";
    } else {
      key = date.toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(conv);
  }

  return groups;
}
