import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAvatar, activateAvatar, getActiveAvatar } from "@/lib/supabase/avatars-db";

/** POST /api/avatars/migrate — One-time migration from single avatar to multi-avatar */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already migrated (user has an active avatar)
  const existing = await getActiveAvatar(user.id);
  if (existing) {
    return NextResponse.json({ avatarId: existing.id, alreadyMigrated: true });
  }

  const body = await request.json();
  const { avatar: avatarData, gamification } = body;

  if (!avatarData?.appearance) {
    return NextResponse.json(
      { error: "Missing avatar data" },
      { status: 400 }
    );
  }

  // Create avatar row from existing localStorage data
  const name = avatarData.name || "Dzino";
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

  const avatar = await createAvatar(user.id, name, slug, avatarData.appearance, {
    xp: gamification?.xp ?? 0,
    level: gamification?.level ?? 1,
    streak: gamification?.streak ?? 0,
    longest_streak: gamification?.longestStreak ?? 0,
    achievements: gamification?.achievements ?? [],
    mood: avatarData.mood ?? 70,
    is_active: true,
  });

  if (!avatar) {
    return NextResponse.json({ error: "Failed to create avatar" }, { status: 500 });
  }

  // Activate it
  await activateAvatar(user.id, avatar.id);

  // Backfill avatar_id on existing soul_files for this user
  await supabase
    .from("soul_files")
    .update({ avatar_id: avatar.id })
    .eq("user_id", user.id)
    .is("avatar_id", null);

  return NextResponse.json({ avatarId: avatar.id, alreadyMigrated: false });
}
