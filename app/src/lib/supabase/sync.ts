/**
 * Supabase <-> localStorage sync layer.
 *
 * - loadFromSupabase(): called after login, populates localStorage from Supabase
 * - Individual sync*ToSupabase() helpers: called on every write (non-blocking)
 * - All Supabase calls are fire-and-forget (don't block UI)
 */

import { createClient } from "./client";
import type { Conversation, Message } from "../conversations";
import type { GamificationData } from "../gamification";
import type { DzinoEvent } from "../events";
import type { AvatarData } from "../avatar";
import type { MoodEntry } from "../mood-tracking";

// ---------- Helpers ----------

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

async function getUserId(): Promise<string | null> {
  if (!isConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ---------- Conversations ----------

export async function syncConversationsToSupabase(
  conversations: Conversation[]
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  for (const conv of conversations) {
    // Upsert conversation row
    await supabase.from("conversations").upsert(
      {
        id: conv.id,
        user_id: userId,
        title: conv.title,
        created_at: conv.createdAt,
        updated_at: conv.updatedAt,
      },
      { onConflict: "id" }
    );

    // Upsert messages — to avoid duplicates, we use a deterministic approach:
    // delete existing messages and re-insert (simple and reliable for sync)
    // Only do this for conversations with messages
    if (conv.messages.length > 0) {
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conv.id);

      const messageRows = conv.messages.map((m) => ({
        conversation_id: conv.id,
        role: m.role,
        content: m.content,
        created_at: m.timestamp,
      }));

      await supabase.from("messages").insert(messageRows);
    }
  }
}

export async function syncSingleConversationToSupabase(
  conv: Conversation
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  await supabase.from("conversations").upsert(
    {
      id: conv.id,
      user_id: userId,
      title: conv.title,
      created_at: conv.createdAt,
      updated_at: conv.updatedAt,
    },
    { onConflict: "id" }
  );
}

export async function syncMessageToSupabase(
  conversationId: string,
  message: Message
): Promise<void> {
  if (!isConfigured()) return;
  const supabase = createClient();

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    created_at: message.timestamp,
  });
}

export async function deleteConversationFromSupabase(
  conversationId: string
): Promise<void> {
  if (!isConfigured()) return;
  const supabase = createClient();

  // Messages cascade delete via FK
  await supabase.from("conversations").delete().eq("id", conversationId);
}

export async function loadConversationsFromSupabase(): Promise<
  Conversation[] | null
> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();

  const { data: convRows } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (!convRows || convRows.length === 0) return null;

  const conversations: Conversation[] = [];

  for (const c of convRows) {
    const { data: msgRows } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", c.id)
      .order("created_at");

    const messages: Message[] = (msgRows ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
      timestamp: m.created_at as string,
    }));

    conversations.push({
      id: c.id,
      title: c.title ?? "",
      messages,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    });
  }

  return conversations;
}

// ---------- Events ----------

export async function syncEventsToSupabase(
  events: DzinoEvent[]
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  for (const evt of events) {
    await supabase.from("events").upsert(
      {
        id: evt.id,
        user_id: userId,
        title: evt.title,
        description: evt.description || null,
        event_date: evt.date,
        event_time: evt.time || null,
        type: evt.type,
        status: evt.status,
        remind_before: evt.remindBefore || null,
        created_by: evt.createdBy,
        created_at: evt.createdAt,
      },
      { onConflict: "id" }
    );
  }
}

export async function syncSingleEventToSupabase(
  evt: DzinoEvent
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  await supabase.from("events").upsert(
    {
      id: evt.id,
      user_id: userId,
      title: evt.title,
      description: evt.description || null,
      event_date: evt.date,
      event_time: evt.time || null,
      type: evt.type,
      status: evt.status,
      remind_before: evt.remindBefore || null,
      created_by: evt.createdBy,
      created_at: evt.createdAt,
    },
    { onConflict: "id" }
  );
}

export async function deleteEventFromSupabase(eventId: string): Promise<void> {
  if (!isConfigured()) return;
  const supabase = createClient();
  await supabase.from("events").delete().eq("id", eventId);
}

export async function loadEventsFromSupabase(): Promise<DzinoEvent[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: false });

  if (!data || data.length === 0) return null;

  return data.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? "",
    date: e.event_date,
    time: e.event_time ?? undefined,
    type: e.type as "diary" | "plan",
    status: e.status as "upcoming" | "done" | "missed",
    remindBefore: e.remind_before ?? undefined,
    createdAt: e.created_at,
    createdBy: (e.created_by ?? "user") as "user" | "dzino",
  }));
}

// ---------- Gamification (stored in avatars table) ----------

export async function syncGamificationToSupabase(
  data: GamificationData
): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  // Update the active avatar row with gamification data
  await supabase
    .from("avatars")
    .update({
      xp: data.xp,
      level: data.level,
      streak: data.streak,
      longest_streak: data.longestStreak,
      last_active_date: data.lastActiveDate || null,
      achievements: data.achievements,
      daily_xp_earned: data.dailyXpEarned,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_active", true);
}

export async function loadGamificationFromSupabase(): Promise<GamificationData | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();

  const { data } = await supabase
    .from("avatars")
    .select(
      "xp, level, streak, longest_streak, last_active_date, achievements, daily_xp_earned"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!data) return null;

  return {
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    streak: data.streak ?? 0,
    longestStreak: data.longest_streak ?? 0,
    lastActiveDate: data.last_active_date ?? "",
    achievements: data.achievements ?? [],
    dailyXpEarned: data.daily_xp_earned ?? 0,
  };
}

