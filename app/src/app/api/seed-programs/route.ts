import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_PROGRAMS } from "@/lib/seed-programs";

/** POST /api/seed-programs — One-time seed of official 30-day programs */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  for (const program of SEED_PROGRAMS) {
    const { data: existing } = await supabase
      .from("programs")
      .select("id")
      .eq("title", program.title)
      .eq("is_official", true)
      .single();
    if (existing) continue;

    const { error } = await supabase.from("programs").insert({
      title: program.title,
      description: program.description,
      category: program.category,
      days: program.days,
      total_days: 30,
      creator_id: user.id,
      is_official: true,
      is_public: true,
    });
    if (!error) created++;
  }

  return NextResponse.json({ created, total: SEED_PROGRAMS.length });
}
