#!/usr/bin/env bun
// Reads app/content/story/{locale}/*.md and emits app/src/lib/story-content.generated.ts
// Run with: bun run scripts/build-story.ts
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "content", "story");
const OUT = path.join(ROOT, "src", "lib", "story-content.generated.ts");

interface LocalePack {
  scroll: string;
  notes: string;
  episodes: Record<string, string>;
}

const locales: Record<string, LocalePack> = {};

for (const locale of fs.readdirSync(SRC_DIR).sort()) {
  const localeDir = path.join(SRC_DIR, locale);
  if (!fs.statSync(localeDir).isDirectory()) continue;

  const scrollPath = path.join(localeDir, "scroll.md");
  const notesPath = path.join(localeDir, "notes.md");
  const epDir = path.join(localeDir, "episodes");

  if (!fs.existsSync(scrollPath)) {
    console.log(`  skipping ${locale} — no scroll.md`);
    continue;
  }

  const scroll = fs.readFileSync(scrollPath, "utf8");
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, "utf8") : "";

  const episodes: Record<string, string> = {};
  if (fs.existsSync(epDir)) {
    for (const f of fs.readdirSync(epDir).sort()) {
      if (!f.endsWith(".md")) continue;
      const id = f.replace(/\.md$/, "");
      episodes[id] = fs.readFileSync(path.join(epDir, f), "utf8");
    }
  }

  locales[locale] = { scroll, notes, episodes };
  console.log(
    `  ${locale}: scroll ${scroll.length}c, notes ${notes.length}c, ${Object.keys(episodes).length} episodes`,
  );
}

let out = "// AUTO-GENERATED from app/content/story/{locale}/*.md — do not edit by hand.\n";
out += "// Regenerate with: bun run scripts/build-story.ts\n\n";
out += "export interface LocalePack {\n  scroll: string;\n  notes: string;\n  episodes: Record<string, string>;\n}\n\n";
out += "export const STORY_BY_LOCALE: Record<string, LocalePack> = ";
out += JSON.stringify(locales, null, 2);
out += ";\n\n";
out += "export const SUPPORTED_LOCALES = Object.keys(STORY_BY_LOCALE);\n";

fs.writeFileSync(OUT, out);
console.log(`\nWrote ${OUT}`);
console.log(`Locales: ${Object.keys(locales).join(", ")}`);
