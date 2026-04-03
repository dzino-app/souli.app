import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishAvatar } from "@/lib/supabase/avatars-db";

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/avatars/[id]/publish — Publish / unpublish avatar to library */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

  const body = await request.json();
  const { isPublic, description, tags, publicSoulSlugs } = body;

  if (typeof isPublic !== "boolean") {
    return NextResponse.json(
      { error: "isPublic is required and must be boolean" },
      { status: 400 }
    );
  }

  await publishAvatar(id, { isPublic, description, tags, publicSoulSlugs });

  return NextResponse.json({ ok: true });
}
