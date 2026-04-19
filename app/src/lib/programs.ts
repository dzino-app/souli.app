"use client";

import { createClient } from "./supabase/client";

export interface ProgramDay {
  day: number;
  prompt: string;
  focus: string;
}

export interface Program {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  locale: string | null;
  days: ProgramDay[];
  total_days: number;
  creator_id: string | null;
  is_official: boolean;
  is_public: boolean;
  created_at: string;
}

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  current_day: number;
  completed_days: number[];
  started_at: string;
  last_activity_at: string;
  finished_at: string | null;
  program?: Program;
}

// ---- Read ----

export async function getOfficialPrograms(): Promise<Program[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("is_official", true)
    .eq("is_public", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as Program[];
}

export async function getMyPrograms(): Promise<UserProgram[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_programs")
    .select("id, user_id, program_id, current_day, completed_days, started_at, last_activity_at, finished_at, programs(*)")
    .eq("user_id", user.id)
    .order("last_activity_at", { ascending: false });

  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    program_id: row.program_id,
    current_day: row.current_day,
    completed_days: row.completed_days as number[],
    started_at: row.started_at,
    last_activity_at: row.last_activity_at,
    finished_at: row.finished_at,
    program: row.programs as unknown as Program,
  }));
}

// ---- Enroll / progress ----

export async function enrollInProgram(programId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("user_programs")
    .insert({ user_id: user.id, program_id: programId });
  return !error;
}

export async function completeDay(
  userProgramId: string,
  day: number,
): Promise<boolean> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("user_programs")
    .select("completed_days, current_day, program_id")
    .eq("id", userProgramId)
    .single();

  if (!existing) return false;
  const completed = new Set<number>(existing.completed_days || []);
  completed.add(day);

  // Fetch program to know total days
  const { data: program } = await supabase
    .from("programs")
    .select("total_days")
    .eq("id", existing.program_id)
    .single();
  const total = program?.total_days ?? 30;

  const nextDay = Math.min(day + 1, total);
  const finished = completed.size >= total;

  const { error } = await supabase
    .from("user_programs")
    .update({
      completed_days: Array.from(completed).sort((a, b) => a - b),
      current_day: nextDay,
      last_activity_at: new Date().toISOString(),
      finished_at: finished ? new Date().toISOString() : null,
    })
    .eq("id", userProgramId);
  return !error;
}

export async function leaveProgram(userProgramId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_programs")
    .delete()
    .eq("id", userProgramId);
  return !error;
}

// ---- Custom program creation ----

export async function generateCustomProgram(
  topic: string,
  locale: string,
): Promise<Program | null> {
  const res = await fetch("/api/programs/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, locale }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.program ?? null;
}
