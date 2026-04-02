import { createClient } from "./client";
import type { SoulFile } from "../soul";

const BUCKET = "souls";

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function getUserId(): Promise<string | null> {
  if (!isConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// Read a single soul file from storage
export async function readSoulFile(slug: string): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(`${userId}/${slug}.md`);

  if (error || !data) return null;
  return await data.text();
}

// Write a soul file to storage
export async function writeSoulFile(
  slug: string,
  content: string,
  updatedBy: "user" | "dzino"
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const supabase = createClient();
  const path = `${userId}/${slug}.md`;

  // Upload (upsert) the file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Blob([content], { type: "text/markdown" }), {
      upsert: true,
    });

  if (uploadError) return false;

  // Update metadata in DB
  await supabase.from("soul_files").upsert(
    {
      user_id: userId,
      slug,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slug" }
  );

  return true;
}

// Read all soul files for the current user
export async function readAllSoulFiles(): Promise<SoulFile[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = createClient();

  // Get metadata from DB
  const { data: meta } = await supabase
    .from("soul_files")
    .select("slug, display_name, category, updated_by, updated_at")
    .eq("user_id", userId)
    .order("created_at");

  if (!meta || meta.length === 0) return null;

  // Read each file from storage
  const files: SoulFile[] = [];
  for (const m of meta) {
    const content = await readSoulFile(m.slug);
    files.push({
      slug: m.slug,
      displayName: m.display_name,
      category: m.category,
      content: content || "",
      updatedAt: m.updated_at,
      updatedBy: m.updated_by,
    });
  }

  return files;
}

// Seed default soul files for a new user
export async function seedSoulFiles(defaults: SoulFile[]): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const supabase = createClient();

  // Check if already seeded
  const { count } = await supabase
    .from("soul_files")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) return false; // already seeded

  // Insert metadata + upload files
  for (const file of defaults) {
    // Upload content
    await supabase.storage
      .from(BUCKET)
      .upload(
        `${userId}/${file.slug}.md`,
        new Blob([file.content], { type: "text/markdown" }),
        { upsert: true }
      );

    // Insert metadata
    await supabase.from("soul_files").insert({
      user_id: userId,
      slug: file.slug,
      display_name: file.displayName,
      category: file.category,
      updated_by: file.updatedBy,
    });
  }

  return true;
}

// Delete a soul file
export async function deleteSoulFile(slug: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([`${userId}/${slug}.md`]);
  await supabase.from("soul_files").delete().eq("user_id", userId).eq("slug", slug);
  return true;
}
