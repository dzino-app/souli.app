import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadPublicAvatar } from "@/lib/supabase/avatars-db";

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/library/[id]/load — Copy a public avatar to user's collection */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const newAvatar = await loadPublicAvatar(id, user.id);
  if (!newAvatar) {
    return NextResponse.json({ error: "Failed to load avatar" }, { status: 500 });
  }

  return NextResponse.json({ avatar: newAvatar }, { status: 201 });
}
