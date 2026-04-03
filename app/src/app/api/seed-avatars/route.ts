import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_AVATARS } from "@/lib/seed-avatars";

const SOUL_BUCKET = "souls";

/**
 * POST /api/seed-avatars
 *
 * Creates 12 seed avatars and publishes them to the public library.
 * Idempotent: skips avatars whose slug already exists for this user.
 * Must be called by an authenticated user (admin).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{ name: string; status: "created" | "skipped" | "error"; id?: string; error?: string }> = [];

  for (const seed of SEED_AVATARS) {
    // Idempotent check — skip if this slug already exists for this user
    const { data: existing } = await supabase
      .from("avatars")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", seed.slug)
      .maybeSingle();

    if (existing) {
      results.push({ name: seed.name, status: "skipped", id: existing.id });
      continue;
    }

    // Create the avatar
    const { data: avatar, error: createError } = await supabase
      .from("avatars")
      .insert({
        user_id: user.id,
        name: seed.name,
        slug: seed.slug,
        appearance: seed.appearance,
        xp: seed.xp,
        level: seed.level,
        mood: 80,
        is_active: false,
        is_public: true,
        public_description: seed.bio,
        tags: seed.tags,
        featured: true,
        moderation_status: "approved",
      })
      .select()
      .single();

    if (createError || !avatar) {
      results.push({
        name: seed.name,
        status: "error",
        error: createError?.message ?? "Insert failed",
      });
      continue;
    }

    const avatarId = avatar.id as string;

    // Create soul files (osobnost, zaujmy, humor) for this avatar
    const soulEntries: Array<{
      slug: string;
      displayName: string;
      category: string;
      content: string;
    }> = [
      { slug: "osobnost", displayName: "Osobnosť", category: "jadro", content: seed.soul.osobnost },
      { slug: "zaujmy", displayName: "Záujmy", category: "zaujmy", content: seed.soul.zaujmy },
      { slug: "humor", displayName: "Humor", category: "jadro", content: seed.soul.humor },
    ];

    for (const sf of soulEntries) {
      // Upload content to storage
      const storagePath = `${user.id}/${avatarId}/${sf.slug}.md`;
      await supabase.storage
        .from(SOUL_BUCKET)
        .upload(storagePath, new Blob([sf.content], { type: "text/markdown" }), {
          upsert: true,
        });

      // Insert metadata row
      await supabase.from("soul_files").insert({
        user_id: user.id,
        avatar_id: avatarId,
        slug: sf.slug,
        display_name: sf.displayName,
        category: sf.category,
        updated_by: "dzino",
        is_public: true,
        public_content: sf.content,
      });
    }

    results.push({ name: seed.name, status: "created", id: avatarId });
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    summary: { created, skipped, errors, total: SEED_AVATARS.length },
    results,
  });
}