// ---------- Avatar ----------

export async function syncAvatarToSupabase(data: AvatarData): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  await supabase
    .from("avatars")
    .update({
      name: data.name,
      appearance: data.appearance,
      mood: data.mood,
      last_interaction: data.lastInteraction,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_active", true);
}

export async function loadAvatarFromSupabase(): Promise<AvatarData | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();

  const { data } = await supabase
    .from("avatars")
    .select("name, appearance, mood, last_interaction")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!data || !data.appearance) return null;

  return {
    state: "idle",
    mood: data.mood ?? 70,
    lastInteraction: data.last_interaction ?? new Date().toISOString(),
    color: (data.appearance as AvatarData["appearance"]).bodyColor ?? "#4F46E5",
    name: data.name ?? "Dzino",
    appearance: data.appearance as AvatarData["appearance"],
  };
}

// ---------- Mood (stored in events table as type "mood") ----------

export async function syncMoodToSupabase(entries: MoodEntry[]): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const supabase = createClient();

  for (const entry of entries) {
    // Use a deterministic ID based on date so we can upsert
    const moodTitle = `mood:${entry.mood}`;
    const description = entry.note ?? "";

    // Check if there's already a mood event for this date
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "diary")
      .eq("event_date", entry.date)
      .like("title", "mood:%")
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing
      await supabase
        .from("events")
        .update({
          title: moodTitle,
          description,
        })
        .eq("id", existing[0].id);
    } else {
      // Insert new
      await supabase.from("events").insert({
        user_id: userId,
        title: moodTitle,
        description,
        event_date: entry.date,
        type: "diary",
        status: "done",
        created_by: "user",
      });
    }
  }
}

export async function loadMoodFromSupabase(): Promise<MoodEntry[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();

  const { data } = await supabase
    .from("events")
    .select("title, description, event_date")
    .eq("user_id", userId)
    .eq("type", "diary")
    .like("title", "mood:%")
    .order("event_date", { ascending: true });

  if (!data || data.length === 0) return null;

  return data
    .map((e) => {
      const moodVal = parseInt(e.title.replace("mood:", ""), 10);
      if (isNaN(moodVal) || moodVal < 1 || moodVal > 5) return null;
      return {
        date: e.event_date,
        mood: moodVal as 1 | 2 | 3 | 4 | 5,
        note: e.description || undefined,
      };
    })
    .filter(Boolean) as MoodEntry[];
}

// ---------- Full sync orchestrators ----------

/**
 * Load all data from Supabase into localStorage.
 * Called after login — Supabase is source of truth.
 */
export async function loadFromSupabase(): Promise<void> {
  if (!isConfigured()) return;

  try {
    // Load conversations
    const conversations = await loadConversationsFromSupabase();
    if (conversations && conversations.length > 0) {
      localStorage.setItem(
        "dzino_conversations",
        JSON.stringify(conversations)
      );
    }

    // Load events
    const events = await loadEventsFromSupabase();
    if (events && events.length > 0) {
      // Filter out mood pseudo-events from the events list
      const realEvents = events.filter((e) => !e.title.startsWith("mood:"));
      localStorage.setItem("dzino_events", JSON.stringify(realEvents));
    }

    // Load gamification from active avatar
    const gamification = await loadGamificationFromSupabase();
    if (gamification) {
      localStorage.setItem(
        "dzino_gamification",
        JSON.stringify(gamification)
      );
    }

    // Load avatar from active avatar
    const avatar = await loadAvatarFromSupabase();
    if (avatar) {
      localStorage.setItem("dzino_avatar", JSON.stringify(avatar));
    }

    // Load mood history
    const mood = await loadMoodFromSupabase();
    if (mood && mood.length > 0) {
      localStorage.setItem("dzino_mood_history", JSON.stringify(mood));
    }

    // Soul files are already handled by soul.ts loadSoulFiles()
  } catch (err) {
    console.warn("[sync] loadFromSupabase failed, using localStorage:", err);
  }
}

/**
 * Push all localStorage data to Supabase.
 * Called after signup (initial data push) or for full sync.
 */
export async function syncToSupabase(): Promise<void> {
  if (!isConfigured()) return;

  try {
    // Sync conversations
    const convRaw = localStorage.getItem("dzino_conversations");
    if (convRaw) {
      const conversations: Conversation[] = JSON.parse(convRaw);
      await syncConversationsToSupabase(conversations);
    }

    // Sync events
    const evtRaw = localStorage.getItem("dzino_events");
    if (evtRaw) {
      const events: DzinoEvent[] = JSON.parse(evtRaw);
      await syncEventsToSupabase(events);
    }

    // Sync gamification
    const gamRaw = localStorage.getItem("dzino_gamification");
    if (gamRaw) {
      const data: GamificationData = JSON.parse(gamRaw);
      await syncGamificationToSupabase(data);
    }

    // Sync avatar
    const avRaw = localStorage.getItem("dzino_avatar");
    if (avRaw) {
      const data: AvatarData = JSON.parse(avRaw);
      await syncAvatarToSupabase(data);
    }

    // Sync mood
    const moodRaw = localStorage.getItem("dzino_mood_history");
    if (moodRaw) {
      const entries: MoodEntry[] = JSON.parse(moodRaw);
      await syncMoodToSupabase(entries);
    }
  } catch (err) {
    console.warn("[sync] syncToSupabase failed:", err);
  }
}
