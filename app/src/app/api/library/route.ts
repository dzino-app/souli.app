import { NextRequest, NextResponse } from "next/server";
import { getPublicAvatars } from "@/lib/supabase/avatars-db";
import type { PublicAvatarFilters } from "@/lib/supabase/avatars-db";

/** GET /api/library — Browse public avatar library (no auth required) */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: PublicAvatarFilters = {};

  const species = searchParams.get("species");
  if (species) filters.species = species;

  const sort = searchParams.get("sort");
  if (sort === "popular" || sort === "recent") filters.sort = sort;

  const search = searchParams.get("search");
  if (search) filters.search = search;

  const soulType = searchParams.get("soulType");
  if (soulType) filters.soulType = soulType;

  const avatarType = searchParams.get("type");
  if (avatarType) filters.avatarType = avatarType;

  const page = searchParams.get("page");
  if (page) filters.page = parseInt(page, 10) || 0;

  const { avatars, total } = await getPublicAvatars(filters);

  return NextResponse.json({ avatars, total });
}
