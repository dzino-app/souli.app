import { createClient } from "./client";
import type { AvatarAppearance } from "../avatar";

// ---------- Types ----------

export interface AvatarRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  appearance: AvatarAppearance;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  last_active_date: string | null;
  achievements: string[];
  daily_xp_earned: number;
  mood: number;
  last_interaction: string | null;
  is_public: boolean;
  public_description: string | null;
  tags: string[];
  times_loaded: number;
  featured: boolean;
  moderation_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Unique 8-bit sound parameters */
  sound_dna: Record<string, unknown> | null;
  /** Pre-rendered static preview image URL (Supabase Storage) */
  preview_url: string | null;
  /** Pre-rendered animation frame URLs per activity (Supabase Storage) */
  animation_urls: Record<string, string[]> | null;
  /** How the avatar's visuals were generated */
  avatar_type: "pixel" | "imagen" | "veo";
  /** AI-generated portrait image URL (Imagen) */
  portrait_url: string | null;
  /** AI-generated video clip URL (Veo) */
  video_url: string | null;
}

export interface PublicAvatarFilters {
  species?: string;
  soulType?: string; // filter by avatars that have a specific public soul file slug
  avatarType?: string; // pixel | imagen | veo
  sort?: "popular" | "recent";
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---------- CRUD ----------

export async function createAvatar(
  userId: string,
  name: string,
  slug: string,
  appearance: AvatarAppearance,
  extra?: Partial<Pick<AvatarRow, "xp" | "level" | "streak" | "longest_streak" | "achievements" | "mood" | "is_active">>
): Promise<AvatarRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("avatars")
    .insert({
      user_id: userId,
      name,
      slug,
      appearance,
      ...extra,
    })
    .select()
    .single();

  if (error) {
    console.error("createAvatar error:", error);
    return null;
  }
  return data as AvatarRow;
}

export async function getUserAvatars(userId: string): Promise<AvatarRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getUserAvatars error:", error);
    return [];
  }
  return (data ?? []) as AvatarRow[];
}

export async function getActiveAvatar(userId: string): Promise<AvatarRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as AvatarRow;
}

export async function activateAvatar(userId: string, avatarId: string): Promise<void> {
  const supabase = createClient();

  // Deactivate all avatars for the user
  await supabase
    .from("avatars")
    .update({ is_active: false })
    .eq("user_id", userId);

  // Activate the chosen one
  await supabase
    .from("avatars")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", avatarId)
    .eq("user_id", userId);
}

export async function updateAvatar(
  avatarId: string,
  updates: Partial<Pick<AvatarRow, "name" | "slug" | "appearance" | "xp" | "level" | "streak" | "longest_streak" | "achievements" | "mood" | "daily_xp_earned" | "last_active_date" | "last_interaction">>
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("avatars")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", avatarId);
}

export async function deleteAvatar(avatarId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("avatars")
    .delete()
    .eq("id", avatarId);
}

// ---------- Public Library ----------

