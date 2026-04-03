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
}

export interface PublicAvatarFilters {
  species?: string;
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

  let query = supabase
    .from("avatars")
    .select("*", { count: "exact" })
    .eq("is_public", true)
    .eq("moderation_status", "approved");

  if (filters.species) {
    query = query.eq("appearance->>species", filters.species);
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

  // Get public soul files for this avatar — include public_content
  const { data: soulFiles } = await supabase
    .from("soul_files")
    .select("slug, display_name, category, public_content")
    .eq("avatar_id", avatarId)
    .eq("is_public", true);

  const mapped = (soulFiles ?? []).map((sf) => ({
    slug: sf.slug as string,
    display_name: sf.display_name as string,
    category: sf.category as string,
    content: (sf.public_content as string | null) ?? undefined,
  }));

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
}
