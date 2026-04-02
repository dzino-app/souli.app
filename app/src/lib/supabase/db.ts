import { createClient } from "./client";
import type { Memory } from "../memory";
import type { Conversation, Message } from "../conversations";

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

// ---- MEMORIES ----

export async function fetchMemories(): Promise<Memory[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("memories")
    .select("id, fact, category, created_at")
    .order("created_at", { ascending: false });
  return (data || []).map((m) => ({
    id: m.id,
    fact: m.fact,
    category: m.category,
    createdAt: m.created_at,
  }));
}

export async function insertMemories(
  facts: { fact: string; category: string }[]
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("memories").insert(
    facts.map((f) => ({
      user_id: user.id,
      fact: f.fact,
      category: f.category,
    }))
  );
}

export async function removeMemory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("memories").delete().eq("id", id);
}

export async function patchMemory(id: string, fact: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("memories").update({ fact }).eq("id", id);
}

// ---- CONVERSATIONS ----

export async function fetchConversations(): Promise<Conversation[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });
  return (data || []).map((c) => ({
    id: c.id,
    title: c.title,
    messages: [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

export async function insertConversation(title: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, title })
    .select("id")
    .single();
  return data?.id || null;
}

export async function insertMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
}

export async function fetchMessages(
  conversationId: string
): Promise<Message[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at");
  return (data || []).map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.created_at,
  }));
}

export async function removeConversation(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from("conversations").delete().eq("id", id);
}