export async function getPublicAvatars(
  filters: PublicAvatarFilters = {}
): Promise<{ avatars: AvatarRow[]; total: number }> {
  const supabase = createClient();
  const pageSize = filters.pageSize ?? 20;
  const page = filters.page ?? 0;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Try hybrid search (semantic + keyword) when search query exists
  if (filters.search && filters.search.trim().length > 2) {
    try {
      const result = await hybridSearch(supabase, filters, from, to);
      if (result) return result;
    } catch {
      // Fall through to standard search
    }
  }

  // If filtering by soul type, use a subquery approach
  if (filters.soulType) {
    return getAvatarsBySoulType(supabase, filters);
  }

  // Standard search (keyword only)
  let query = supabase
    .from("avatars")
    .select("*", { count: "exact" })
    .eq("is_public", true)
    .eq("moderation_status", "approved");

  if (filters.species) {
    query = query.eq("appearance->>species", filters.species);
  }

  if (filters.avatarType) {
    query = query.eq("avatar_type", filters.avatarType);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,public_description.ilike.%${filters.search}%`
    );
  }

  if (filters.sort === "popular") {
    query = query.order("times_loaded", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("getPublicAvatars error:", error);
    return { avatars: [], total: 0 };
  }

  return { avatars: (data ?? []) as AvatarRow[], total: count ?? 0 };
}

/**
 * Hybrid search: combine keyword (full-text) + dense (vector) results.
 * Falls back to null if embeddings aren't available.
 */
async function hybridSearch(
  supabase: ReturnType<typeof createClient>,
  filters: PublicAvatarFilters,
  from: number,
  to: number,
): Promise<{ avatars: AvatarRow[]; total: number } | null> {
  const { getEmbedding } = await import("../embeddings");
  const queryEmbedding = await getEmbedding(filters.search!);

  // RPC call for hybrid search — keyword + vector combined
  const { data, error } = await supabase.rpc("hybrid_search_avatars", {
    query_text: filters.search!,
    query_embedding: JSON.stringify(queryEmbedding),
    species_filter: filters.species || null,
    match_limit: to - from + 1,
    match_offset: from,
  });

  if (error || !data) return null;

  return {
    avatars: data as AvatarRow[],
    total: data.length,
  };
}

async function getAvatarsBySoulType(
  supabase: ReturnType<typeof createClient>,
  filters: PublicAvatarFilters,
): Promise<{ avatars: AvatarRow[]; total: number }> {
  const pageSize = filters.pageSize ?? 20;
  const page = filters.page ?? 0;
  const from = page * pageSize;

  // Find avatar IDs that have this public soul file
  const { data: soulRows } = await supabase
    .from("soul_files")
    .select("avatar_id")
    .eq("slug", filters.soulType!)
    .eq("is_public", true);

  const ids = (soulRows ?? []).map((r: { avatar_id: string }) => r.avatar_id);
  const avatarIds = Array.from(new Set(ids));
  if (avatarIds.length === 0) return { avatars: [], total: 0 };

  let query = supabase
    .from("avatars")
    .select("*", { count: "exact" })
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .in("id", avatarIds);

  if (filters.species) {
    query = query.eq("appearance->>species", filters.species);
  }

  if (filters.sort === "popular") {
    query = query.order("times_loaded", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, from + pageSize - 1);

  const { data, count } = await query;
  return { avatars: (data ?? []) as AvatarRow[], total: count ?? 0 };
}

export async function getPublicAvatarDetail(
  avatarId: string
): Promise<{ avatar: AvatarRow | null; soulFiles: Array<{ slug: string; display_name: string; category: string; content?: string }> }> {
  const supabase = createClient();

  const { data: avatar, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", avatarId)
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .single();

  if (error || !avatar) {
    return { avatar: null, soulFiles: [] };
  }

  // Get public soul files with content
  const { data: soulFiles } = await supabase
    .from("soul_files")
    .select("slug, display_name, category, content, public_content, user_id")
    .eq("avatar_id", avatarId)
    .eq("is_public", true);

  const mapped: Array<{ slug: string; display_name: string; category: string; content?: string }> = [];
  for (const sf of soulFiles ?? []) {
    // Prefer public_content, then content column, then fetch from storage
    let content = (sf.public_content as string | null) || (sf.content as string | null) || undefined;
    if (!content) {
      const storagePath = `${sf.user_id}/${avatarId}/${sf.slug}.md`;
      const { data: fileData } = await supabase.storage
        .from("souls")
        .download(storagePath);
      if (fileData) {
        content = await fileData.text();
      }
    }
    mapped.push({
      slug: sf.slug as string,
      display_name: sf.display_name as string,
      category: sf.category as string,
      content,
    });
  }

  return {
    avatar: avatar as AvatarRow,
    soulFiles: mapped,
  };
}

export async function loadPublicAvatar(
  sourceAvatarId: string,
  userId: string
): Promise<AvatarRow | null> {
  const supabase = createClient();

  // Get the source avatar
  const { data: source } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", sourceAvatarId)
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .single();

  if (!source) return null;
  const src = source as AvatarRow;

  // Create a new avatar for the user based on source
  const slug = `${src.slug}-${Date.now().toString(36)}`;
  const newAvatar = await createAvatar(userId, src.name, slug, src.appearance);
  if (!newAvatar) return null;

  // Record the load
  await supabase.from("avatar_loads").insert({
    source_avatar_id: sourceAvatarId,
    loaded_by: userId,
    created_avatar_id: newAvatar.id,
  });

  // Increment times_loaded counter
  await supabase
    .from("avatars")
    .update({ times_loaded: src.times_loaded + 1 })
    .eq("id", sourceAvatarId);

  // Copy public soul files from source
  const { data: sourceSoulFiles } = await supabase
    .from("soul_files")
    .select("*")
    .eq("avatar_id", sourceAvatarId)
    .eq("is_public", true);

  if (sourceSoulFiles) {
    for (const sf of sourceSoulFiles) {
      await supabase.from("soul_files").insert({
        user_id: userId,
        avatar_id: newAvatar.id,
        slug: sf.slug,
        display_name: sf.display_name,
        category: sf.category,
        updated_by: "user",
      });

      // Copy the soul file content from storage
      const sourcePath = `${src.user_id}/${sf.slug}.md`;
      const destPath = `${userId}/${sf.slug}.md`;

      const { data: fileData } = await supabase.storage
        .from("souls")
        .download(sourcePath);

      if (fileData) {
        await supabase.storage
          .from("souls")
          .upload(destPath, fileData, { upsert: true });
      }
    }
  }

  return newAvatar;
}

export async function reportAvatar(
  avatarId: string,
  reporterId: string,
  reason: string,
  details?: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("avatar_reports").insert({
    avatar_id: avatarId,
    reporter_id: reporterId,
    reason,
    details,
  });

  if (error) {
    console.error("reportAvatar error:", error);
    return false;
  }
  return true;
}

export async function publishAvatar(
  avatarId: string,
  opts: {
    isPublic: boolean;
    description?: string;
    tags?: string[];
    publicSoulSlugs?: string[];
    publicSoulContents?: Record<string, string>;
  }
): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("avatars")
    .update({
      is_public: opts.isPublic,
      public_description: opts.description ?? null,
      tags: opts.tags ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", avatarId);

  // Update soul files public visibility
  if (opts.publicSoulSlugs !== undefined) {
    // First set all soul files to non-public
    await supabase
      .from("soul_files")
      .update({ is_public: false })
      .eq("avatar_id", avatarId);

    // Then set selected ones to public
    if (opts.publicSoulSlugs.length > 0) {
      await supabase
        .from("soul_files")
        .update({ is_public: true })
        .eq("avatar_id", avatarId)
        .in("slug", opts.publicSoulSlugs);
    }
  }

  // Store edited public soul contents separately
  if (opts.publicSoulContents) {
    for (const [slug, content] of Object.entries(opts.publicSoulContents)) {
      await supabase
        .from("soul_files")
        .update({ public_content: content })
        .eq("avatar_id", avatarId)
        .eq("slug", slug);
    }
  }

  // Generate and store embedding for hybrid search (async, non-blocking)
  if (opts.isPublic) {
    generateAvatarEmbedding(avatarId, supabase).catch(() => {});
  }
}

async function generateAvatarEmbedding(
  avatarId: string,
  supabase: ReturnType<typeof createClient>,
) {
  try {
    const { data: avatar } = await supabase
      .from("avatars")
      .select("name, public_description, tags")
      .eq("id", avatarId)
      .single();

    const { data: soulFiles } = await supabase
      .from("soul_files")
      .select("slug, content, public_content")
      .eq("avatar_id", avatarId)
      .eq("is_public", true);

    if (!avatar) return;

    const { buildEmbeddingText, getEmbedding } = await import("../embeddings");

    const text = buildEmbeddingText(
      avatar.name,
      avatar.public_description,
      avatar.tags ?? [],
      (soulFiles ?? []).map((f) => ({
        slug: f.slug,
        content: f.public_content || f.content || "",
      })),
    );

    const embedding = await getEmbedding(text);

    await supabase
      .from("avatars")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", avatarId);
  } catch (err) {
    console.warn("[embedding] Failed to generate embedding:", err);
  }
}
