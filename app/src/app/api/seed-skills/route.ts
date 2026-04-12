import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SEED_SKILLS } from "@/lib/seed-skills";

/** POST /api/seed-skills — One-time seed of official skills */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  for (const skill of SEED_SKILLS) {
    // Skip if skill with this name already exists
    const { data: existing } = await supabase
      .from("skills")
      .select("id")
      .eq("name", skill.name)
      .single();

    if (existing) continue;

    const { error } = await supabase.from("skills").insert({
      creator_id: user.id,
      name: skill.name,
      description: skill.description,
      system_prompt: skill.system_prompt,
      tags: skill.tags,
      category: skill.category,
      is_public: true,
    });

    if (!error) created++;
  }

  return NextResponse.json({ created, total: SEED_SKILLS.length });
}
