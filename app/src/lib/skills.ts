"use client";

/**
 * Skill plugin system for Soulis.
 *
 * A skill = a system prompt fragment that adds a capability to the Souli.
 * Users can install skills from the marketplace (Pixoci) and toggle them on/off.
 * At chat time, enabled skill prompts are injected into the LLM context.
 */

import { createClient } from "./supabase/client";

export interface Skill {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  system_prompt: string;
  usage_count: number;
  is_public: boolean;
  tags: string[];
  category: string;
  version: string;
  created_at: string;
}

export interface InstalledSkill {
  id: string;
  skill_id: string;
  enabled: boolean;
  installed_at: string;
  skill: Skill;
}

// ---- Read ----

export async function getInstalledSkills(): Promise<InstalledSkill[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_skills")
    .select("id, skill_id, enabled, installed_at, skills(*)")
    .eq("user_id", user.id)
    .order("installed_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    skill_id: row.skill_id,
    enabled: row.enabled,
    installed_at: row.installed_at,
    skill: row.skills as unknown as Skill,
  }));
}

export async function getEnabledSkillPrompts(): Promise<string[]> {
  const skills = await getInstalledSkills();
  return skills
    .filter((s) => s.enabled)
    .map((s) => s.skill.system_prompt);
}

export async function getPublicSkills(options?: {
  category?: string;
  search?: string;
}): Promise<Skill[]> {
  const supabase = createClient();
  let query = supabase
    .from("skills")
    .select("*")
    .eq("is_public", true)
    .order("usage_count", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,description.ilike.%${options.search}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as Skill[];
}

// ---- Install / Uninstall ----

export async function installSkill(skillId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_skills")
    .insert({ user_id: user.id, skill_id: skillId });

  if (error) return false;

  // Increment usage count (best-effort, ignore errors)
  try {
    await supabase
      .from("skills")
      .update({ usage_count: (await supabase.from("skills").select("usage_count").eq("id", skillId).single()).data?.usage_count + 1 || 1 })
      .eq("id", skillId);
  } catch { /* non-critical */ }

  return true;
}

export async function uninstallSkill(userSkillId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_skills")
    .delete()
    .eq("id", userSkillId);
  return !error;
}

export async function toggleSkill(
  userSkillId: string,
  enabled: boolean,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_skills")
    .update({ enabled })
    .eq("id", userSkillId);
  return !error;
}

// ---- Create / Publish ----

export async function createSkill(skill: {
  name: string;
  description: string;
  system_prompt: string;
  tags?: string[];
  category?: string;
  is_public?: boolean;
}): Promise<Skill | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("skills")
    .insert({
      creator_id: user.id,
      name: skill.name,
      description: skill.description,
      system_prompt: skill.system_prompt,
      tags: skill.tags ?? [],
      category: skill.category ?? "general",
      is_public: skill.is_public ?? false,
    })
    .select()
    .single();

  if (error) return null;
  return data as Skill;
}
