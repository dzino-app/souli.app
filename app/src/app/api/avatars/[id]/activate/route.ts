import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateAvatar } from "@/lib/supabase/avatars-db";

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/avatars/[id]/activate — Set as active avatar */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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

  await activateAvatar(user.id, id);

  return NextResponse.json({ ok: true });
}
