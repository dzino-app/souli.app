import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAvatar,
  getUserAvatars,
  activateAvatar,
} from "@/lib/supabase/avatars-db";

/** GET /api/avatars — List user's avatars */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatars = await getUserAvatars(user.id);
  return NextResponse.json({ avatars });
}

/** POST /api/avatars — Create a new avatar */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, appearance, setActive } = body;

  if (!name || !slug || !appearance) {
    return NextResponse.json(
      { error: "Missing required fields: name, slug, appearance" },
      { status: 400 }
    );
  }

  const avatar = await createAvatar(user.id, name, slug, appearance);
  if (!avatar) {
    return NextResponse.json({ error: "Failed to create avatar" }, { status: 500 });
  }

  if (setActive) {
    await activateAvatar(user.id, avatar.id);
  }

  return NextResponse.json({ avatar }, { status: 201 });
}
