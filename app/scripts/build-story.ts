#!/usr/bin/env bun
// Reads app/content/story/*.md and emits app/src/lib/story-content.generated.ts
// Run with: bun run scripts/build-story.ts
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "content", "story");
const OUT = path.join(ROOT, "src", "lib", "story-content.generated.ts");

const scroll = fs.readFileSync(path.join(SRC_DIR, "scroll.md"), "utf8");
const notes = fs.readFileSync(path.join(SRC_DIR, "notes.md"), "utf8");

const episodesDir = path.join(SRC_DIR, "episodes");
const episodes: Record<string, string> = {};
for (const f of fs.readdirSync(episodesDir).sort()) {
  if (!f.endsWith(".md")) continue;
  const id = f.replace(/\.md$/, "");
  episodes[id] = fs.readFileSync(path.join(episodesDir, f), "utf8");
}

let out = "// AUTO-GENERATED from app/content/story/*.md — do not edit by hand.\n";
out += "// Regenerate with: bun run scripts/build-story.ts\n\n";
out += `export const SCROLL = ${JSON.stringify(scroll)};\n\n`;
out += `export const NOTES = ${JSON.stringify(notes)};\n\n`;
out += "export const EPISODE_CONTENT: Record<string, string> = {\n";
for (const [id, content] of Object.entries(episodes)) {
  out += `  ${JSON.stringify(id)}: ${JSON.stringify(content)},\n`;
}
out += "};\n";

fs.writeFileSync(OUT, out);
console.log(`Wrote ${OUT} — scroll ${scroll.length}c, ${Object.keys(episodes).length} episodes`);
