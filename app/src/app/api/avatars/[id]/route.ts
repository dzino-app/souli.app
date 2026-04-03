import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateAvatar, deleteAvatar } from "@/lib/supabase/avatars-db";

type RouteParams = { params: Promise<{ id: string }> };

/** PATCH /api/avatars/[id] — Update an avatar */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const { data: existing } = await supabase
    .from("avatars")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  const allowed = [
    "name", "slug", "appearance", "xp", "level", "streak",
    "longest_streak", "achievements", "mood", "daily_xp_earned",
    "last_active_date", "last_interaction",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  await updateAvatar(id, updates);

  return NextResponse.json({ ok: true });
}

/** DELETE /api/avatars/[id] — Delete an avatar */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const { data: existing } = await supabase
    .from("avatars")
    .select("id, is_active")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  if (existing.is_active) {
    return NextResponse.json(
      { error: "Cannot delete active avatar. Switch to another first." },
      { status: 400 }
    );
  }

  await deleteAvatar(id);

  return NextResponse.json({ ok: true });
}
