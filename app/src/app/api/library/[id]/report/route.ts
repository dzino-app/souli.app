import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reportAvatar } from "@/lib/supabase/avatars-db";

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/library/[id]/report — Report a public avatar */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { reason, details } = body;

  if (!reason || typeof reason !== "string") {
    return NextResponse.json(
      { error: "reason is required" },
      { status: 400 }
    );
  }

  const ok = await reportAvatar(id, user.id, reason, details);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to report or already reported" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
