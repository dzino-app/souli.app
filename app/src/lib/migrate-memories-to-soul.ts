import { getMemories } from "./memory";
import { getSoulFiles, updateSoulFile } from "./soul";

const CATEGORY_TO_SLUG: Record<string, string> = {
  personal: "osobnost",
  work: "praca",
  preferences: "preferencie",
  documents: "praca",
};

// One-time migration: convert flat memory facts into soul file content
export function migrateMemoriesToSoul(): boolean {
  if (typeof window === "undefined") return false;

  // Only run if there are memories but soul files are still default
  const memories = getMemories();
  if (memories.length === 0) return false;

  const alreadyMigrated = localStorage.getItem("dzino_soul_migrated");
  if (alreadyMigrated) return false;

  const soulFiles = getSoulFiles();

  // Group memories by target soul file
  const grouped: Record<string, string[]> = {};
  for (const memory of memories) {
    const slug = CATEGORY_TO_SLUG[memory.category] || "osobnost";
    if (!grouped[slug]) grouped[slug] = [];
    grouped[slug].push(memory.fact);
  }

  // Append to each soul file
  for (const [slug, facts] of Object.entries(grouped)) {
    const file = soulFiles.find((f) => f.slug === slug);
    if (file) {
      const newContent = file.content + "\n\n" + facts.map((f) => `- ${f}`).join("\n");
      updateSoulFile(slug, newContent, "dzino");
    }
  }

  localStorage.setItem("dzino_soul_migrated", "true");
  return true;
}
