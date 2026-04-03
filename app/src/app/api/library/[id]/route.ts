import { NextRequest, NextResponse } from "next/server";
import { getPublicAvatarDetail } from "@/lib/supabase/avatars-db";

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/library/[id] — Get public avatar detail (no auth required) */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const { avatar, soulFiles } = await getPublicAvatarDetail(id);

  if (!avatar) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  return NextResponse.json({ avatar, soulFiles });
}
